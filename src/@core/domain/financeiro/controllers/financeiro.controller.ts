import { BadRequestException, Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { FinanceiroService } from '../services/financeiro.service';
import { dataValida, mesAtual, mesValido } from '../../shared/date.helper';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService) {}

  // GET /financeiro/resumo?mes=2026-11
  @Get('resumo')
  resumo(@Query('mes') mes?: string) {
    if (mes && !mesValido(mes)) throw new BadRequestException('mes deve estar no formato YYYY-MM.');
    return this.service.resumo(mes ?? mesAtual());
  }

  // GET /financeiro/saldo?ate=2026-11-18 -> saldo acumulado (saldo inicial + entradas - saídas)
  @Get('saldo')
  saldo(@Query('ate') ate?: string) {
    if (ate && !dataValida(ate)) throw new BadRequestException('ate deve estar no formato YYYY-MM-DD.');
    return this.service.saldo(ate);
  }

  // GET /financeiro/evolucao?meses=6 -> entradas/saídas/saldo dos últimos meses (gráfico)
  @Get('evolucao')
  evolucao(@Query('meses') meses?: string) {
    const n = Number(meses);
    return this.service.evolucao(Number.isInteger(n) && n >= 1 ? Math.min(n, 24) : 6);
  }

  // GET /financeiro/exportar?start=2026-11-01&end=2026-11-30&formato=csv
  @Get('exportar')
  async exportar(@Query('start') start?: string, @Query('end') end?: string, @Query('formato') formato = 'csv') {
    if (formato !== 'csv') throw new BadRequestException('Formato não suportado. Use formato=csv.');
    if (!start || !end || !dataValida(start) || !dataValida(end)) {
      throw new BadRequestException('Informe start e end no formato YYYY-MM-DD.');
    }
    if (start > end) throw new BadRequestException('start deve ser anterior ou igual a end.');

    const csv = await this.service.csv(start, end);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="financeiro_${start}_${end}.csv"`,
    });
  }
}
