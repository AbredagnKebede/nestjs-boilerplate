import { IsNotEmpty, IsEmail } from "class-validator";

export class ForgetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}