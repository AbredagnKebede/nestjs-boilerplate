import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { Role } from '../../../common/enums/roles.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: `${configService.get('BASE_URL')}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      
      if (!emails || emails.length === 0) {
        return done(new UnauthorizedException('No email found in Google profile'), false);
      }

      const email = emails[0].value;
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Create new user
        user = await this.usersService.create({
          email,
          firstName: name.givenName || 'Unknown',
          lastName: name.familyName || 'User',
          avatarUrl: photos?.[0]?.value,
          isEmailVerified: true, // Google accounts are pre-verified
          password: this.generateRandomPassword(), // Will be hashed by entity
        });
      } else {
        // Update existing user's Google info
        user.avatarUrl = photos?.[0]?.value;
        user.isEmailVerified = true;
        await this.usersService.update(user.id, user);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
  }
}
