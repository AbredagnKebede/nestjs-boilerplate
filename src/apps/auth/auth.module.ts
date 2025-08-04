import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [MailModule, ConfigModule, RedisModule],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
