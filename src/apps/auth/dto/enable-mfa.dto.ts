import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MfaMethod {
  TOTP = 'totp',
  EMAIL = 'email'
}

export class EnableMfaDto {
  @ApiProperty({
    description: 'MFA method to enable',
    enum: MfaMethod,
    example: MfaMethod.TOTP
  })
  @IsNotEmpty()
  @IsEnum(MfaMethod)
  method: MfaMethod;

  @ApiProperty({
    description: 'TOTP code for verification (required for TOTP method)',
    example: '123456',
    required: false
  })
  @IsString()
  @IsOptional()
  totpCode?: string;
}