import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import { CielService, RespostaCiel } from '../services/ciel.service';
import { CielExceptionFilter } from '../filters/ciel-exception.filter';

/**
 * Rotas para o Ciel (assistente de IA). Todas respondem
 *   { ok: true, mensagem: "<frase pronta para falar>", dados: {...} }
 * e, em erro (400/404), { ok: false, mensagem: "<o que faltou>" }.
 * O corpo é lido "solto" (sem DTO) de propósito: quem chama é um modelo pequeno,
 * e os parsers do service entendem "50,50", "amanha", etc. com mensagens claras.
 */
@Controller('ciel')
@UseFilters(CielExceptionFilter)
export class CielController {
  constructor(private readonly service: CielService) {}

  private ok({ mensagem, dados }: RespostaCiel) {
    return { ok: true, mensagem, dados };
  }

  @Post('gasto')
  async gasto(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.gasto(corpo ?? {}));
  }

  @Post('receita')
  async receita(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.receita(corpo ?? {}));
  }

  @Get('quanto-gastei')
  async quantoGastei(@Query() consulta: Record<string, any>) {
    return this.ok(await this.service.quantoGastei(consulta));
  }

  @Post('pagar-conta')
  async pagarConta(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.pagarConta(corpo ?? {}));
  }

  @Get('contas-a-pagar')
  async contasAPagar(@Query() consulta: Record<string, any>) {
    return this.ok(await this.service.contasAPagar(consulta));
  }

  @Post('agendar')
  async agendar(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.agendar(corpo ?? {}));
  }

  @Post('lembrete')
  async lembrete(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.lembrete(corpo ?? {}));
  }

  @Post('nota')
  async nota(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.nota(corpo ?? {}));
  }

  @Post('compras')
  async adicionarCompra(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.adicionarCompra(corpo ?? {}));
  }

  @Get('compras')
  async listarCompras(@Query() consulta: Record<string, any>) {
    return this.ok(await this.service.listarCompras(consulta));
  }

  @Post('tarefa')
  async tarefa(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.tarefa(corpo ?? {}));
  }

  @Post('peso')
  async peso(@Body() corpo: Record<string, any>) {
    return this.ok(await this.service.registrarPeso(corpo ?? {}));
  }

  @Get('hoje')
  async hoje() {
    return this.ok(await this.service.hoje());
  }

  @Get('resumo-mes')
  async resumoMes(@Query() consulta: Record<string, any>) {
    return this.ok(await this.service.resumoMes(consulta));
  }

  @Get('custo-horas')
  async custoHoras(@Query() consulta: Record<string, any>) {
    return this.ok(await this.service.custoHoras(consulta));
  }
}
