import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

/**
 * Categoria de gasto/receita do dia a dia (Mercado, Salário...).
 * Não usa soft delete: o nome precisa ficar livre para ser recriado.
 */
@Table({
  tableName: 'categorias_financeiras',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class CategoriaFinanceira extends Model<CategoriaFinanceira> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare nome: string;

  // "Salário" -> "salario": garante nome único sem diferenciar maiúsculas/acentos
  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  declare nome_normalizado: string;

  // despesa | receita | ambos
  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'despesa' })
  declare tipo: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare cor: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare icone: string | null;
}
