import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida, hoje } from '../../shared/date.helper';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Lancamento } from '../entities/lancamento.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';
import { ContaBancaria } from '../../contas-bancarias/entities/conta-bancaria.entity';

export interface FiltroLancamentos {
  tipo?: string;
  id_categoria?: number;
  // Lançamentos de uma conta bancária (como origem OU destino)
  id_conta?: number;
  start?: string;
  end?: string;
}

@Injectable()
export class LancamentosService extends BaseCrudService<Lancamento> {
  protected readonly entidade = 'Lançamento';
  protected ordem: any[] = [
    ['data', 'DESC'],
    ['id', 'DESC'],
  ];
  protected include = [
    { model: CategoriaFinanceira, required: false },
    { model: ContaBancaria, as: 'conta_bancaria', required: false },
    { model: ContaBancaria, as: 'conta_destino', required: false },
  ];

  constructor(
    @Inject('LANCAMENTOS_REPOSITORY')
    protected readonly repo: BaseRepository<Lancamento>,
    @Inject('CATEGORIAS_FINANCEIRAS_REPOSITORY')
    private readonly categorias: BaseRepository<CategoriaFinanceira>,
    @Inject('CONTAS_BANCARIAS_REPOSITORY')
    private readonly contas: BaseRepository<ContaBancaria>,
  ) {
    super();
  }

  listarFiltrado(filtro: FiltroLancamentos, pagina?: Paginacao) {
    return this.listar(this.montarWhere(filtro), pagina);
  }

  /** Lançamentos de um período, sem paginação (relatórios e resumos). */
  doPeriodo(start: string, end: string, extra: Omit<FiltroLancamentos, 'start' | 'end'> = {}) {
    return this.repo.findAll({
      where: this.montarWhere({ ...extra, start, end }),
      order: this.ordem,
    });
  }

  private montarWhere(filtro: FiltroLancamentos) {
    const where: Record<string, any> = {};
    if (filtro.tipo) where.tipo = filtro.tipo;
    if (filtro.id_categoria) where.id_categoria = filtro.id_categoria;
    if (filtro.id_conta) where[Op.or as any] = [{ id_conta_bancaria: filtro.id_conta }, { id_conta_destino: filtro.id_conta }];
    if (filtro.start && filtro.end) where.data = { [Op.between]: [filtro.start, filtro.end] };
    else if (filtro.start) where.data = { [Op.gte]: filtro.start };
    else if (filtro.end) where.data = { [Op.lte]: filtro.end };
    return where;
  }

  protected async antesDeCriar(dto: any) {
    const data = dto.data ?? hoje();
    this.validarData(data);
    await this.garantirCategoria(dto.id_categoria);
    const contas = await this.validarContas(dto);
    return { ...dto, ...contas, data, origem: dto.origem ?? 'manual' };
  }

  protected async antesDeAtualizar(dto: any, atual: Lancamento) {
    if (dto.data !== undefined) this.validarData(dto.data);
    await this.garantirCategoria(dto.id_categoria);
    const contas = await this.validarContas({ ...atual.get({ plain: true }), ...dto });
    return { ...dto, ...contas };
  }

  /**
   * Transferência: precisa de conta de origem e de destino (diferentes) e não tem categoria.
   * Despesa/receita: a conta é opcional e não existe destino.
   */
  private async validarContas(l: { tipo: string; id_conta_bancaria?: number | null; id_conta_destino?: number | null }) {
    const origem = l.id_conta_bancaria == null ? null : Number(l.id_conta_bancaria);
    const destino = l.id_conta_destino == null ? null : Number(l.id_conta_destino);

    if (l.tipo === 'transferencia') {
      if (origem == null || destino == null) {
        throw new BadRequestException('Transferência precisa de conta de origem (id_conta_bancaria) e de destino (id_conta_destino).');
      }
      if (origem === destino) throw new BadRequestException('A conta de origem e a de destino devem ser diferentes.');
      await this.garantirConta(origem);
      await this.garantirConta(destino);
      return { id_conta_bancaria: origem, id_conta_destino: destino, id_categoria: null };
    }

    if (origem != null) await this.garantirConta(origem);
    return { id_conta_bancaria: origem, id_conta_destino: null };
  }

  private async garantirConta(id: number) {
    const conta = await this.contas.findOne({ where: { id } });
    if (!conta) throw new NotFoundException(`Conta bancária ${id} não encontrada.`);
  }

  private validarData(data: string) {
    if (!dataValida(data)) throw new BadRequestException('data inválida. Use YYYY-MM-DD.');
  }

  private async garantirCategoria(id?: number | null) {
    if (id == null) return;
    const categoria = await this.categorias.findOne({ where: { id } });
    if (!categoria) throw new NotFoundException(`Categoria ${id} não encontrada.`);
  }
}
