import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginMfaDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password@123'
  })
  @IsNotEmpty()
  @IsString()
  password: string;

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