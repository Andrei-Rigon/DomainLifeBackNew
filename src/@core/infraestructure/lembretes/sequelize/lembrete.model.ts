import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'lembretes', timestamps: true, paranoid: true, underscored: true })
export class Lembrete extends Model<Lembrete> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare texto: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare lembrar_em: Date;

  // nao | diario | semanal | mensal
  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'nao' })
  declare repetir: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare ativo: boolean;

  // Quando foi avisado pela última vez
  @Column({ type: DataType.DATE, allowNull: true })
  declare enviado_em: Date | null;
}
