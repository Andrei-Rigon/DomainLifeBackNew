import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { LancamentosService } from '../services/lancamentos.service';
import { CreateLancamentoDto, UpdateLancamentoDto } from '../dto/lancamento.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('lancamentos')
export class LancamentosController {
  constructor(private readonly service: LancamentosService) {}

  // GET /lancamentos?tipo=despesa&id_categoria=1&start=2026-11-01&end=2026-11-30&limit=50&offset=0
  @Get()
  listar(
    @Query('tipo') tipo?: string,
    @Query('id_categoria') idCategoria?: string,
    @Query('id_conta') idConta?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listarFiltrado(
      { tipo, id_categoria: idCategoria ? +idCategoria : undefined, id_conta: idConta ? +idConta : undefined, start, end },
      lerPaginacao(limit, offset),
    );
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateLancamentoDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLancamentoDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
