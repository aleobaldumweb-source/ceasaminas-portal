import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MarketService } from './market.service.js';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('bulletins')
  @ApiOperation({ summary: 'Lista os boletins recentes exibidos no portal público' })
  @ApiQuery({ name: 'limit', required: false, example: 12 })
  bulletins(@Query('limit') limit?: string) {
    return this.marketService.getRecentBulletins(limit ? Number(limit) : 12);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Retorna o painel consolidado de mercado' })
  @ApiQuery({ name: 'product', required: false })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  dashboard(@Query('product') product?: string, @Query('days') days?: string) {
    return this.marketService.getDashboard({
      product,
      days: days ? Number(days) : 30,
    });
  }

  @Get('prices')
  @ApiOperation({ summary: 'Lista as cotações mais recentes por produto' })
  @ApiQuery({ name: 'product', required: false })
  prices(@Query('product') product?: string) {
    return this.marketService.getLatestPrices(product);
  }

  @Get('history/:product')
  @ApiOperation({ summary: 'Retorna o histórico de preços de um produto' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  history(@Param('product') product: string, @Query('days') days?: string) {
    return this.marketService.getHistory(product, days ? Number(days) : 30);
  }
}
