import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum NewsPublicationStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateNewsDto {
  @IsString()
  @Length(3, 180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @Length(3, 100)
  category!: string;

  @IsString()
  @Length(10, 500)
  summary!: string;

  @IsString()
  @Length(10, 100000)
  content!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== '')
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  sourceUrl?: string;

  @IsOptional()
  @IsEnum(NewsPublicationStatus)
  status?: NewsPublicationStatus;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
