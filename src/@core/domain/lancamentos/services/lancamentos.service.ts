import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida, hoje } from '../../shared/date.helper';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Lancamento } from '../entities/lancamento.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';

export interface FiltroLancamentos {
  tipo?: string;
  id_categoria?: number;
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
  protected include = [{ model: CategoriaFinanceira, required: false }];

  constructor(
    @Inject('LANCAMENTOS_REPOSITORY')
    protected readonly repo: BaseRepository<Lancamento>,
    @Inject('CATEGORIAS_FINANCEIRAS_REPOSITORY')
    private readonly categorias: BaseRepository<CategoriaFinanceira>,
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
    if (filtro.start && filtro.end) where.data = { [Op.between]: [filtro.start, filtro.end] };
    else if (filtro.start) where.data = { [Op.gte]: filtro.start };
    else if (filtro.end) where.data = { [Op.lte]: filtro.end };
    return where;
  }

  protected async antesDeCriar(dto: any) {
    const data = dto.data ?? hoje();
    this.validarData(data);
    await this.garantirCategoria(dto.id_categoria);
    return { ...dto, data, origem: dto.origem ?? 'manual' };
  }

  protected async antesDeAtualizar(dto: any) {
    if (dto.data !== undefined) this.validarData(dto.data);
    await this.garantirCategoria(dto.id_categoria);
    return dto;
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
