import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { MfaSecret } from '../entities/mfa-secret.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(MfaSecret)
    private readonly mfaSecretRepository: Repository<MfaSecret>,
    private readonly configService: ConfigService,
  ) {}

  async generateSecret(userId: string, userEmail: string): Promise<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  }> {
    let mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    const appName = this.configService.get('APP_NAME') || 'NestJS Boilerplate';
    
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    });

    const backupCodes = this.generateBackupCodes();

    if (mfaSecret) {
      mfaSecret.secret = secret.base32;
      mfaSecret.backupCodes = backupCodes;
      mfaSecret.isEnabled = false;  
    } else {
      mfaSecret = this.mfaSecretRepository.create({
        userId,
        secret: secret.base32,
        backupCodes,
        isEnabled: false,
      });
    }

    await this.mfaSecretRepository.save(mfaSecret);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32,
    };
  }

  async verifyTotpCode(userId: string, totpCode: string): Promise<boolean> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    if (!mfaSecret) {
      throw new NotFoundException('MFA not set up for this user');
    }

    return speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token: totpCode,
      window: 2,  
    });
  }

  async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    if (!mfaSecret || !mfaSecret.backupCodes) {
      return false;
    }

    const codeIndex = mfaSecret.backupCodes.indexOf(backupCode);
    if (codeIndex === -1) {
      return false;
    }

    mfaSecret.backupCodes.splice(codeIndex, 1);
    mfaSecret.backupCodesUsed += 1;
    await this.mfaSecretRepository.save(mfaSecret);

    return true;
  }

  async enableMfa(userId: string, totpCode: string): Promise<{ backupCodes: string[] }> {
    const isValid = await this.verifyTotpCode(userId, totpCode);
    if (!isValid) {
      throw new BadRequestException('Invalid TOTP code');
    }

    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    if (!mfaSecret) {
      throw new NotFoundException('MFA secret not found');
    }
    mfaSecret.isEnabled = true;
    await this.mfaSecretRepository.save(mfaSecret);

    return { backupCodes: mfaSecret.backupCodes };
  }

  async disableMfa(userId: string): Promise<void> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    if (mfaSecret) {
      mfaSecret.isEnabled = false;
      await this.mfaSecretRepository.save(mfaSecret);
    }
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId, isEnabled: true },
    });

    return !!mfaSecret;
  }

  async getMfaStatus(userId: string): Promise<{
    isEnabled: boolean;
    backupCodesCount?: number;
  }> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    if (!mfaSecret) {
      return { isEnabled: false };
    }

    return {
      isEnabled: mfaSecret.isEnabled,
      backupCodesCount: mfaSecret.backupCodes ? 
        mfaSecret.backupCodes.length : 0,
    };
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId },
    });

    if (!mfaSecret) {
      throw new NotFoundException('MFA not set up for this user');
    }

    const newBackupCodes = this.generateBackupCodes();
    mfaSecret.backupCodes = newBackupCodes;
    mfaSecret.backupCodesUsed = 0;
    
    await this.mfaSecretRepository.save(mfaSecret);

    return newBackupCodes;
  }
}