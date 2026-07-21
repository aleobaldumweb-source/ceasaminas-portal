import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(currentDirectory, '../../../.env');

try {
  process.loadEnvFile(envPath);
} catch {
  if (!process.env.DATABASE_URL) {
    throw new Error(`Não foi possível carregar o .env em: ${envPath}`);
  }
}

async function bootstrap() {
  const { AppModule } = await import('./app.module.js');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Ceasaminas Digital')
    .setDescription('API inicial do portal, administração e integrações da Ceasaminas.')
    .setVersion('0.1.0')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(process.env.API_PORT ?? 3333);

  await app.listen(port, '0.0.0.0');

  console.log(`API Ceasaminas disponível em http://localhost:${port}/api/v1`);
  console.log(`Swagger disponível em http://localhost:${port}/docs`);
}

void bootstrap();
