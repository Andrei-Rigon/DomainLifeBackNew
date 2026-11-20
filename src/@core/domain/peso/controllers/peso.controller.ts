import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { PesoService } from '../services/peso.service';
import { CreatePesoDto, UpdatePesoDto } from '../dto/peso.dto';
import { lerPaginacao } from '../../shared/pagination';
import { mesValido } from '../../shared/date.helper';

@Controller('peso')
export class PesoController {
  constructor(private readonly service: PesoService) {}

  @Get()
  listar(@Query('start') start?: string, @Query('end') end?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.listarFiltrado(start, end, lerPaginacao(limit, offset));
  }

  // GET /peso/resumo?mes=2026-11  (precisa vir antes de :id)
  @Get('resumo')
  resumo(@Query('mes') mes?: string) {
    if (mes && !mesValido(mes)) throw new BadRequestException('mes deve estar no formato YYYY-MM.');
    return this.service.resumo(mes);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  // Um registro por dia: se a data já existe, atualiza.
  @Post()
  registrar(@Body() dto: CreatePesoDto) {
    return this.service.registrar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePesoDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
