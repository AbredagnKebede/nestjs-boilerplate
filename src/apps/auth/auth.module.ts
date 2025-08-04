import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../../redis/redis.module';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    MailModule,
    ConfigModule, 
    RedisModule,
    UsersModule,
    TypeOrmModule.forFeature([User])
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailVerificationService],
  exports: [AuthService]
})
export class AuthModule {}
