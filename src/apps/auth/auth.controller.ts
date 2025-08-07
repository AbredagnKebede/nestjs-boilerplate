import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import type { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
 
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string ) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }
        return this.authService.verifyEmail(token);
    }

    @Post('resend-verification')
    async resendVerificationEmail(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.resendVerificationEmail(refreshTokenDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Body() loginDto: LoginDto, @CurrentUser() user: User, @Req() req: ExpressRequest ) {
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip
        return this.authService.login(user, userAgent, ipAddress)         
    } 
    
    @Post('forgot-password')
    async forgotPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
        return this.authService.forgotPassword(forgetPasswordDto);
    }

    @Post('reset-password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
    }

}
