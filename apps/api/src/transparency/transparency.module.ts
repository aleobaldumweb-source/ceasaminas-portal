import { Module } from '@nestjs/common';
import { TransparencyController } from './transparency.controller.js';
import { TransparencyService } from './transparency.service.js';

@Module({ controllers: [TransparencyController], providers: [TransparencyService] })
export class TransparencyModule {}
