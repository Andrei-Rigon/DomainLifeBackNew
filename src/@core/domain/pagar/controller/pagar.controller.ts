import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PagarService } from '../services/pagar.service';
import { CreatePagarDto } from '../dto/create-pagar.dto';
import { UpdatePagarDto } from '../dto/update-pagar.dto';
import { GerarParcelasDto } from '../dto/gerar-parcelas.dto';

@Controller('pagar')
export class PagarController {
  constructor(private readonly pagarService: PagarService) {}

  @Post()
  create(@Body() createPagarDto: CreatePagarDto) {
    return this.pagarService.create(createPagarDto);
  }

  @Post('gerar')
  gerarParcelas(@Body() gerarParcelasDto: GerarParcelasDto) {
    return this.pagarService.gerarParcelas(gerarParcelasDto);
  }

  @Get()
  findAll(
    @Query('id_count') idCount?: string,
    @Query('status') status?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.pagarService.findAll({
      id_count: idCount ? +idCount : undefined,
      status,
      start,
      end,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagarService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePagarDto: UpdatePagarDto) {
    return this.pagarService.update(+id, updatePagarDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagarService.remove(+id);
  }
}
