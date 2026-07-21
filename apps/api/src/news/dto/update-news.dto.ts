import { PartialType } from '@nestjs/swagger';
import { CreateNewsDto } from './create-news.dto.js';

export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
