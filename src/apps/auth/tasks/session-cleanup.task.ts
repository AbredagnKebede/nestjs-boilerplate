import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from '../services/session.service';
import { JwtBlacklistService } from '../services/jwt-blacklist.service';
import { SecurityLogService } from '../services/security-log.service';

@Injectable()
export class SessionCleanupTask {
  private readonly logger = new Logger(SessionCleanupTask.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly jwtBlacklistService: JwtBlacklistService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    try {
      this.logger.log('Starting session cleanup task...');
      
      const cleanedSessions = await this.sessionService.cleanupExpiredSessions();
      const cleanedTokens = await this.jwtBlacklistService.cleanupExpiredTokens();
      
      this.logger.log(
        `Session cleanup completed: ${cleanedSessions} sessions, ${cleanedTokens} tokens cleaned`,
      );
    } catch (error) {
      this.logger.error('Session cleanup task failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyMaintenance() {
    try {
      this.logger.log('Starting daily maintenance task...');
      
      // Clean up old security logs (older than 90 days)
      const cleanedLogs = await this.securityLogService.cleanupOldLogs(90);
      
      this.logger.log(`Daily maintenance completed: ${cleanedLogs} old logs cleaned`);
    } catch (error) {
      this.logger.error('Daily maintenance task failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async weeklyMaintenance() {
    try {
      this.logger.log('Starting weekly maintenance task...');
      
      // Perform additional cleanup tasks
      await this.jwtBlacklistService.cleanupOldBlacklistedTokens();
      
      this.logger.log('Weekly maintenance completed');
    } catch (error) {
      this.logger.error('Weekly maintenance task failed:', error);
    }
  }
}
