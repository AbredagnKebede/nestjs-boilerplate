import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { AuthModule } from './apps/auth/auth.module';
import { UsersModule } from './apps/users/users.module';
import { HealthModule } from './apps/health/health.module';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import emailConfig from './config/email.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import { envValidationSchema } from './config/validation.schema';
import { abort, config } from 'process';
import { MailModule } from './apps/auth/mail/mail.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, emailConfig, redisConfig, storageConfig],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true }
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password:configService.get<string>('DATABASE_PASS'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + 'database/migrations/**/*{.ts,.js}'],
        synchronize: configService.get<boolean>('DATABASE_SYNC'),
        logging: configService.get<boolean>('DATABASE_LOGGING'),
        ssl: configService.get<boolean>('DATABASE_SSL'),
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        password: configService.get<string>('REDIS_PASSWORD'),
        ttl: configService.get<number>('REDIS_TTL'),
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL') ?? 60,
            limit: configService.get<number>('RATE_LIMIT_MAX') ?? 10,
          }
        ],
      }),
    }),


    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
          secure: configService.get<boolean>('EMAIL_SECURE'),
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('EMAIL_FROM')}>`,
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      })
    }),
    
    AuthModule,
    UsersModule,
    HealthModule,
    MailModule,
    RedisModule,
  ],
  providers: [
    HttpExceptionFilter,
    TransformInterceptor,
  ],

  exports: [
    HttpExceptionFilter,
    TransformInterceptor,
  ],
})
export class AppModule {}
