import { Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../auth/auth.types.js';

@Controller('news')
export class NewsController {
  // GET /news e GET /news/:slug continuam públicos.

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST, Role.AUDITOR)
  @ApiBearerAuth()
  findAllAdmin() {
    // Preserve a implementação existente.
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
  @ApiBearerAuth()
  create() {
    // Preserve a implementação existente.
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.JOURNALIST)
  @ApiBearerAuth()
  update() {
    // Preserve a implementação existente.
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  remove() {
    // Preserve a implementação existente.
  }
}
