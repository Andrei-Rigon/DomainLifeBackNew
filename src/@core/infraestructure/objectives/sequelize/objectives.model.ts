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
import { ObjectivesCategories } from './categories_objectives.model';

@Table({
  tableName: 'objectives',
  timestamps: true, // created_at / updated_at
  paranoid: true, // soft delete -> deleted_at
  underscored: true, // usa snake_case nas colunas (created_at, deleted_at, etc.)
})
export class Objectives extends Model<Objectives> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare titulo: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare descricao: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare prazo: Date | string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare valor_guardado: number | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  declare valor_objetivo: number | null;

  // Derivado de valor_guardado / valor_objetivo (calculado pelo service)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare porcentagem: number | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare checked: boolean;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare prioridade: string | null;

  @ForeignKey(() => ObjectivesCategories)
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare id_categoria: number;

  @BelongsTo(() => ObjectivesCategories)
  declare categoria?: ObjectivesCategories;
}
