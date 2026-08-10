import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
} from 'class-validator';

export enum TransparencyStatusDto {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateTransparencyItemDto {
  @IsString() @Length(3, 160) title!: string;
  @IsString() @Length(10, 1000) description!: string;
  @IsString() @Length(2, 80) category!: string;
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) url!: string;
  @IsOptional() @IsEnum(TransparencyStatusDto) status?: TransparencyStatusDto;
  @IsOptional() @IsInt() @Min(0) @Max(10000) sortOrder?: number;
  @IsOptional() @IsDateString() publishedAt?: string;
}
