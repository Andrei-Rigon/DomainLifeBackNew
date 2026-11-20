import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../shared/base-crud.service';
import { dataValida, hoje } from '../../shared/date.helper';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Aniversario } from '../entities/aniversario.entity';

/** "MM-DD" de um data_nascimento ("YYYY-MM-DD" ou "MM-DD"). */
const diaMes = (data: string) => data.slice(-5);

@Injectable()
export class AniversariosService extends BaseCrudService<Aniversario> {
  protected readonly entidade = 'Aniversário';
  protected ordem: any[] = [['nome', 'ASC']];

  constructor(
    @Inject('ANIVERSARIOS_REPOSITORY')
    protected readonly repo: BaseRepository<Aniversario>,
  ) {
    super();
  }

  /** `mes` (1-12) opcional: só quem faz aniversário naquele mês. */
  async listarFiltrado(mes: string | undefined, pagina: Paginacao) {
    const todos = await this.listar({});
    const filtrados = mes ? todos.filter((a) => Number(a.data_nascimento.slice(-5, -3)) === Number(mes)) : todos;
    return filtrados.slice(pagina.offset, pagina.offset + pagina.limit);
  }

  /** Quem faz aniversário no dia (YYYY-MM-DD). */
  async doDia(dia: string = hoje()) {
    const todos = await this.listar({});
    return todos.filter((a) => diaMes(a.data_nascimento) === diaMes(dia));
  }

  /** Marca que o aviso deste ano foi dado. */
  async marcarAvisado(id: number, ano: number) {
    await this.buscar(id);
    await this.repo.update({ ultimo_aviso_ano: ano }, { where: { id } });
    return { ok: true };
  }

  protected async antesDeCriar(dto: any) {
    this.validarData(dto.data_nascimento);
    return dto;
  }

  protected async antesDeAtualizar(dto: any) {
    if (dto.data_nascimento !== undefined) this.validarData(dto.data_nascimento);
    return dto;
  }

  // Sem ano, valida com 2000 (bissexto) para aceitar 02-29
  private validarData(data: string) {
    const completa = data.length === 5 ? `2000-${data}` : data;
    if (!dataValida(completa)) throw new BadRequestException('data_nascimento inválida.');
  }
}
