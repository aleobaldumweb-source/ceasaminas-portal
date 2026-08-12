import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, type AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateTransparencyItemDto } from './dto/create-transparency-item.dto.js';
import { UpdateTransparencyItemDto } from './dto/update-transparency-item.dto.js';
import { TransparencyService } from './transparency.service.js';

@ApiTags('transparency')
@Controller('transparency')
export class TransparencyController {
  constructor(private readonly service: TransparencyService) {}

  @Get()
  findPublished() {
    return this.service.findPublished();
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR, Role.AUDITOR)
  findAdmin() {
    return this.service.findAdmin();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  create(@Body() input: CreateTransparencyItemDto, @CurrentUser() actor: AuthUser) {
    return this.service.create(input, actor);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  update(
    @Param('id') id: string,
    @Body() input: UpdateTransparencyItemDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.service.update(id, input, actor);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.remove(id, actor);
  }
}
