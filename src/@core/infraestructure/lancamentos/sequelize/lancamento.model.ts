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
import { CategoriaFinanceira } from '../../categorias-financeiras/sequelize/categoria-financeira.model';

/** Gasto ou receita avulso do dia a dia (diferente de `pagar`, que são parcelas de contas). */
@Table({
  tableName: 'lancamentos',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class Lancamento extends Model<Lancamento> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  // despesa | receita
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare tipo: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare valor: number;

  @ForeignKey(() => CategoriaFinanceira)
  @Column({ type: DataType.BIGINT, allowNull: true })
  declare id_categoria: number | null;

  @BelongsTo(() => CategoriaFinanceira)
  declare categoria?: CategoriaFinanceira;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare descricao: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare data: string;

  // pix | debito | credito | dinheiro | outro
  @Column({ type: DataType.STRING(20), allowNull: true })
  declare forma_pagamento: string | null;

  // manual | ciel | whatsapp | importacao
  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'manual' })
  declare origem: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observacao: string | null;

  // Contabilizar no caixa (migration 004). false = fora dos totais/saldo (ex.: pago no cartão).
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare contabilizar: boolean;
}
