import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

/**
 * Onde o dinheiro mora: conta corrente (Sicoob, Nubank), investimento (RDB, renda
 * variável) ou cartão de crédito. Não confundir com `counts` ("Conta" = molde das
 * contas a pagar, tipo Luz e Netflix). Migration 005.
 */
@Table({
  tableName: 'contas_bancarias',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class ContaBancaria extends Model<ContaBancaria> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare nome: string;

  // corrente | investimento | cartao
  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'corrente' })
  declare tipo: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare saldo_inicial: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativa: boolean;
}
