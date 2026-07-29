import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export enum ProcurementStatusDto {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}
export enum ProcurementModalityDto {
  PREGAO_ELETRONICO = 'PREGAO_ELETRONICO',
  CONCORRENCIA = 'CONCORRENCIA',
  DISPENSA = 'DISPENSA',
  INEXIGIBILIDADE = 'INEXIGIBILIDADE',
  TOMADA_DE_PRECOS = 'TOMADA_DE_PRECOS',
  CONVITE = 'CONVITE',
  OUTRA = 'OUTRA',
}

export class CreateProcurementDto {
  @IsString() @Length(2, 60) number!: string;
  @IsString() @Length(5, 220) title!: string;
  @IsString() @Length(10, 20000) description!: string;
  @IsEnum(ProcurementModalityDto) modality!: ProcurementModalityDto;
  @IsOptional() @IsEnum(ProcurementStatusDto) status?: ProcurementStatusDto;
  @IsOptional() @IsDateString() openingAt?: string;
  @IsOptional() @IsDateString() deadlineAt?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) estimatedValue?: number;
  @IsOptional() @IsString() @MaxLength(160) department?: string;
  @IsOptional() @IsEmail() @MaxLength(180) contactEmail?: string;
  @IsOptional() @IsDateString() publishedAt?: string;
}
