import { prisma } from '@ceasaminas/database';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { checkLocalStorage } from '../storage/local-storage.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Verifica se o processo da API está ativo' })
  live() {
    return this.response('ok');
  }

  @Get()
  @ApiOperation({ summary: 'Verifica se a API está pronta para receber tráfego' })
  async check() {
    const [database, uploads] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkUploads(),
    ]);
    const checks = {
      database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
      uploads: uploads.status === 'fulfilled' ? 'ok' : 'unavailable',
    } as const;

    if (database.status === 'rejected' || uploads.status === 'rejected') {
      throw new ServiceUnavailableException({ ...this.response('unavailable'), checks });
    }

    return { ...this.response('ok'), checks };
  }

  private response(status: 'ok' | 'unavailable') {
    return { status, service: 'ceasaminas-api', timestamp: new Date().toISOString() };
  }

  private async checkDatabase() {
    await prisma.$queryRaw`SELECT 1`;
  }

  private async checkUploads() {
    await checkLocalStorage();
  }
}
