import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
        const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
        const mailOptions = {
            from: this.configService.get<string>('EMAIL_FROM'),
            to: email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking on the following link: ${verificationUrl}`,
        };        
        await this.transport.sendMail(mailOptions);
    }
}
