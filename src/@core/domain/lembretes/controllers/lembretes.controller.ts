import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { LembretesService } from '../services/lembretes.service';
import { CreateLembreteDto, UpdateLembreteDto } from '../dto/lembrete.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('lembretes')
export class LembretesController {
  constructor(private readonly service: LembretesService) {}

  // GET /lembretes?ativo=true&limit=50&offset=0
  @Get()
  listar(@Query('ativo') ativo?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.listarFiltrado(ativo, lerPaginacao(limit, offset));
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateLembreteDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLembreteDto) {
    return this.service.atualizar(id, dto);
  }

  // Marca como enviado; se repete, já agenda o próximo. (Também disponível em /notificacoes/lembrete/:id/enviado)
  @Post(':id/enviado')
  enviado(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarEnviado(id);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
