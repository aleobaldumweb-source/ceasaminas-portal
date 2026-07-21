import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

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
  @IsEnum(NewsPublicationStatus)
  status?: NewsPublicationStatus;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
