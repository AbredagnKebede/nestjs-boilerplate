import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/validators/password-strength.validator';

export class RegisterDto {
    @ApiProperty({
        description: 'User email',
        example: 'example@gmail.com',
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
    @IsStrongPassword()
    password: string;
}