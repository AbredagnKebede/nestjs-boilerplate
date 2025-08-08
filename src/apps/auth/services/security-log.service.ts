import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityLog, SecurityEventType } from '../entities/security-log.entity';

@Injectable()
export class SecurityLogService {
  constructor(
    @InjectRepository(SecurityLog)
    private readonly securityLogRepository: Repository<SecurityLog>,
  ) {}

  async logEvent(
    eventType: SecurityEventType,
    ipAddress: string,
    userAgent?: string,
    userId?: string,
    email?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const log = this.securityLogRepository.create({
      eventType,
      ipAddress,
      userAgent,
      userId,
      email,
      metadata,
    });

    await this.securityLogRepository.save(log);
  }

  async getSecurityLogs(
    userId?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SecurityLog[]> {
    const queryBuilder = this.securityLogRepository.createQueryBuilder('log');

    if (userId) {
      queryBuilder.where('log.userId = :userId', { userId });
    }

    return queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  async getFailedLoginAttempts(
    email: string,
    timeWindowMinutes: number = 15,
  ): Promise<number> {
    const timeWindowStart = new Date();
    timeWindowStart.setMinutes(timeWindowStart.getMinutes() - timeWindowMinutes);

    const count = await this.securityLogRepository.count({
      where: {
        eventType: SecurityEventType.LOGIN_FAILED,
        email,
        createdAt: { $gte: timeWindowStart } as any,
      },
    });

    return count;
  }

  async getFailedLoginsByIp(
    ipAddress: string,
    timeWindowMinutes: number = 15,
  ): Promise<number> {
    const timeWindowStart = new Date();
    timeWindowStart.setMinutes(timeWindowStart.getMinutes() - timeWindowMinutes);

    const count = await this.securityLogRepository.count({
      where: {
        eventType: SecurityEventType.LOGIN_FAILED,
        ipAddress,
        createdAt: { $gte: timeWindowStart } as any,
      },
    });

    return count;
  }
}