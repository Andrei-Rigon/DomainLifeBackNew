import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida, hoje, segundaDaSemana } from '../../shared/date.helper';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { MetaSemanal } from '../entities/meta-semanal.entity';

@Injectable()
export class MetasSemanaisService extends BaseCrudService<MetaSemanal> {
  protected readonly entidade = 'Meta';
  protected ordem: any[] = [
    ['semana', 'DESC'],
    ['id', 'ASC'],
  ];

  constructor(
    @Inject('METAS_SEMANAIS_REPOSITORY')
    protected readonly repo: BaseRepository<MetaSemanal>,
  ) {
    super();
  }

  /** `semana`: qualquer data; vira a segunda-feira dessa semana. */
  listarFiltrado(semana: string | undefined, concluida: string | undefined, pagina: Paginacao) {
    const where: Record<string, any> = {};
    if (semana) where.semana = segundaDaSemana(this.validar(semana));
    if (concluida !== undefined) where.concluida = concluida === 'true';
    return this.listar(where, pagina);
  }

  /** Metas da semana atual (dashboard). */
  daSemanaAtual() {
    return this.listar({ semana: segundaDaSemana(hoje()) });
  }

  protected async antesDeCriar(dto: any) {
    return { ...dto, semana: segundaDaSemana(this.validar(dto.semana ?? hoje())), concluida: dto.concluida ?? false };
  }

  protected async antesDeAtualizar(dto: any) {
    return dto.semana === undefined ? dto : { ...dto, semana: segundaDaSemana(this.validar(dto.semana)) };
  }

  private validar(data: string) {
    if (!dataValida(data)) throw new BadRequestException('semana inválida. Use YYYY-MM-DD.');
    return data;
  }
}
