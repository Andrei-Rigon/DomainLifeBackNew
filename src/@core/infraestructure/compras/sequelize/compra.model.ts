import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'compras', timestamps: true, paranoid: true, underscored: true })
export class Compra extends Model<Compra> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare item: string;

  // Texto livre: "2", "1 caixa", "500g"
  @Column({ type: DataType.STRING(50), allowNull: true })
  declare quantidade: string | null;

  // mercado | online
  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'mercado' })
  declare lista: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  declare link: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare preco_estimado: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare comprado: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare comprado_em: Date | null;
}
