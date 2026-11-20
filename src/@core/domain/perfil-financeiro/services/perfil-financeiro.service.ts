import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { BaseRepository } from '../../shared/repository.interface';
import { PerfilFinanceiro } from '../entities/perfil-financeiro.entity';
import { SalvarPerfilFinanceiroDto } from '../dto/perfil-financeiro.dto';

const PADRAO = { salario_liquido: null, saldo_inicial: 0, dias_trabalhados_mes: 22, horas_por_dia: 8 };

/** O perfil é um registro único: sempre existe no máximo uma linha. */
@Injectable()
export class PerfilFinanceiroService {
  constructor(
    @Inject('PERFIL_FINANCEIRO_REPOSITORY')
    private readonly repo: BaseRepository<PerfilFinanceiro>,
  ) {}

  /** Devolve o perfil salvo ou os valores padrão se ainda não foi cadastrado. */
  async obter() {
    const perfil = await this.repo.findOne({ where: {} });
    return perfil ?? { ...PADRAO };
  }

  /** Cria o registro na primeira vez e atualiza nas seguintes. */
  async salvar(entrada: SalvarPerfilFinanceiroDto) {
    // Campos não enviados chegam como undefined no DTO e não podem sobrescrever os padrões
    const dto = Object.fromEntries(Object.entries(entrada).filter(([, v]) => v !== undefined)) as SalvarPerfilFinanceiroDto;
    const atual = await this.repo.findOne({ where: {} });
    if (!atual) return this.repo.create({ ...PADRAO, ...dto } as any);

    await this.repo.update(dto, { where: { id: atual.id } });
    return this.repo.findOne({ where: { id: atual.id } });
  }

  /**
   * Quanto o valor custa em tempo de trabalho:
   *   valor da hora = salário líquido / (dias por mês * horas por dia)
   *   horas         = valor / valor da hora
   *   dias          = horas / horas por dia
   */
  async custoHoras(valor: number) {
    const perfil: any = await this.obter();
    const salario = Number(perfil.salario_liquido ?? 0);
    if (salario <= 0) {
      throw new BadRequestException('Cadastre o salário líquido em PUT /perfil-financeiro antes de calcular o custo em horas.');
    }

    const horasPorDia = Number(perfil.horas_por_dia);
    const valorHora = salario / (Number(perfil.dias_trabalhados_mes) * horasPorDia);
    const horas = valor / valorHora;

    return {
      valor,
      valor_hora: Math.round(valorHora * 100) / 100,
      horas: Math.round(horas * 100) / 100,
      dias: Math.round((horas / horasPorDia) * 100) / 100,
      horas_por_dia: horasPorDia,
    };
  }
}
