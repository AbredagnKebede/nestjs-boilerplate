import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, minLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        description: 'Email of the user',
        example: 'abredagn@gmail.com',
    })
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;

    @ApiProperty({
        description: 'First name of the user',
        example: 'Abredagn',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    firstName: string;

    @ApiProperty({
        description: 'Last name of the user',
        example: 'Dagnall',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    lastName: string;

    @ApiProperty({
        description: 'Password of the user',
        example: 'StrongP@ss123',
        minLength: 8,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        {
        message: 'Password too weak. Include uppercase, lowercase, number, and special character.',
        },
  )
    password: string;
}