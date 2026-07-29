import { PartialType } from '@nestjs/swagger';
import { CreateProcurementDto } from './create-procurement.dto.js';
export class UpdateProcurementDto extends PartialType(CreateProcurementDto) {}
