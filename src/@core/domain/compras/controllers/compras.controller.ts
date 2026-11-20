import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ComprasService } from '../services/compras.service';
import { CreateCompraDto, UpdateCompraDto } from '../dto/compra.dto';
import { lerPaginacao } from '../../shared/pagination';

@Controller('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  // GET /compras?lista=mercado&comprado=false
  @Get()
  listar(
    @Query('lista') lista?: string,
    @Query('comprado') comprado?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.listarFiltrado(lista, comprado, lerPaginacao(limit, offset));
  }

  @Post()
  criar(@Body() dto: CreateCompraDto) {
    return this.service.criar(dto);
  }

  // DELETE /compras/comprados?lista=mercado -> limpa os itens já comprados.
  // (Precisa vir ANTES de :id, senão "comprados" seria lido como id.)
  @Delete('comprados')
  limparComprados(@Query('lista') lista?: string) {
    return this.service.limparComprados(lista);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscar(id);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompraDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
