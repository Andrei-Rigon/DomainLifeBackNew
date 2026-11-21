import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida, hoje, somarMeses } from '../../shared/date.helper';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Receber } from '../entities/receber.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';
import { GerarReceberDto } from '../dto/receber.dto';

export interface FiltroReceber {
  status?: string;
  id_categoria?: number;
  start?: string; // vencimento >= start
  end?: string; // vencimento <= end
}

/**
 * Contas a receber: espelho de `pagar` para o dinheiro que VAI entrar.
 * Status é calculado: Recebida (valor_recebido cobre o valor), Atrasada
 * (venceu e não foi recebida) ou Pendente.
 */
@Injectable()
export class ReceberService extends BaseCrudService<Receber> {
  protected readonly entidade = 'Cobrança';
  protected ordem: any[] = [
    ['data_vencimento', 'ASC'],
    ['id', 'ASC'],
  ];
  protected include = [{ model: CategoriaFinanceira, required: false }];

  constructor(
    @Inject('RECEBER_REPOSITORY')
    protected readonly repo: BaseRepository<Receber>,
    @Inject('CATEGORIAS_FINANCEIRAS_REPOSITORY')
    private readonly categorias: BaseRepository<CategoriaFinanceira>,
  ) {
    super();
  }

  async listarFiltrado(filtro: FiltroReceber, pagina?: Paginacao) {
    await this.marcarAtrasadas();
    const where: Record<string, any> = {};
    if (filtro.status) where.status = filtro.status;
    if (filtro.id_categoria) where.id_categoria = filtro.id_categoria;
    if (filtro.start && filtro.end) where.data_vencimento = { [Op.between]: [filtro.start, filtro.end] };
    else if (filtro.start) where.data_vencimento = { [Op.gte]: filtro.start };
    else if (filtro.end) where.data_vencimento = { [Op.lte]: filtro.end };
    return this.listar(where, pagina);
  }

  /** Cria `qtde` cobranças mensais mantendo o dia (31/01 -> 28/02). */
  async gerar(dto: GerarReceberDto) {
    this.validarData(dto.primeiro_vencimento);
    await this.garantirCategoria(dto.id_categoria);
    const qtde = dto.qtde ?? 1;

    const itens = Array.from({ length: qtde }, (_, i) => {
      const item = {
        descricao: qtde > 1 ? `${dto.descricao} - ${i + 1}/${qtde}` : dto.descricao,
        id_categoria: dto.id_categoria ?? null,
        numero_parcela: i + 1,
        valor: dto.valor,
        valor_recebido: null,
        data_vencimento: somarMeses(dto.primeiro_vencimento, i),
        contabilizar: dto.contabilizar ?? true,
        data_recebimento: null,
      };
      return { ...item, ...this.situacao(item) };
    });
    return Promise.all(itens.map((item) => this.repo.create(item as any)));
  }

  /** Cobranças recebidas cuja data de RECEBIMENTO cai no período (entram nas entradas do caixa). */
  recebidasNoPeriodo(start: string, end: string) {
    return this.repo.findAll({
      where: { status: 'Recebida', data_recebimento: { [Op.between]: [start, end] } },
      order: [['data_recebimento', 'ASC']],
    });
  }

  protected async antesDeCriar(dto: any) {
    this.validarData(dto.data_vencimento);
    await this.garantirCategoria(dto.id_categoria);
    return { ...dto, ...this.situacao(dto) };
  }

  protected async antesDeAtualizar(dto: any, atual: Receber) {
    if (dto.data_vencimento !== undefined) this.validarData(dto.data_vencimento);
    await this.garantirCategoria(dto.id_categoria);
    const mesclado = { ...atual.get({ plain: true }), ...dto };
    return { ...dto, ...this.situacao(mesclado) };
  }

  // Recebida: valor recebido cobre o valor. Atrasada: vencida e não recebida. Senão, Pendente.
  private situacao(r: { valor: number; valor_recebido?: number | null; data_vencimento: string; data_recebimento?: string | null }) {
    const dia = hoje();
    if (r.valor_recebido != null && Number(r.valor_recebido) >= Number(r.valor)) {
      return { status: 'Recebida', data_recebimento: r.data_recebimento ?? dia };
    }
    return {
      status: r.data_vencimento < dia ? 'Atrasada' : 'Pendente',
      data_recebimento: r.data_recebimento ?? null,
    };
  }

  private marcarAtrasadas() {
    return this.repo.update({ status: 'Atrasada' }, { where: { status: 'Pendente', data_vencimento: { [Op.lt]: hoje() } } });
  }

  private validarData(data: string) {
    if (!dataValida(data)) throw new BadRequestException('Data inválida. Use YYYY-MM-DD.');
  }

  private async garantirCategoria(id?: number | null) {
    if (id == null) return;
    if (!(await this.categorias.findOne({ where: { id } }))) throw new NotFoundException(`Categoria ${id} não encontrada.`);
  }
}
