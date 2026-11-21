import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { CreatePagarDto, StatusPagar } from '../dto/create-pagar.dto';
import { UpdatePagarDto } from '../dto/update-pagar.dto';
import { GerarParcelasDto } from '../dto/gerar-parcelas.dto';
import { TipoConta } from '../../counts/enums/tipo-conta.enum';
import { hoje, somarMeses } from '../../shared/date.helper';
import type { PagarRepositoryInterface } from '../repositories/pagar.interface.repositories';
import type { CountsRepositoryInterface } from '../../counts/repositories/counts.repository.interface';

export interface FiltroPagar {
  id_count?: number;
  status?: string;
  start?: string;
  end?: string;
}

// Recorrente e Assinatura não têm fim natural: a janela gerada é sempre de 12 meses.
const PARCELAS_JANELA_RECORRENTE = 12;

@Injectable()
export class PagarService {
  constructor(
    @Inject('PAGAR_REPOSITORY')
    private readonly pagarRepository: PagarRepositoryInterface,
    @Inject('COUNT_REPOSITORY')
    private readonly countRepository: CountsRepositoryInterface,
  ) {}

  async create(createPagarDto: CreatePagarDto) {
    const conta = await this.garantirConta(createPagarDto.id_count);
    // Se não informar, a parcela herda o "contabilizar" da conta (ex.: assinatura paga no cartão).
    const contabilizar = createPagarDto.contabilizar ?? conta.contabilizar ?? true;
    return this.pagarRepository.create({ ...createPagarDto, contabilizar, ...this.resolverSituacao(createPagarDto) });
  }

  async gerarParcelas(dto: GerarParcelasDto) {
    const conta = await this.garantirConta(dto.id_count);

    const qtde = dto.qtde_parceladas ?? conta.qtde_parceladas ?? this.qtdePadrao(conta.tipo);
    const valor = dto.valor_parcela ?? (conta.valor_esperado != null ? Number(conta.valor_esperado) : null);

    if (valor == null) {
      throw new BadRequestException('Informe valor_parcela ou cadastre o valor esperado na conta.');
    }

    const jaGeradas = await this.pagarRepository.count({ where: { id_count: dto.id_count } });
    if (jaGeradas > 0) {
      throw new ConflictException('Essa conta já possui parcelas geradas.');
    }

    const parcelas = Array.from({ length: qtde }, (_, i) => {
      const parcela = {
        id_count: dto.id_count,
        descricao: qtde > 1 ? `${conta.nome} - parcela ${i + 1}/${qtde}` : conta.nome,
        numero_parcela: i + 1,
        valor_parcela: valor,
        valor_pago: null,
        data_vencimento: somarMeses(dto.data_primeiro_vencimento, i),
        data_pagamento: null,
        // Herda da conta se não informado (assinatura paga no cartão já nasce fora do caixa)
        contabilizar: dto.contabilizar ?? conta.contabilizar ?? true,
      };
      return { ...parcela, ...this.resolverSituacao(parcela) };
    });

    return this.pagarRepository.bulkCreate(parcelas);
  }

  async findAll(filtro: FiltroPagar = {}) {
    await this.marcarAtrasadas();

    const where: Record<string, unknown> = {};
    if (filtro.id_count) where.id_count = filtro.id_count;
    if (filtro.status) where.status = filtro.status;
    if (filtro.start && filtro.end) where.data_vencimento = { [Op.between]: [filtro.start, filtro.end] };

    return this.pagarRepository.findAll({
      where,
      order: [
        ['data_vencimento', 'ASC'],
        ['numero_parcela', 'ASC'],
      ],
    });
  }

  async findOne(id: number) {
    const parcela = await this.pagarRepository.findOne({ where: { id } });
    if (!parcela) throw new NotFoundException(`Parcela ${id} não encontrada.`);
    return parcela;
  }

  async update(id: number, updatePagarDto: UpdatePagarDto) {
    const atual = await this.findOne(id);
    if (updatePagarDto.id_count && updatePagarDto.id_count !== Number(atual.id_count)) {
      await this.garantirConta(updatePagarDto.id_count);
    }

    const mesclado = { ...atual.get({ plain: true }), ...updatePagarDto };
    const { status, data_pagamento } = this.resolverSituacao(mesclado);

    await this.pagarRepository.update({ ...updatePagarDto, status, data_pagamento }, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.pagarRepository.destroy({ where: { id } });
    return { deleted: true };
  }

  private async garantirConta(id_count: number) {
    const conta = await this.countRepository.findOne({ where: { id: id_count } });
    if (!conta) throw new NotFoundException(`Conta ${id_count} não encontrada.`);
    return conta;
  }

  private qtdePadrao(tipo: string) {
    return tipo === TipoConta.CONTA ? 1 : PARCELAS_JANELA_RECORRENTE;
  }

  // Paga: valor pago cobre a parcela. Atrasada: vencida e não paga. Senão, Pendente.
  private resolverSituacao(parcela: {
    valor_parcela: number;
    valor_pago?: number | null;
    data_vencimento: string;
    data_pagamento?: string | null;
  }): { status: StatusPagar; data_pagamento: string | null } {
    const dia = hoje();
    const pago = parcela.valor_pago != null && Number(parcela.valor_pago) >= Number(parcela.valor_parcela);

    if (pago) {
      return { status: StatusPagar.PAGA, data_pagamento: parcela.data_pagamento ?? dia };
    }
    const vencida = parcela.data_vencimento < dia;
    return {
      status: vencida ? StatusPagar.ATRASADA : StatusPagar.PENDENTE,
      data_pagamento: parcela.data_pagamento ?? null,
    };
  }

  // Parcelas pendentes que venceram desde a última consulta passam a Atrasada.
  private marcarAtrasadas() {
    return this.pagarRepository.update(
      { status: StatusPagar.ATRASADA },
      { where: { status: StatusPagar.PENDENTE, data_vencimento: { [Op.lt]: hoje() } } },
    );
  }


  // ---- Consultas usadas por resumo financeiro, notificações, dashboard e Ciel ----

  /** Parcelas pagas cuja data de PAGAMENTO cai no período (entram nas saídas do caixa). */
  pagasNoPeriodo(start: string, end: string) {
    return this.pagarRepository.findAll({
      where: { status: StatusPagar.PAGA, data_pagamento: { [Op.between]: [start, end] } },
      order: [['data_pagamento', 'ASC']],
    });
  }

  /** Parcelas ainda não pagas (Pendente/Atrasada) com vencimento no período. */
  async naoPagasNoPeriodo(start: string, end: string) {
    const parcelas = await this.findAll({ start, end });
    return parcelas.filter((p) => p.status !== StatusPagar.PAGA);
  }

  /** Parcelas não pagas de uma conta, da mais antiga para a mais nova. */
  async naoPagasDaConta(id_count: number) {
    const parcelas = await this.findAll({ id_count });
    return parcelas.filter((p) => p.status !== StatusPagar.PAGA);
  }

  /** Parcelas não pagas e ainda não avisadas que vencem no período. */
  async paraAvisar(start: string, end: string) {
    const parcelas = await this.naoPagasNoPeriodo(start, end);
    return parcelas.filter((p) => !p.notificado_em);
  }

  async marcarNotificada(id: number) {
    await this.findOne(id);
    await this.pagarRepository.update({ notificado_em: new Date() }, { where: { id } });
    return { ok: true };
  }
}
