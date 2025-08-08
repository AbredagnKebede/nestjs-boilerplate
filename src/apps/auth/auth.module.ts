import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaController } from './controllers/mfa.controller';
import { MailModule } from './mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../../redis/redis.module';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { MailService } from './mail/mail.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { MfaSecret } from './entities/mfa-secret.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { SecurityLog } from './entities/security-log.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

// Services
import { MfaService } from './services/mfa.service';
import { SecurityLogService } from './services/security-log.service';
import { JwtBlacklistService } from './services/jwt-blacklist.service';
import { AccountLockoutService } from './services/account-lockout.service';

// Guards
import { RolesGuard } from './guards/roles.guard';
import { EnhancedJwtAuthGuard } from './guards/enhanced-jwt-auth.guard';
import { MfaGuard } from './guards/mfa.guard';

@Module({
  imports: [
    MailModule,
    ConfigModule, 
    RedisModule,
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User, 
      RefreshToken, 
      MfaSecret, 
      LoginAttempt, 
      SecurityLog
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {expiresIn: configService.get('JWT_EXPIRES_IN')},
      }),
    }),
  ],
  controllers: [AuthController, MfaController],
  providers: [
    // Core Auth
    AuthService, 
    EmailVerificationService,
    
    // Security Services
    MfaService,
    SecurityLogService,
    JwtBlacklistService,
    AccountLockoutService,
    
    // Strategies
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    
    // Guards
    RolesGuard,
    EnhancedJwtAuthGuard,
    MfaGuard,
  ],
  exports: [
    AuthService, 
    MfaService, 
    SecurityLogService, 
    JwtBlacklistService,
    AccountLockoutService,
    RolesGuard,
    EnhancedJwtAuthGuard,
    MfaGuard,
  ]
})
export class AuthModule {}
