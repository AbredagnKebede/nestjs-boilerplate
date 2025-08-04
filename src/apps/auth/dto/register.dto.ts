import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, minLength } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

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