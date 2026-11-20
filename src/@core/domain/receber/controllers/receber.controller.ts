import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ReceberService } from '../services/receber.service';
import { CreateReceberDto, GerarReceberDto, UpdateReceberDto } from '../dto/receber.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('receber')
export class ReceberController {
  constructor(private readonly service: ReceberService) {}

  // GET /receber?status=Pendente&id_categoria=1&start=2026-11-01&end=2026-11-30&limit=&offset=
  @Get()
  listar(
    @Query('status') status?: string,
    @Query('id_categoria') idCategoria?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listarFiltrado(
      { status, id_categoria: idCategoria ? +idCategoria : undefined, start, end },
      lerPaginacao(limit, offset),
    );
  }

  // POST /receber/gerar -> várias cobranças mensais de uma vez (precisa vir antes de :id)
  @Post('gerar')
  gerar(@Body() dto: GerarReceberDto) {
    return this.service.gerar(dto);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateReceberDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReceberDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
