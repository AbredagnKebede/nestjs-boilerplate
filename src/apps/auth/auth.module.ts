import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaController } from './controllers/mfa.controller';
import { SessionController } from './controllers/session.controller';
import { MailModule } from './mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../../redis/redis.module';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MfaSecret } from './entities/mfa-secret.entity';
import { LoginAttempt } from './entities/login-attempt.entity';
import { SecurityLog } from './entities/security-log.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';

// Services
import { MfaService } from './services/mfa.service';
import { SecurityLogService } from './services/security-log.service';
import { JwtBlacklistService } from './services/jwt-blacklist.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { SessionService } from './services/session.service';

// Guards
import { RolesGuard } from './guards/roles.guard';
import { EnhancedJwtAuthGuard } from './guards/enhanced-jwt-auth.guard';
import { MfaGuard } from './guards/mfa.guard';

// Tasks
import { SessionCleanupTask } from './tasks/session-cleanup.task';

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
  controllers: [AuthController, MfaController, SessionController],
  providers: [
    // Core Auth
    AuthService, 
    EmailVerificationService,
    
    // Security Services
    MfaService,
    SecurityLogService,
    JwtBlacklistService,
    AccountLockoutService,
    SessionService,
    
    // Strategies
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    GithubStrategy,
    
    // Guards
    RolesGuard,
    EnhancedJwtAuthGuard,
    MfaGuard,
    
    // Tasks
    SessionCleanupTask,
  ],
  exports: [
    AuthService, 
    MfaService, 
    SecurityLogService, 
    JwtBlacklistService,
    AccountLockoutService,
    SessionService,
    RolesGuard,
    EnhancedJwtAuthGuard,
    MfaGuard,
    GoogleStrategy,
    GithubStrategy,
  ]
})
export class AuthModule {}
