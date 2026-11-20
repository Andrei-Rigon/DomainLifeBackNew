import { Inject, Injectable } from '@nestjs/common';
import { BaseCrudService } from '../../shared/base-crud.service';
import { Paginacao } from '../../shared/pagination';
import type { BaseRepository } from '../../shared/repository.interface';
import { Compra } from '../entities/compra.entity';

@Injectable()
export class ComprasService extends BaseCrudService<Compra> {
  protected readonly entidade = 'Item';
  protected ordem: any[] = [
    ['comprado', 'ASC'],
    ['id', 'ASC'],
  ];

  constructor(
    @Inject('COMPRAS_REPOSITORY')
    protected readonly repo: BaseRepository<Compra>,
  ) {
    super();
  }

  listarFiltrado(lista: string | undefined, comprado: string | undefined, pagina: Paginacao) {
    const where: Record<string, any> = {};
    if (lista) where.lista = lista;
    if (comprado !== undefined) where.comprado = comprado === 'true';
    return this.listar(where, pagina);
  }

  /** Itens ainda não comprados (todas as listas ou só uma). */
  aComprar(lista?: string) {
    return this.listar({ comprado: false, ...(lista ? { lista } : {}) });
  }

  protected async antesDeCriar(dto: any) {
    return {
      ...dto,
      lista: dto.lista ?? 'mercado',
      comprado: dto.comprado ?? false,
      comprado_em: dto.comprado ? new Date() : null,
    };
  }

  // Marcar como comprado grava a data; desmarcar limpa.
  protected async antesDeAtualizar(dto: any) {
    if (dto.comprado === undefined) return dto;
    return { ...dto, comprado_em: dto.comprado ? new Date() : null };
  }

  /** Apaga da lista os itens já comprados (tudo, ou só de uma lista). */
  async limparComprados(lista?: string) {
    const removidos = await this.repo.destroy({ where: { comprado: true, ...(lista ? { lista } : {}) } });
    return { removidos };
  }
}
