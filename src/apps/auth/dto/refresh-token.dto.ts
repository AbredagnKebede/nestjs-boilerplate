import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Email of the user',
        example: 'abredagn@gmail.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;
}