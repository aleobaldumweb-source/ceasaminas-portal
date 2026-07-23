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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { CreateNewsDto } from './dto/create-news.dto.js';
import { UpdateNewsDto } from './dto/update-news.dto.js';
import { NewsService } from './news.service.js';

const UPLOAD_DIRECTORY = resolve(process.cwd(), 'uploads', 'news');
const TEMP_DIRECTORY = resolve(process.cwd(), 'uploads', 'temp');
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
  findAdmin() {
    return this.newsService.findAdmin();
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.newsService.findPublishedBySlug(slug);
  }

  @Post()
  create(@Body() input: CreateNewsDto) {
    return this.newsService.create(input);
  }

  @Post(':id/image')
  @ApiBearerAuth()
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
      dest: TEMP_DIRECTORY,
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

    await mkdir(UPLOAD_DIRECTORY, { recursive: true });
    const safeExtension = extension === '.jpeg' ? '.jpg' : extension;
    const fileName = `news-${id}-${Date.now()}-${randomUUID()}${safeExtension}`;
    const finalPath = resolve(UPLOAD_DIRECTORY, fileName);
    await rename(file.path, finalPath);

    const apiPublicUrl = (
      process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? 3333}`
    ).replace(/\/+$/, '');
    try {
      return await this.newsService.setImage(id, `${apiPublicUrl}/uploads/news/${fileName}`);
    } catch (error) {
      await unlink(finalPath).catch(() => undefined);
      throw error;
    }
  }

  @Delete(':id/image')
  removeImage(@Param('id') id: string) {
    return this.newsService.removeImage(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateNewsDto) {
    return this.newsService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
