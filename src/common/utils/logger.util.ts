import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export function setupLogger(): LoggerService {
  return WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf((info) => {
            const { timestamp, level, message, context, ...meta } = info;
            
            return `${timestamp} [${level}] [${context || 'Application'}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          }),
        ),
      }),
      
      // Add file transport for production
      ...(process.env.NODE_ENV === 'production'
        ? [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          ]
        : []),
    ],
  });
}