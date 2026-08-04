import {
  BadRequestException,
  Controller,
  Get,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Role } from '../../auth/auth.types.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { MarketImportService } from './market-import.service.js';

const ALLOWED_EXTENSIONS = /\.(xlsx|xls)$/i;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

type MarketUpload = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@ApiTags('market')
@Controller('market')
export class MarketImportController {
  constructor(private readonly importService: MarketImportService) {}

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Importa um boletim de preços XLS/XLSX' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'replace', required: false, type: Boolean })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
          callback(new BadRequestException('Envie um arquivo com extensão .xls ou .xlsx.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  importBulletin(
    @UploadedFile() file: MarketUpload | undefined,
    @Query('replace', new ParseBoolPipe({ optional: true })) replace = false,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('O campo multipart "file" é obrigatório.');
    }
    return this.importService.import(file, replace);
  }

  @Get('imports')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST, Role.AUDITOR)
  @ApiOperation({ summary: 'Lista o histórico de boletins importados' })
  @ApiQuery({ name: 'limit', required: false, example: 30 })
  listImports(@Query('limit', new ParseIntPipe({ optional: true })) limit = 30) {
    return this.importService.list(limit);
  }
}
