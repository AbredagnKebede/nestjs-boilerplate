import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { Role } from '../../../common/enums/roles.enum';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get('GITHUB_CLIENT_SECRET') || '',
      callbackURL: `${configService.get('BASE_URL')}/api/v1/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      const { username, emails, photos, displayName } = profile;
      
      if (!emails || emails.length === 0) {
        return done(new UnauthorizedException('No email found in GitHub profile'), null);
      }

      const email = emails[0].value;
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        const names = displayName ? displayName.split(' ') : [username, ''];
        user = await this.usersService.create({
          email,
          firstName: names[0] || username || 'Unknown',
          lastName: names.slice(1).join(' ') || 'User',
          avatarUrl: photos?.[0]?.value,
          isEmailVerified: true, 
          password: this.generateRandomPassword(),  
        });
      } else {
        user.avatarUrl = photos?.[0]?.value;
        user.isEmailVerified = true;
        await this.usersService.update(user.id, user);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
  }
}
