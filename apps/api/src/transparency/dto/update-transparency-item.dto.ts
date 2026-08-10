import { PartialType } from '@nestjs/swagger';
import { CreateTransparencyItemDto } from './create-transparency-item.dto.js';

export class UpdateTransparencyItemDto extends PartialType(CreateTransparencyItemDto) {}
