import { prisma } from '@ceasaminas/database';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { connect as connectTcp } from 'node:net';
import { connect as connectTls } from 'node:tls';
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
    const [database, redis, uploads] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkUploads(),
    ]);
    const checks = {
      database: database.status === 'fulfilled' ? 'ok' : 'unavailable',
      redis: redis.status === 'fulfilled' ? 'ok' : 'unavailable',
      uploads: uploads.status === 'fulfilled' ? 'ok' : 'unavailable',
    } as const;

    if (
      database.status === 'rejected' ||
      redis.status === 'rejected' ||
      uploads.status === 'rejected'
    ) {
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

  private checkRedis() {
    const target = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
    if (!['redis:', 'rediss:'].includes(target.protocol)) {
      return Promise.reject(new Error('Protocolo Redis inválido.'));
    }

    return new Promise<void>((resolve, reject) => {
      const socket =
        target.protocol === 'rediss:'
          ? connectTls({ host: target.hostname, port: Number(target.port || 6379) })
          : connectTcp({ host: target.hostname, port: Number(target.port || 6379) });
      const commands: string[][] = [];
      if (target.password) {
        commands.push(
          target.username
            ? ['AUTH', decodeURIComponent(target.username), decodeURIComponent(target.password)]
            : ['AUTH', decodeURIComponent(target.password)],
        );
      }
      commands.push(['PING']);

      const finish = (error?: Error) => {
        socket.destroy();
        if (error) reject(error);
        else resolve();
      };
      socket.setTimeout(1500, () => finish(new Error('Tempo limite do Redis excedido.')));
      socket.once('error', finish);
      socket.once(target.protocol === 'rediss:' ? 'secureConnect' : 'connect', () => {
        socket.write(commands.map((command) => this.redisCommand(command)).join(''));
      });
      let response = '';
      socket.on('data', (chunk) => {
        response += chunk.toString('utf8');
        if (response.includes('-')) finish(new Error('Redis rejeitou a sonda.'));
        else if (response.includes('+PONG\r\n')) finish();
      });
    });
  }

  private redisCommand(parts: string[]) {
    return `*${parts.length}\r\n${parts.map((part) => `$${Buffer.byteLength(part)}\r\n${part}\r\n`).join('')}`;
  }

  private async checkUploads() {
    await checkLocalStorage();
  }
}
