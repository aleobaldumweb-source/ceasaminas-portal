import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { resolve } from 'node:path';
import {
  apiPort,
  apiPrefix,
  apiPublicUrl,
  corsOrigins,
  swaggerEnabled,
} from './config/runtime-config.js';

config({ path: resolve(process.cwd(), '../../.env') });

async function bootstrap() {
  const { AppModule } = await import('./app.module.js');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  app.useStaticAssets(resolve(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  const prefix = apiPrefix();
  apiPublicUrl();
  app.setGlobalPrefix(prefix);
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-bootstrap-token'],
  });

  app.use(
    `/${prefix}/auth/login`,
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { statusCode: 429, message: 'Muitas tentativas de login. Aguarde alguns minutos.' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (swaggerEnabled()) {
    const configSwagger = new DocumentBuilder()
      .setTitle('API Ceasaminas Digital')
      .setDescription('API do portal, administração e integrações da Ceasaminas.')
      .setVersion('0.3.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, configSwagger));
  }
  await app.listen(apiPort(), '0.0.0.0');
}

void bootstrap();
