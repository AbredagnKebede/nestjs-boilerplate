import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse 
} from '@nestjs/swagger';
import { MfaService } from '../services/mfa.service';
import { SecurityLogService } from '../services/security-log.service';
import { EnhancedJwtAuthGuard } from '../guards/enhanced-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { MfaSetupDto } from '../dto/mfa-setup.dto';
import { VerifyMfaDto } from '../dto/verify-mfa.dto';
import { SecurityEventType } from '../entities/security-log.entity';

@ApiTags('Multi-Factor Authentication')
@Controller('auth/mfa')
@UseGuards(EnhancedJwtAuthGuard)
@ApiBearerAuth()
export class MfaController {
  constructor(
    private readonly mfaService: MfaService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get MFA status for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isEnabled: { type: 'boolean' },
        backupCodesCount: { type: 'number' }
      }
    }
  })
  async getMfaStatus(@CurrentUser() user: User) {
    return this.mfaService.getMfaStatus(user.id);
  }

  @Post('setup')
  @ApiOperation({ summary: 'Setup MFA for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup initiated successfully',
    schema: {
      type: 'object',
      properties: {
        qrCodeUrl: { type: 'string' },
        manualEntryKey: { type: 'string' },
        message: { type: 'string' }
      }
    }
  })
  async setupMfa(@CurrentUser() user: User) {
    const { qrCodeUrl, manualEntryKey } = await this.mfaService.generateSecret(
      user.id, 
      user.email
    );

    return {
      qrCodeUrl,
      manualEntryKey,
      message: 'Scan the QR code with your authenticator app, then verify with a TOTP code to complete setup'
    };
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable MFA after setup verification' })
  @ApiResponse({
    status: 200,
    description: 'MFA enabled successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        backupCodes: { 
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async enableMfa(
    @CurrentUser() user: User,
    @Body() mfaSetupDto: MfaSetupDto,
  ) {
    const result = await this.mfaService.enableMfa(user.id, mfaSetupDto.totpCode);

    await this.securityLogService.logEvent(
      SecurityEventType.MFA_ENABLED,
      'system',
      'user-action',
      user.id,
      user.email,
    );

    return {
      message: 'MFA enabled successfully. Please save your backup codes in a secure location.',
      backupCodes: result.backupCodes,
    };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA for current user' })
  @ApiResponse({
    status: 200,
    description: 'MFA disabled successfully'
  })
  async disableMfa(@CurrentUser() user: User) {
    await this.mfaService.disableMfa(user.id);

    await this.securityLogService.logEvent(
      SecurityEventType.MFA_DISABLED,
      'system',
      'user-action',
      user.id,
      user.email,
    );

    return {
      message: 'MFA has been disabled for your account'
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({
    status: 200,
    description: 'MFA verification successful'
  })
  async verifyMfa(
    @CurrentUser() user: User,
    @Body() verifyMfaDto: VerifyMfaDto,
  ) {
    let isValid = false;
    let usedBackupCode = false;

    // Try TOTP code first
    if (verifyMfaDto.totpCode) {
      isValid = await this.mfaService.verifyTotpCode(user.id, verifyMfaDto.totpCode);
    }

    // Try backup code if TOTP failed
    if (!isValid && verifyMfaDto.backupCode) {
      isValid = await this.mfaService.verifyBackupCode(user.id, verifyMfaDto.backupCode);
      usedBackupCode = isValid;
    }

    if (isValid) {
      await this.securityLogService.logEvent(
        SecurityEventType.MFA_SUCCESS,
        'system',
        'user-action',
        user.id,
        user.email,
        { usedBackupCode }
      );

      return {
        success: true,
        message: 'MFA verification successful',
        usedBackupCode
      };
    } else {
      await this.securityLogService.logEvent(
        SecurityEventType.MFA_FAILED,
        'system',
        'user-action',
        user.id,
        user.email,
      );

      return {
        success: false,
        message: 'Invalid MFA code'
      };
    }
  }

  @Post('backup-codes/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({
    status: 200,
    description: 'Backup codes regenerated successfully'
  })
  async regenerateBackupCodes(@CurrentUser() user: User) {
    const backupCodes = await this.mfaService.regenerateBackupCodes(user.id);

    return {
      message: 'New backup codes generated. Previous codes are now invalid.',
      backupCodes
    };
  }
}