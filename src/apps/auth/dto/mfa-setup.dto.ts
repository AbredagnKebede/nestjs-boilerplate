import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupDto {
  @ApiProperty({
    description: 'TOTP code from authenticator app',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  totpCode: string;
}