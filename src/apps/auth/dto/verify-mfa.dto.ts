import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMfaDto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456',
    required: false
  })
  @IsString()
  @IsOptional()
  totpCode?: string;

  @ApiProperty({
    description: 'Backup code for account recovery',
    example: 'backup-code-123',
    required: false
  })
  @IsString()
  @IsOptional()
  backupCode?: string;
}