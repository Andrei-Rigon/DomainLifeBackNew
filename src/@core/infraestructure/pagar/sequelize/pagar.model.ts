import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Counts } from '../../counts/sequelize/counts.model';
import { ContaBancaria } from '../../contas-bancarias/sequelize/conta-bancaria.model';

/** Uma parcela/ciclo de pagamento gerada a partir de uma Conta. */
@Table({
  tableName: 'pagar',
  timestamps: true, // created_at / updated_at
  paranoid: true, // soft delete -> deleted_at
  underscored: true, // usa snake_case nas colunas (created_at, deleted_at, etc.)
})
export class Pagar extends Model<Pagar> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @ForeignKey(() => Counts)
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare id_count: number;

  @BelongsTo(() => Counts)
  declare conta?: Counts;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare descricao: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare numero_parcela: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare valor_parcela: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare valor_pago: number | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare data_vencimento: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare data_pagamento: string | null;

  @Column({
    type: DataType.ENUM('Pendente', 'Paga', 'Atrasada'),
    allowNull: false,
    defaultValue: 'Pendente',
  })
  declare status: string;

  // Quando a parcela foi avisada em GET /notificacoes/pendentes (coluna nova: migrations/002)
  @Column({ type: DataType.DATE, allowNull: true })
  declare notificado_em: Date | null;

  // Contabilizar no caixa (migration 004). false = fora dos totais/saldo (ex.: pago no cartão).
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare contabilizar: boolean;

  // Conta bancária de onde saiu/entrou o dinheiro (migration 005). Opcional.
  @ForeignKey(() => ContaBancaria)
  @Column({ type: DataType.BIGINT, allowNull: true })
  declare id_conta_bancaria: number | null;

  @BelongsTo(() => ContaBancaria, 'id_conta_bancaria')
  declare conta_bancaria?: ContaBancaria;
}
