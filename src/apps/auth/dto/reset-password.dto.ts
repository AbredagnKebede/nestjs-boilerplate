import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Reset token',
        example: '123456',
    })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({
        description: 'New password',
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
    newPassword: string;

    @ApiProperty({
        description: 'Confirm new password',
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
    confirmNewPassword: string;
}