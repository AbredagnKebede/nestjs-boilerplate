import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { MailService } from './mail/mail.service';
import { EmailVerificationService } from './email-verification/email-verification.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly mailService: MailService,
        private readonly emailVerificationService: EmailVerificationService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async register(registerDto: RegisterDto): Promise<{message: string}> {
        const already_exist = await this.userRepository.findOne({where: {email: registerDto.email}});
        if(already_exist) {
            throw new BadRequestException('Email already in use, please add other email!');
        }

        const user = this.userRepository.create({
            ...registerDto
        });
        const saved = await this.userRepository.save(user);

        if(saved) {
            const token = await this.emailVerificationService.generateToken(registerDto.email);
            await this.mailService.sendMail(registerDto.email, token);
            return {message: 'User successfully registered, please check your email to verify your email'};
        }

        return {message: 'User registration failed'};
    }

    async verifyEmail(token: string): Promise<{message: string}> { 
        const user = await this.emailVerificationService.verifyToken(token);
        if (user) {
            user.isEmailVerified = true;
            await this.userRepository.save(user);
            return { message: 'Email successfully verified' };
        }
        return { message: 'Email verification failed' };
    }
}