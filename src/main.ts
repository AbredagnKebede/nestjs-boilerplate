import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestIdMiddleware } from './common/middlewares/request-id.middleware';
import { setupLogger } from './common/utils/logger.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {logger: setupLogger()});
  const configService = app.get(ConfigService);

  app.use(RequestIdMiddleware);
  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  });

  app.use(helmet());
  app.enableCors(configService.get('CORS'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  if (['development', 'staging'].includes(configService.get('NODE_ENV') ?? '')) {
    const config = new DocumentBuilder()
      .setTitle('Api Documentation')
      .setDescription('The API description')
      .setVersion('1.0')
      .addBasicAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document)
  }

  const port = configService.get('PORT');
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
