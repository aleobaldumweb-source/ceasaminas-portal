import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

export type ParsedMarketPrice = {
  unitId: string;
  market: string;
  referenceAt: Date;
  marketCode: string;
  category: string;
  subgroup: string;
  group: string;
  productCode: string;
  productName: string;
  classification: string;
  classLevel: string;
  genericProduct: string;
  unit: string;
  unitCode: string;
  origin: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  categoryId: string;
  normalizedProduct: string;
};

export type ParsedMarketBulletin = {
  sheetName: string;
  market: string;
  referenceAt: Date;
  rows: ParsedMarketPrice[];
};

type CellValue = string | number | boolean | Date | null | undefined;

@Injectable()
export class BulletinParserService {
  parse(buffer: Buffer): ParsedMarketBulletin {
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true });
    } catch {
      throw new BadRequestException('Não foi possível ler o arquivo Excel.');
    }

    const sheetName =
      workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'plan1') ??
      workbook.SheetNames[0];

    if (!sheetName) {
      throw new BadRequestException('O arquivo não contém nenhuma planilha.');
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new BadRequestException(`A planilha "${sheetName}" não foi encontrada.`);
    }

    const matrix = XLSX.utils.sheet_to_json<CellValue[]>(sheet, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: false,
    });

    const rows = matrix
      .map((row, index) => this.parseRow(row, index + 1))
      .filter((row): row is ParsedMarketPrice => row !== null);

    if (rows.length === 0) {
      throw new BadRequestException(
        'Nenhuma cotação válida foi encontrada. Verifique se a planilha possui 20 colunas.',
      );
    }

    const referenceTime = rows[0]?.referenceAt.getTime();
    const market = rows[0]?.market;

    if (!referenceTime || !market) {
      throw new BadRequestException('Não foi possível identificar a data ou o mercado.');
    }

    const conflictingDate = rows.find((row) => row.referenceAt.getTime() !== referenceTime);
    if (conflictingDate) {
      throw new BadRequestException(
        'O arquivo contém mais de uma data de referência. Importe um boletim por vez.',
      );
    }

    return { sheetName, market, referenceAt: new Date(referenceTime), rows };
  }

  private parseRow(row: CellValue[], line: number): ParsedMarketPrice | null {
    if (!Array.isArray(row) || row.length === 0) return null;

    const productName = this.text(row[8]);
    const referenceAt = this.date(row[2]);
    const minPrice = this.money(row[15]);
    const avgPrice = this.money(row[16]);
    const maxPrice = this.money(row[17]);

    if (
      !productName ||
      !referenceAt ||
      minPrice === null ||
      avgPrice === null ||
      maxPrice === null
    ) {
      return null;
    }

    if (minPrice < 0 || avgPrice < 0 || maxPrice < 0) {
      throw new BadRequestException(`Linha ${line}: os preços não podem ser negativos.`);
    }

    if (minPrice > avgPrice || avgPrice > maxPrice) {
      throw new BadRequestException(`Linha ${line}: esperado preço mínimo ≤ médio ≤ máximo.`);
    }

    const market = this.requiredText(row[1], line, 'mercado');
    const category = this.requiredText(row[4], line, 'categoria');
    const unit = this.requiredText(row[12], line, 'unidade');

    return {
      unitId: this.text(row[0]),
      market,
      referenceAt,
      marketCode: this.text(row[3]),
      category,
      subgroup: this.text(row[5]),
      group: this.text(row[6]),
      productCode: this.text(row[7]),
      productName,
      classification: this.text(row[9]),
      classLevel: this.text(row[10]),
      genericProduct: this.text(row[11]),
      unit,
      unitCode: this.text(row[13]),
      origin: this.text(row[14]),
      minPrice,
      avgPrice,
      maxPrice,
      categoryId: this.text(row[18]),
      normalizedProduct: this.text(row[19]) || this.normalizeProduct(productName),
    };
  }

  private requiredText(value: CellValue, line: number, field: string): string {
    const parsed = this.text(value);
    if (!parsed) throw new BadRequestException(`Linha ${line}: campo "${field}" não informado.`);
    return parsed;
  }

  private text(value: CellValue): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, ' ').trim();
  }

  private money(value: CellValue): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
    }

    const text = this.text(value);
    if (!text) return null;

    const normalized = text
      .replace(/[R$\s]/g, '')
      .replace(/\.(?=\d{3}(?:\D|$))/g, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
  }

  private date(value: CellValue): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return this.utcDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    }

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) return this.utcDate(parsed.y, parsed.m - 1, parsed.d);
    }

    const text = this.text(value);
    if (!text) return null;

    const br = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
    if (br) return this.utcDate(Number(br[3]), Number(br[2]) - 1, Number(br[1]));

    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
    if (iso) return this.utcDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime())
      ? null
      : this.utcDate(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  private utcDate(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
  }

  private normalizeProduct(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
