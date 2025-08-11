    import { ApiProperty } from '@nestjs/swagger';
    import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, minLength } from 'class-validator';

    export class CreateUserDto {
        @ApiProperty({
            description: 'Email of the user',
            example: 'example@gmail.com',
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
            example: 'Kebede',
        })
        @IsNotEmpty()
        @IsString()
        @MinLength(2)
        lastName: string;

        @IsString()
        @IsOptional()
        avatarUrl?: string;

        @IsOptional()
        isEmailVerified?: boolean;


        @ApiProperty({
            description: 'Password of the user',
            example: 'StrongP@ss123',
            minLength: 8,
        })
        @IsNotEmpty()
        @IsString()
        @MinLength(8)
        @Matches(
            /^(?=.*[a-z])(?=.*[A-sZ])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            {
            message: 'Password too weak. Include uppercase, lowercase, number, and special character.',
            },
    )
        password: string;
    }