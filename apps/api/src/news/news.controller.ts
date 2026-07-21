import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateNewsDto } from './dto/create-news.dto.js';
import { UpdateNewsDto } from './dto/update-news.dto.js';
import { NewsService } from './news.service.js';

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateNewsDto) {
    return this.newsService.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
