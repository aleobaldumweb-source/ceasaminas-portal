import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { NewsModule } from './news/news.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [AuthModule, NewsModule],
  controllers: [HealthController],
})
export class AppModule {}
