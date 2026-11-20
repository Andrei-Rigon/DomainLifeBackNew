import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CategoriasFinanceirasService } from '../services/categorias-financeiras.service';
import { CreateCategoriaFinanceiraDto, UpdateCategoriaFinanceiraDto } from '../dto/categoria-financeira.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('categorias-financeiras')
export class CategoriasFinanceirasController {
  constructor(private readonly service: CategoriasFinanceirasService) {}

  @Get()
  listar(@Query('tipo') tipo?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.listarPorTipo(tipo, lerPaginacao(limit, offset));
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateCategoriaFinanceiraDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoriaFinanceiraDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
