import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ 
    example: 'NewPassword123!', 
    description: 'Password must be at least 8 characters long, contain uppercase, lowercase, number and special character' 
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message: 'Password too weak. Include uppercase, lowercase, number, and special character.',
    },
  )
  @IsNotEmpty()
  password: string;
}