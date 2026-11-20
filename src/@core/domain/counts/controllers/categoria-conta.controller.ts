import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriaContaService } from '../services/categoria-conta.service';
import { CreateCategoriaContaDto, UpdateCategoriaContaDto } from '../dto/create-categoria-conta.dto';

@Controller('categoria-conta')
export class CategoriaContaController {
  constructor(private readonly categoriaContaService: CategoriaContaService) {}

  @Post()
  create(@Body() dto: CreateCategoriaContaDto) {
    return this.categoriaContaService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoriaContaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriaContaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaContaDto) {
    return this.categoriaContaService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriaContaService.remove(+id);
  }
}
