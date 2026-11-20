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

/** Valor que o Andrei ainda vai receber (salário, aluguel, freela). É o espelho de `pagar`. */
@Table({ tableName: 'receber', timestamps: true, paranoid: true, underscored: true })
export class Receber extends Model<Receber> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare descricao: string;

  @ForeignKey(() => CategoriaFinanceira)
  @Column({ type: DataType.BIGINT, allowNull: true })
  declare id_categoria: number | null;

  @BelongsTo(() => CategoriaFinanceira)
  declare categoria?: CategoriaFinanceira;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare numero_parcela: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  declare valor: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare valor_recebido: number | null;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare data_vencimento: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare data_recebimento: string | null;

  // Pendente | Recebida | Atrasada (calculado pelo service)
  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'Pendente' })
  declare status: string;
}
