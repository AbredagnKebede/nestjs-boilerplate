import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'User email',
        example: 'abrdagn@gmail.com',
    })
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;

    @ApiProperty({
        description: 'User first name',
        example: 'Abredagn',
    })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Kebede',
    })
    @IsNotEmpty()       
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'User password',
        example: 'Password@123!',
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