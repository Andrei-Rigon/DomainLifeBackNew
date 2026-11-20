import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MetasSemanaisService } from '../services/metas-semanais.service';
import { CreateMetaSemanalDto, UpdateMetaSemanalDto } from '../dto/meta-semanal.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('metas-semanais')
export class MetasSemanaisController {
  constructor(private readonly service: MetasSemanaisService) {}

  // GET /metas-semanais?semana=2026-11-18&concluida=false
  @Get()
  listar(
    @Query('semana') semana?: string,
    @Query('concluida') concluida?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listarFiltrado(semana, concluida, lerPaginacao(limit, offset));
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateMetaSemanalDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMetaSemanalDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
