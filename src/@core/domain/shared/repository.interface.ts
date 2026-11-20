import { CountOptions, DestroyOptions, FindOptions, UpdateOptions } from 'sequelize';

/**
 * Contrato mínimo que os services conhecem. Os models do Sequelize
 * (métodos estáticos) satisfazem essa assinatura, então o provider
 * usa o próprio model como implementação do repositório.
 */
export interface BaseRepository<Model, CreateDto = any> {
  findOne(query: FindOptions): Promise<Model | null>;
  findAll(query?: FindOptions): Promise<Model[]>;
  create(values: CreateDto): Promise<Model>;
  update(values: any, query: UpdateOptions): Promise<[number]>;
  destroy(query: DestroyOptions): Promise<number>;
  count(query?: CountOptions): Promise<number>;
}
