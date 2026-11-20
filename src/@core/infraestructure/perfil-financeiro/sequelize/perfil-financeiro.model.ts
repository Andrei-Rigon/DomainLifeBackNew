import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

/** Registro único: dados para calcular "quantas horas de trabalho custa X". */
@Table({
  tableName: 'perfil_financeiro',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class PerfilFinanceiro extends Model<PerfilFinanceiro> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare salario_liquido: number | null;

  // Saldo que o Andrei já tinha ao começar a usar o sistema (entra no saldo acumulado)
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  declare saldo_inicial: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 22 })
  declare dias_trabalhados_mes: number;

  @Column({ type: DataType.DECIMAL(4, 2), allowNull: false, defaultValue: 8 })
  declare horas_por_dia: number;
}
