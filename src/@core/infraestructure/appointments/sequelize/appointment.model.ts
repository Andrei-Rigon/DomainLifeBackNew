import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { AvisoAgendamento } from './aviso-agendamento.model';

/**
 * Model do Sequelize (sequelize-typescript) espelhando a tabela `appointments`
 * criada pela migration do Laravel:
 *
 *   $table->id();
 *   $table->string('titulo');
 *   $table->string('descricao')->nullable();
 *   $table->date('data_evento');
 *   $table->time('hora_evento')->nullable();
 *   $table->datetime('data_hora_evento')->nullable();
 *   $table->string('localizacao')->nullable();
 *   $table->timestamps();
 *   $table->softDeletes();
 */
@Table({
  tableName: 'appointments',
  timestamps: true, // created_at / updated_at
  paranoid: true, // soft delete -> deleted_at
  underscored: true, // usa snake_case nas colunas (created_at, deleted_at, etc.)
})
export class Appointment extends Model<Appointment> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare titulo: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare descricao: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare data_evento: string;

  @Column({
    type: DataType.TIME,
    allowNull: true,
  })
  declare hora_evento: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare data_hora_evento: Date | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare localizacao: string | null;

  // Avisos programados para este compromisso (tabela avisos_agendamento)
  @HasMany(() => AvisoAgendamento)
  declare avisos?: AvisoAgendamento[];
}
