import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { BaseCrudService } from '../../shared/base-crud.service';
import type { BaseRepository } from '../../shared/repository.interface';
import { ContaBancaria } from '../entities/conta-bancaria.entity';

@Injectable()
export class ContasBancariasService extends BaseCrudService<ContaBancaria> {
  protected readonly entidade = 'Conta bancária';
  protected ordem: any[] = [
    ['ativa', 'DESC'],
    ['nome', 'ASC'],
  ];

  constructor(
    @Inject('CONTAS_BANCARIAS_REPOSITORY')
    protected readonly repo: BaseRepository<ContaBancaria>,
    @Inject('LANCAMENTOS_REPOSITORY')
    private readonly lancamentos: BaseRepository<any>,
    @Inject('PAGAR_REPOSITORY')
    private readonly pagar: BaseRepository<any>,
    @Inject('RECEBER_REPOSITORY')
    private readonly receber: BaseRepository<any>,
  ) {
    super();
  }

  /** Todas (inclusive inativas), para o cálculo de saldos. */
  todas() {
    return this.repo.findAll({ order: this.ordem });
  }

  /** Conta com movimentação não pode ser apagada (o saldo dela sumiria): desative. */
  async remover(id: number) {
    await this.buscar(id);
    const usos =
      (await this.lancamentos.count({ where: { [Op.or]: [{ id_conta_bancaria: id }, { id_conta_destino: id }] } })) +
      (await this.pagar.count({ where: { id_conta_bancaria: id } })) +
      (await this.receber.count({ where: { id_conta_bancaria: id } }));
    if (usos > 0) {
      throw new ConflictException(`Esta conta tem ${usos} movimentação(ões). Desative em vez de apagar.`);
    }
    return super.remover(id);
  }
}
