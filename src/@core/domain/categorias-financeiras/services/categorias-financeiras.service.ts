import { ConflictException, Inject, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { BaseCrudService } from '../../shared/base-crud.service';
import { normalizar } from '../../shared/text';
import type { BaseRepository } from '../../shared/repository.interface';
import { CategoriaFinanceira } from '../entities/categoria-financeira.entity';
import { Lancamento } from '../../lancamentos/entities/lancamento.entity';

// Categorias criadas automaticamente na primeira subida (só as que ainda não existem)
const SEMENTES: Array<{ nome: string; tipo: string }> = [
  { nome: 'Mercado', tipo: 'despesa' },
  { nome: 'Combustível', tipo: 'despesa' },
  { nome: 'Alimentação fora', tipo: 'despesa' },
  { nome: 'Contas da casa', tipo: 'despesa' },
  { nome: 'Saúde', tipo: 'despesa' },
  { nome: 'Lazer', tipo: 'despesa' },
  { nome: 'Transporte', tipo: 'despesa' },
  { nome: 'Assinaturas', tipo: 'despesa' },
  { nome: 'Outros', tipo: 'despesa' },
  { nome: 'Salário', tipo: 'receita' },
  { nome: 'Extra', tipo: 'receita' },
];

@Injectable()
export class CategoriasFinanceirasService extends BaseCrudService<CategoriaFinanceira> implements OnApplicationBootstrap {
  protected readonly entidade = 'Categoria';
  protected ordem: any[] = [['nome', 'ASC']];
  private readonly logger = new Logger(CategoriasFinanceirasService.name);

  constructor(
    @Inject('CATEGORIAS_FINANCEIRAS_REPOSITORY')
    protected readonly repo: BaseRepository<CategoriaFinanceira>,
    @Inject('LANCAMENTOS_REPOSITORY')
    private readonly lancamentos: BaseRepository<Lancamento>,
  ) {
    super();
  }

  async onApplicationBootstrap() {
    try {
      for (const semente of SEMENTES) await this.obterOuCriar(semente.nome, semente.tipo);
    } catch (erro) {
      // Não derruba a API se a tabela ainda não existir; o seed roda na próxima subida.
      this.logger.warn(`Seed de categorias não executado: ${(erro as Error).message}`);
    }
  }

  listarPorTipo(tipo: string | undefined, pagina: { limit: number; offset: number }) {
    return this.listar(tipo ? { tipo } : {}, pagina);
  }

  /** Todas as categorias (sem paginação): usado para montar relatórios. */
  todas() {
    return this.repo.findAll({ order: this.ordem });
  }

  /** Procura por nome (sem diferenciar maiúsculas/acentos). */
  buscarPorNome(nome: string) {
    return this.repo.findOne({ where: { nome_normalizado: normalizar(nome) } });
  }

  /** Usado pelo Ciel: devolve a categoria ou cria (com o tipo informado) se não existir. */
  async obterOuCriar(nome: string, tipo: string): Promise<CategoriaFinanceira> {
    const existente = await this.buscarPorNome(nome);
    if (existente) return existente;
    return this.repo.create({ nome: nome.trim(), nome_normalizado: normalizar(nome), tipo } as any);
  }

  protected async antesDeCriar(dto: any) {
    await this.garantirNomeLivre(dto.nome);
    return { ...dto, nome: dto.nome.trim(), nome_normalizado: normalizar(dto.nome), tipo: dto.tipo ?? 'despesa' };
  }

  protected async antesDeAtualizar(dto: any, atual: CategoriaFinanceira) {
    if (dto.nome === undefined) return dto;
    await this.garantirNomeLivre(dto.nome, atual.id);
    return { ...dto, nome: dto.nome.trim(), nome_normalizado: normalizar(dto.nome) };
  }

  async remover(id: number) {
    await this.buscar(id);
    const emUso = await this.lancamentos.count({ where: { id_categoria: id } });
    if (emUso > 0) throw new ConflictException('Essa categoria ainda tem lançamentos vinculados.');
    await this.repo.destroy({ where: { id } });
    return { deleted: true };
  }

  private async garantirNomeLivre(nome: string, idAtual?: number) {
    const existente = await this.buscarPorNome(nome);
    if (existente && Number(existente.id) !== Number(idAtual)) {
      throw new ConflictException(`Já existe a categoria "${existente.nome}".`);
    }
  }
}
