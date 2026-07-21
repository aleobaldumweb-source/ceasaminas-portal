import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller.js';
import { NewsModule } from './news/news.module.js';

@Module({
  imports: [NewsModule],
  controllers: [HealthController],
})
export class AppModule {}
