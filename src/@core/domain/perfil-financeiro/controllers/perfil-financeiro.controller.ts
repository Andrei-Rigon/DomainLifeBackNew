import { BadRequestException, Body, Controller, Get, Put, Query } from '@nestjs/common';
import { PerfilFinanceiroService } from '../services/perfil-financeiro.service';
import { SalvarPerfilFinanceiroDto } from '../dto/perfil-financeiro.dto';
import { parseValor } from '../../shared/money';

@Controller()
export class PerfilFinanceiroController {
  constructor(private readonly service: PerfilFinanceiroService) {}

  @Get('perfil-financeiro')
  obter() {
    return this.service.obter();
  }

  @Put('perfil-financeiro')
  salvar(@Body() dto: SalvarPerfilFinanceiroDto) {
    return this.service.salvar(dto);
  }

  // GET /custo-horas?valor=1500 -> quantas horas/dias de trabalho esse valor custa
  @Get('custo-horas')
  custoHoras(@Query('valor') valor?: string) {
    const numero = parseValor(valor);
    if (numero === null || numero <= 0) throw new BadRequestException('Informe valor (ex.: ?valor=1500).');
    return this.service.custoHoras(numero);
  }
}
