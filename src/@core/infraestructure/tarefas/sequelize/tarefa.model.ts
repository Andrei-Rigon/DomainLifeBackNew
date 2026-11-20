import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'tarefas', timestamps: true, paranoid: true, underscored: true })
export class Tarefa extends Model<Tarefa> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare titulo: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare descricao: string | null;

  // a_fazer | em_andamento | feito
  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'a_fazer' })
  declare status: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare prazo: string | null;

  // baixa | media | alta
  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'media' })
  declare prioridade: string;
}
