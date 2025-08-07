import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
import type { Request as ExpressRequest } from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ReverificationDto } from './dto/reverification.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

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
    async resendVerificationEmail(@Body() reverificationDto: ReverificationDto) {
        return this.authService.resendVerificationEmail(reverificationDto);
    }

    @UseGuards(LocalAuthGuard)
    @ApiOperation({ summary: 'Login with email and password' })
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
        return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    async refresh(@CurrentUser() user: User, refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshTokens(user.id, refreshTokenDto.refreshToken);
    }

    @ApiBearerAuth()
    @Post('logout')
    async logout(@Body() refereshTokenDto: RefreshTokenDto) {
        await this.authService.revokeRefreshToken(refereshTokenDto.refreshToken);
        return {message: 'Logout successful!'}
    }

    @Post('logout-all')
    async logoutAll(@CurrentUser() user: User) {
        await this.authService.revokeAllUserRefreshTokens(user.id);
        return { message: 'User logged out of all devicesLogged out from all devices successfully' }
    }

}
