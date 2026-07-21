import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health.controller.js';
// Preserve aqui os módulos já existentes, por exemplo:
// import { NewsModule } from './news/news.module.js';

@Module({
  imports: [
    AuthModule,
    // NewsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
