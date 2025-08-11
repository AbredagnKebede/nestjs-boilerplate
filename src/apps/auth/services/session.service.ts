import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { SecurityLogService } from './security-log.service';
import { SecurityEventType } from '../entities/security-log.entity';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly securityLogService: SecurityLogService,
  ) {}

  async getUserSessions(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    return this.refreshTokenRepository.count({
      where: { userId, isRevoked: false },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.refreshTokenRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    session.isRevoked = true;
    await this.refreshTokenRepository.save(session);

    await this.securityLogService.logEvent(
      SecurityEventType.SESSION_REVOKED,
      'system',
      'session-management',
      userId,
      undefined,
      { sessionId, userAgent: session.userAgent, ipAddress: session.ipAddress },
    );

    this.logger.log(`Session ${sessionId} revoked for user ${userId}`);
  }

  async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false, id: currentSessionId },
      { isRevoked: true },
    );

    await this.securityLogService.logEvent(
      SecurityEventType.SESSION_REVOKED,
      'system',
      'session-management',
      userId,
      undefined,
      { type: 'other_sessions', currentSessionId },
    );

    this.logger.log(`All other sessions revoked for user ${userId}`);
  }

  async getSessionAnalytics(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    revokedSessions: number;
    lastActivity: Date | null;
    deviceTypes: Record<string, number>;
  }> {
    const sessions = await this.getUserSessions(userId);
    const allSessions = await this.refreshTokenRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const deviceTypes: Record<string, number> = {};
    sessions.forEach(session => {
      const deviceType = this.getDeviceType(session.userAgent);
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
    });

    return {
      totalSessions: allSessions.length,
      activeSessions: sessions.length,
      revokedSessions: allSessions.length - sessions.length,
      lastActivity: sessions[0]?.createdAt || null,
      deviceTypes,
    };
  }

  private getDeviceType(userAgent: string): string {
    if (!userAgent) return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
      return 'Desktop';
    } else if (ua.includes('bot') || ua.includes('crawler')) {
      return 'Bot';
    }
    
    return 'Other';
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await this.refreshTokenRepository.find({
      where: { isRevoked: false },
    });

    const now = new Date();
    let cleanedCount = 0;

    for (const session of expiredSessions) {
      if (session.isExpired()) {
        session.isRevoked = true;
        await this.refreshTokenRepository.save(session);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }
}
