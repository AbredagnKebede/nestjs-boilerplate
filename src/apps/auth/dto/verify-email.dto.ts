import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto { 
    @ApiProperty({
        description: 'Verification token',
        example: '123456',
    })
    @IsNotEmpty()
    @IsString()
    token: string;
}