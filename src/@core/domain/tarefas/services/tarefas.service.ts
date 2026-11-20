import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida } from '../../shared/date.helper';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Tarefa } from '../entities/tarefa.entity';

export interface FiltroTarefas {
  status?: string;
  prioridade?: string;
  start?: string; // prazo >= start
  end?: string; // prazo <= end
}

@Injectable()
export class TarefasService extends BaseCrudService<Tarefa> {
  protected readonly entidade = 'Tarefa';
  protected ordem: any[] = [
    ['prazo', 'ASC NULLS LAST'],
    ['id', 'ASC'],
  ];

  constructor(
    @Inject('TAREFAS_REPOSITORY')
    protected readonly repo: BaseRepository<Tarefa>,
  ) {
    super();
  }

  listarFiltrado(filtro: FiltroTarefas, pagina: Paginacao) {
    const where: Record<string, any> = {};
    if (filtro.status) where.status = filtro.status;
    if (filtro.prioridade) where.prioridade = filtro.prioridade;
    if (filtro.start && filtro.end) where.prazo = { [Op.between]: [filtro.start, filtro.end] };
    else if (filtro.start) where.prazo = { [Op.gte]: filtro.start };
    else if (filtro.end) where.prazo = { [Op.lte]: filtro.end };
    return this.listar(where, pagina);
  }

  protected async antesDeCriar(dto: any) {
    this.validarPrazo(dto.prazo);
    return { ...dto, status: dto.status ?? 'a_fazer', prioridade: dto.prioridade ?? 'media' };
  }

  protected async antesDeAtualizar(dto: any) {
    this.validarPrazo(dto.prazo);
    return dto;
  }

  private validarPrazo(prazo?: string) {
    if (prazo && !dataValida(prazo)) throw new BadRequestException('prazo inválido. Use YYYY-MM-DD.');
  }
}
