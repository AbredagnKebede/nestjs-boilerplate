import { IsNotEmpty, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgetPasswordDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'example@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}