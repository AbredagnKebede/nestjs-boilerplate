import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { UserSeeder } from './user.seeder';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const userSeeder = appContext.get(UserSeeder);
  
  try {
    await userSeeder.seed();
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed', error);
  } finally {
    await appContext.close();
  }
}

bootstrap();