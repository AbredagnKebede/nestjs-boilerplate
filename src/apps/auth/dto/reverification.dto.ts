import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ReverificationDto {
    @ApiProperty({
        description: 'User email',
        example: 'example@gmail.com',
    })
    @IsEmail()
    email: string;
}