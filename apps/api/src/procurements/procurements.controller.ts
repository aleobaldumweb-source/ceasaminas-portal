import { BadRequestException, Body, Controller, Delete, Get, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, unlink } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Role, type AuthUser } from '../auth/auth.types.js';
import { CreateProcurementDto } from './dto/create-procurement.dto.js';
import { UpdateProcurementDto } from './dto/update-procurement.dto.js';
import { ProcurementsService } from './procurements.service.js';

const UPLOAD_DIRECTORY = resolve(process.cwd(), 'uploads', 'procurements');
const TEMP_DIRECTORY = resolve(process.cwd(), 'uploads', 'temp');
const MAX_FILE_SIZE = 15 * 1024 * 1024;
type Upload = { path: string; originalname: string; mimetype: string; size: number };

@ApiTags('procurements')
@Controller('procurements')
export class ProcurementsController {
  constructor(private readonly service: ProcurementsService) {}

  @Get() findPublished(@Query('q') q?: string, @Query('status') status?: string) { return this.service.findPublished(q?.trim(), status); }

  @Get('admin/list') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN, Role.EDITOR, Role.AUDITOR)
  findAdmin() { return this.service.findAdmin(); }

  @Get(':id') async findPublishedById(@Param('id') id: string) { const item = await this.service.findPublishedById(id); if (!item) throw new BadRequestException('Licitação não encontrada.'); return item; }

  @Post() @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN, Role.EDITOR)
  create(@Body() input: CreateProcurementDto, @CurrentUser() actor: AuthUser) { return this.service.create(input, actor); }

  @Patch(':id') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN, Role.EDITOR)
  update(@Param('id') id: string, @Body() input: UpdateProcurementDto, @CurrentUser() actor: AuthUser) { return this.service.update(id, input, actor); }

  @Delete(':id') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) { return this.service.remove(id, actor); }

  @Post(':id/documents') @ApiBearerAuth() @ApiConsumes('multipart/form-data') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file', { dest: TEMP_DIRECTORY, limits: { fileSize: MAX_FILE_SIZE, files: 1 } }))
  async upload(@Param('id') id: string, @Body('title') title: string, @CurrentUser() actor: AuthUser,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })], fileIsRequired: true })) file: Upload) {
    if (!title?.trim()) { await unlink(file.path).catch(() => undefined); throw new BadRequestException('Informe o título do documento.'); }
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowed.includes(file.mimetype)) { await unlink(file.path).catch(() => undefined); throw new BadRequestException('Formato inválido. Envie PDF, DOC, DOCX ou XLSX.'); }
    await mkdir(UPLOAD_DIRECTORY, { recursive: true });
    const fileName = `procurement-${id}-${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const finalPath = resolve(UPLOAD_DIRECTORY, fileName); await rename(file.path, finalPath);
    const base = (process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? 3333}`).replace(/\/+$/, '');
    try { return await this.service.addDocument(id, file, `${base}/uploads/procurements/${fileName}`, title, actor); }
    catch (error) { await unlink(finalPath).catch(() => undefined); throw error; }
  }

  @Delete(':id/documents/:documentId') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN, Role.EDITOR)
  async removeDocument(@Param('id') id: string, @Param('documentId') documentId: string, @CurrentUser() actor: AuthUser) {
    const doc = await this.service.removeDocument(id, documentId, actor);
    const path = doc.fileUrl.split('/uploads/')[1]; if (path) await unlink(resolve(process.cwd(), 'uploads', path)).catch(() => undefined);
  }
}
