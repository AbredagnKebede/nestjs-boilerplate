import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto { 
    @ApiProperty({
        description: 'Email of the user',
        example: 'abredagn@gmail.com',
    })
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;

    @ApiProperty({
        description: 'Password for the user account',
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
