import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentMessageInfo } from 'nodemailer';
import * as nodemailer from 'nodemailer';
 
@Injectable()
export class MailService {
    private transport;

    constructor(private configService: ConfigService) {
        this.transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASSWORD'),
            }
        });
    }

    async sendMail(email: string, token: string): Promise<void> {
        const baseUrl = this.configService.get<string>('BASE_URL');
        const verificationUrl = `${baseUrl}/api/v1/auth/verify-email?token=${token}`;
        const mailOptions = {
            from: this.configService.get<string>('EMAIL_USER'),
            to: email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
        };        
        await this.transport.sendMail(mailOptions);
    }

    async sendResetEmail(email: string, reset_token: string): Promise<SentMessageInfo> {
        const frontendUrl = this.configService.get<string>('FRONT_END_URL');
        const resetUrl = `${frontendUrl}/public/reset-password.html?reset_token=${reset_token}`;

        const mailOptions = {
            from: this.configService.get<string>('EMAIL_USER'),
            to: email,
            subject: 'Password Reset',
            text: `Please reset your password by clicking on the following link: ${resetUrl}`,
        };

        const message = await this.transport.sendMail(mailOptions);
        return message;
    }

}
