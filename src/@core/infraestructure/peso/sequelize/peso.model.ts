import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

/** Um registro por dia (data única). Sem soft delete para a data poder ser regravada. */
@Table({ tableName: 'pesos', timestamps: true, paranoid: false, underscored: true })
export class Peso extends Model<Peso> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.DATEONLY, allowNull: false, unique: true })
  declare data: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  declare peso_kg: number;
}
