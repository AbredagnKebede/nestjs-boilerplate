import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoginAttempt } from '../entities/login-attempt.entity';
import { User } from '../../users/entities/user.entity';
import { SecurityLogService } from './security-log.service';
import { SecurityEventType } from '../entities/security-log.entity';

@Injectable()
export class AccountLockoutService {
  private readonly maxFailedAttempts: number;
  private readonly lockoutDurationMinutes: number;
  private readonly attemptWindowMinutes: number;

  constructor(
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly securityLogService: SecurityLogService,
  ) {
    this.maxFailedAttempts = this.configService.get('MAX_FAILED_LOGIN_ATTEMPTS') || 5;
    this.lockoutDurationMinutes = this.configService.get('ACCOUNT_LOCKOUT_DURATION_MINUTES') || 30;
    this.attemptWindowMinutes = this.configService.get('LOGIN_ATTEMPT_WINDOW_MINUTES') || 15;
  }

  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    isSuccessful: boolean,
    user?: User,
    failureReason?: string,
  ): Promise<void> {
    const loginAttempt = this.loginAttemptRepository.create({
      email,
      ipAddress,
      userAgent,
      isSuccessful,
      failureReason,
      user,
      userId: user?.id,
    });

    await this.loginAttemptRepository.save(loginAttempt);

    if (isSuccessful) {
      // Clear any existing lockout for successful login
      await this.clearAccountLockout(email);
      await this.securityLogService.logEvent(
        SecurityEventType.LOGIN_SUCCESS,
        ipAddress,
        userAgent,
        user?.id,
        email,
      );
    } else {
      await this.securityLogService.logEvent(
        SecurityEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        user?.id,
        email,
        { reason: failureReason },
      );

      // Check if account should be locked
      await this.checkAndLockAccount(email, ipAddress, userAgent);
    }
  }

  async isAccountLocked(email: string): Promise<boolean> {
    const lockoutKey = `lockout:${email}`;
    const lockedUntil = await this.cacheManager.get(lockoutKey);
    
    if (!lockedUntil) {
      return false;
    }

    const lockoutTime = parseInt(lockedUntil as string);
    const now = Date.now();

    if (now > lockoutTime) {
      // Lockout expired, clear it
      await this.cacheManager.del(lockoutKey);
      return false;
    }

    return true;
  }

  async getLockoutInfo(email: string): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
    attemptsRemaining?: number;
  }> {
    const lockoutKey = `lockout:${email}`;
    const lockedUntil = await this.cacheManager.get(lockoutKey);

    if (lockedUntil) {
      const lockoutTime = parseInt(lockedUntil as string);
      const now = Date.now();

      if (now <= lockoutTime) {
        return {
          isLocked: true,
          lockedUntil: new Date(lockoutTime),
        };
      } else {
        await this.cacheManager.del(lockoutKey);
      }
    }

    // Check recent failed attempts
    const recentFailedAttempts = await this.getRecentFailedAttempts(email);
    const attemptsRemaining = Math.max(0, this.maxFailedAttempts - recentFailedAttempts);

    return {
      isLocked: false,
      attemptsRemaining,
    };
  }

  private async checkAndLockAccount(
    email: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const recentFailedAttempts = await this.getRecentFailedAttempts(email);

    if (recentFailedAttempts >= this.maxFailedAttempts) {
      await this.lockAccount(email, ipAddress, userAgent);
    }
  }

  private async getRecentFailedAttempts(email: string): Promise<number> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - this.attemptWindowMinutes);

    const count = await this.loginAttemptRepository.count({
      where: {
        email,
        isSuccessful: false,
        createdAt: MoreThan(windowStart),
      },
    });

    return count;
  }

  private async lockAccount(
    email: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    const lockUntil = Date.now() + (this.lockoutDurationMinutes * 60 * 1000);
    const lockoutKey = `lockout:${email}`;

    await this.cacheManager.set(
      lockoutKey,
      lockUntil.toString(),
      this.lockoutDurationMinutes * 60 * 1000,
    );

    // Find user and log security event
    const user = await this.userRepository.findOne({ where: { email } });
    await this.securityLogService.logEvent(
      SecurityEventType.ACCOUNT_LOCKED,
      ipAddress,
      userAgent,
      user?.id,
      email,
      { 
        lockUntil: new Date(lockUntil).toISOString(),
        maxAttempts: this.maxFailedAttempts,
      },
    );
  }

  async clearAccountLockout(email: string): Promise<void> {
    const lockoutKey = `lockout:${email}`;
    await this.cacheManager.del(lockoutKey);
  }

  async unlockAccount(email: string, adminId?: string): Promise<void> {
    await this.clearAccountLockout(email);

    const user = await this.userRepository.findOne({ where: { email } });
    await this.securityLogService.logEvent(
      SecurityEventType.ACCOUNT_UNLOCKED,
      'system',
      'admin-action',
      user?.id,
      email,
      { unlockedBy: adminId },
    );
  }
}