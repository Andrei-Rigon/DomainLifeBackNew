import { NotFoundException } from '@nestjs/common';
import { BaseRepository } from './repository.interface';
import { Paginacao } from './pagination';

/**
 * CRUD genérico dos módulos novos. Cada módulo herda e só escreve o que é
 * específico dele (validações, ordem, regras). É como um "BaseController" do
 * Laravel, mas na camada de service.
 *
 * - `buscar/atualizar/remover` devolvem 404 se o id não existe.
 * - `atualizar` devolve o registro atualizado; `remover` devolve { deleted: true }.
 */
export abstract class BaseCrudService<Model extends { id: number }> {
  /** Nome para as mensagens de erro: "Tarefa" -> "Tarefa 5 não encontrada." */
  protected abstract readonly entidade: string;
  protected abstract readonly repo: BaseRepository<Model>;
  protected ordem: any[] = [['id', 'ASC']];
  /** Associações carregadas junto (ex.: categoria do lançamento). */
  protected include?: any[];

  listar(where: Record<string, any> = {}, pagina?: Paginacao) {
    return this.repo.findAll({
      where,
      order: this.ordem,
      ...(this.include ? { include: this.include } : {}),
      ...(pagina ? { limit: pagina.limit, offset: pagina.offset } : {}),
    });
  }

  async buscar(id: number): Promise<Model> {
    const item = await this.repo.findOne({ where: { id }, ...(this.include ? { include: this.include } : {}) });
    if (!item) throw new NotFoundException(`${this.entidade} ${id} não encontrado(a).`);
    return item;
  }

  async criar(dto: any): Promise<Model> {
    return this.repo.create(await this.antesDeCriar(dto));
  }

  async atualizar(id: number, dto: any): Promise<Model> {
    const atual = await this.buscar(id);
    await this.repo.update(await this.antesDeAtualizar(dto, atual), { where: { id } });
    return this.buscar(id);
  }

  async remover(id: number) {
    await this.buscar(id);
    await this.repo.destroy({ where: { id } });
    return { deleted: true };
  }

  /** Ganchos: ajustam/validam os dados antes de gravar. */
  protected async antesDeCriar(dto: any): Promise<any> {
    return dto;
  }
  protected async antesDeAtualizar(dto: any, _atual: Model): Promise<any> {
    return dto;
  }
}
