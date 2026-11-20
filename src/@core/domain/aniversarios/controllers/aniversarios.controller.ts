import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { AniversariosService } from '../services/aniversarios.service';
import { CreateAniversarioDto, UpdateAniversarioDto } from '../dto/aniversario.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('aniversarios')
export class AniversariosController {
  constructor(private readonly service: AniversariosService) {}

  // GET /aniversarios?mes=11
  @Get()
  listar(@Query('mes') mes?: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.service.listarFiltrado(mes, lerPaginacao(limit, offset));
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateAniversarioDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAniversarioDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
