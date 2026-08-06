import { prisma } from '@ceasaminas/database';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class DatabaseLifecycleService implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await prisma.$disconnect();
  }
}
