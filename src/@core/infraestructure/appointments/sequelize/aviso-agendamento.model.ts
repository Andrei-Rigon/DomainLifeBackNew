import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey } from 'sequelize-typescript';
import { Appointment } from './appointment.model';

/**
 * Aviso de um compromisso: "me avise em tal data/hora". Quem envia o aviso (WhatsApp)
 * é outra peça: ela lê GET /notificacoes/pendentes e confirma em POST /notificacoes/.../enviado.
 */
@Table({
  tableName: 'avisos_agendamento',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class AvisoAgendamento extends Model<AvisoAgendamento> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @ForeignKey(() => Appointment)
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare id_appointment: number;

  @Column({ type: DataType.DATE, allowNull: false })
  declare avisar_em: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare enviado_em: Date | null;
}
