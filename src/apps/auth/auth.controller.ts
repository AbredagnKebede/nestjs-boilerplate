import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
 
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string ) {
        return this.authService.verifyEmail(token);
    }
}
