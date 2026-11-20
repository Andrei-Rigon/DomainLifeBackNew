import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'aniversarios', timestamps: true, paranoid: true, underscored: true })
export class Aniversario extends Model<Aniversario> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  declare id: number;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare nome: string;

  // "YYYY-MM-DD" ou só "MM-DD" quando o ano é desconhecido
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare data_nascimento: string;

  @Column({ type: DataType.STRING(30), allowNull: true })
  declare telefone: string | null;

  // Texto do parabéns (usado por quem enviar a mensagem)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare mensagem: string | null;

  // Ano em que o aviso já foi dado (evita avisar duas vezes no mesmo aniversário)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare ultimo_aviso_ano: number | null;
}
