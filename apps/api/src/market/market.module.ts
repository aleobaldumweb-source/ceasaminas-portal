import { Module } from '@nestjs/common';
import { MarketController } from './market.controller.js';
import { MarketService } from './market.service.js';
import { BulletinParserService } from './import/bulletin-parser.service.js';
import { MarketImportController } from './import/market-import.controller.js';
import { MarketImportService } from './import/market-import.service.js';

@Module({
  controllers: [MarketController, MarketImportController],
  providers: [MarketService, BulletinParserService, MarketImportService],
})
export class MarketModule {}
