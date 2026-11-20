import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { TarefasService } from '../services/tarefas.service';
import { CreateTarefaDto, UpdateTarefaDto } from '../dto/tarefa.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('tarefas')
export class TarefasController {
  constructor(private readonly service: TarefasService) {}

  // GET /tarefas?status=em_andamento&prioridade=alta&start=2026-11-01&end=2026-11-30
  @Get()
  listar(
    @Query('status') status?: string,
    @Query('prioridade') prioridade?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listarFiltrado({ status, prioridade, start, end }, lerPaginacao(limit, offset));
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateTarefaDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTarefaDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
