import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'metas_semanais', timestamps: true, paranoid: true, underscored: true })
export class MetaSemanal extends Model<MetaSemanal> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare titulo: string;

  // Sempre a SEGUNDA-FEIRA da semana (o service normaliza qualquer data informada)
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare semana: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare concluida: boolean;
}
