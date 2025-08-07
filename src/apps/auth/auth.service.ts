import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { MailService } from './mail/mail.service';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid'; 
import { RefreshToken } from './entities/refresh-token.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { Not } from 'typeorm/browser';

@Injectable()
export class AuthService {
    constructor(
        private readonly mailService: MailService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly emailVerificationService: EmailVerificationService,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) {}

    async register(registerDto: RegisterDto): Promise<{message: string}> {
        try {
            const already_exist = await this.userRepository.findOne({where: {email: registerDto.email}});
            if(already_exist) {
                throw new BadRequestException('Email already in use, please add other email!');
            }

            const user = this.userRepository.create({
                ...registerDto
            });

            if(user) {
                const token = await this.emailVerificationService.generateToken(registerDto.email);
                await this.mailService.sendMail(registerDto.email, token);
                return {message: 'User successfully registered, please check your email to verify your email'};
            }

            return {message: 'User registration failed'};
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Registration failed: ' + error.message);
        }
    }

    async verifyEmail(token: string): Promise<{message: string}> { 
        const user = await this.emailVerificationService.verifyToken(token);
        if (user) {
            user.isEmailVerified = true;
            await this.userRepository.save(user);
            return { message: 'Email successfully verified' };
        }
        return { message: 'Email verification failed' };
    }

    async resendVerificationEmail(refreshTokenDto: RefreshTokenDto) {
        const exist = await this.userRepository.findOne({where: {email: refreshTokenDto.email}});
        if(!exist) { 
            throw new NotFoundException('User not registered yet');
        }

        if(!exist.isEmailVerified) {
            const token = await this.emailVerificationService.generateToken(refreshTokenDto.email);
            await this.mailService.sendMail(refreshTokenDto.email, token);
            return {message: 'Verification email resent. Please check your inbox.'}
        }
        return {message: 'User is already verified'};
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOneBy({email});
        const isPasswordValid = await user?.validatePassword(password);
        console.log('Comparing:', password, user?.password);
        console.log('Result:', user ? await user.validatePassword(password) : 'User is null');

        
        if(!isPasswordValid) {
            return null;
        }
        return user;
    }
    async login(user: User, userAgent?: string, ipAddress?: string) {
        await this.usersService.updateLastLogin(user.id);

        const [access_token, refresh_token] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user, userAgent, ipAddress),
        ]);
        return {
            access_token,
            refresh_token,
        };        
    }
    
    private async generateAccessToken(user: User): Promise<string> {
        const payload = {sub: user.id, email: user.email, role: user.role};
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        });
    }

    private async generateRefreshToken(user: User, userAgent?: string, ipAddress?: string) {
        const token = uuidv4();
        const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');

        const expiresAt = new Date();
        expiresAt.setTime(expiresAt.getTime() + this.parseDuration(expiresIn));

        const refreshToken = await this.refreshTokenRepository.create({
            token, 
            expiresAt,
            user, 
            userId: user.id,
            userAgent,
            ipAddress,
        });
        await this.refreshTokenRepository.save(refreshToken);

        const payload = {sub: user.id, email: user.email, jti: token}; 
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn,
        }); 
    }

    async validateRefreshToken(token: string, userId: string): Promise<boolean> {
        const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token, userId },
        });
        
        if (!refreshToken || refreshToken.isRevoked || refreshToken.isExpired()) {
        return false;
        }
        
        return true;
    }

    async revokeRefreshToken(token: string): Promise<void> {
        const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token },
        });
        
        if (!refreshToken) {
        throw new NotFoundException('Refresh token not found');
        }
        
        refreshToken.isRevoked = true;
        await this.refreshTokenRepository.save(refreshToken);
    }

    async revokeAllUserRefreshTokens(userId: string): Promise<void> {
        await this.refreshTokenRepository.update(
        { userId, isRevoked: false },
        { isRevoked: true },
        );
    }

    async forgotPassword(forgetPasswordDto: ForgetPasswordDto): Promise<{message: string}> {
        const email = forgetPasswordDto.email;
        const user = await this.usersService.findByEmail(email);

        if(!user) { 
            throw new  NotFoundException('User not found exception');
        }

        const reset_token = await this.emailVerificationService.generateToken(forgetPasswordDto.email);
        try{
            await this.mailService.sendResetEmail(email, reset_token);
        } catch(error) {
            console.error('Error sendign reset email')
        }
        
        return { message : 'Password reset email is sent. Please check your inbox'};
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await this.emailVerificationService.verifyToken(token);
        if(!user) { 
            throw new BadRequestException('Invalid reset token');
        }

        user.password = newPassword;
        await this.userRepository.save(user);
    }

    async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // Get the refresh token from the database
        const refreshTokenEntity = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
        relations: ['user'],
        });
        
        if (!refreshTokenEntity || refreshTokenEntity.isRevoked || refreshTokenEntity.isExpired()) {
        throw new UnauthorizedException('Invalid refresh token');
        }
        
        // Revoke the current refresh token
        refreshTokenEntity.isRevoked = true;
        await this.refreshTokenRepository.save(refreshTokenEntity);
        
        // Generate new tokens
        const user = refreshTokenEntity.user;
        const newAccessToken = await this.generateAccessToken(user);
        const newRefreshToken = await this.generateRefreshToken(
        user,
        refreshTokenEntity.userAgent,
        refreshTokenEntity.ipAddress,
        );
        
        return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        };
    }

    private parseDuration(duration: string): number {
        const regex = /^(\d+)([smhd])$/;
        const match = duration.match(regex);
        
        if (!match) {
        return 7 * 24 * 60 * 60 * 1000; 
        }
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
        case 's':
            return value * 1000; 
        case 'm':
            return value * 60 * 1000;  
        case 'h':
            return value * 60 * 60 * 1000;  
        case 'd':
            return value * 24 * 60 * 60 * 1000;  
        default:
            return 7 * 24 * 60 * 60 * 1000;  
        }
    }
}