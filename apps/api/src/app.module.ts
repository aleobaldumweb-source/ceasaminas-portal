import { Module } from '@nestjs/common';
import { MarketModule } from './market/market.module.js';
import { HealthController } from './health/health.controller.js';
import { NewsModule } from './news/news.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProcurementsModule } from './procurement/procurements.module.js';

@Module({
  imports: [MarketModule, AuthModule, NewsModule, UsersModule, ProcurementsModule],
  controllers: [HealthController],
})
export class AppModule {}
