import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { rename, unlink } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { Role } from '../auth/auth.types.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { apiPublicUrl } from '../config/runtime-config.js';
import { NEWS_UPLOAD_DIRECTORY, TEMP_UPLOAD_DIRECTORY } from '../storage/local-storage.js';
import { CreateNewsDto } from './dto/create-news.dto.js';
import { UpdateNewsDto } from './dto/update-news.dto.js';
import { NewsService } from './news.service.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type UploadedNewsFile = {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
};

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  findPublished() {
    return this.newsService.findPublished();
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST, Role.AUDITOR)
  findAdmin() {
    return this.newsService.findAdmin();
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.newsService.findPublishedBySlug(slug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
  create(@Body() input: CreateNewsDto) {
    return this.newsService.create(input);
  }

  @Post(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      dest: TEMP_UPLOAD_DIRECTORY,
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_IMAGE_SIZE,
            message: 'A imagem deve ter no máximo 5 MB.',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: UploadedNewsFile,
  ) {
    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    const extension =
      extensionByMimeType[file.mimetype] ?? extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException('Formato inválido. Envie uma imagem JPG, PNG ou WebP.');
    }

    const safeExtension = extension === '.jpeg' ? '.jpg' : extension;
    const fileName = `news-${id}-${Date.now()}-${randomUUID()}${safeExtension}`;
    const finalPath = resolve(NEWS_UPLOAD_DIRECTORY, fileName);
    await rename(file.path, finalPath);

    try {
      return await this.newsService.setImage(id, `${apiPublicUrl()}/uploads/news/${fileName}`);
    } catch (error) {
      await unlink(finalPath).catch(() => undefined);
      throw error;
    }
  }

  @Delete(':id/image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
  removeImage(@Param('id') id: string) {
    return this.newsService.removeImage(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
  update(@Param('id') id: string, @Body() input: UpdateNewsDto) {
    return this.newsService.update(id, input);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
