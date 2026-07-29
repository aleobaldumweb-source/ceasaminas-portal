import { Module } from '@nestjs/common';
import { ProcurementsController } from './procurements.controller.js';
import { ProcurementsService } from './procurements.service.js';
@Module({ controllers: [ProcurementsController], providers: [ProcurementsService] })
export class ProcurementsModule {}
