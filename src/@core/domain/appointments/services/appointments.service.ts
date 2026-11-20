import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import type { AppointmentRepositoryInterface } from '../repositories/appointments.repository.interface';
import type { BaseRepository } from '../../shared/repository.interface';
import { AvisoAgendamento } from '../../../infraestructure/appointments/sequelize/aviso-agendamento.model';
import { combinarDataHora, dataHoraSP, somarDias } from '../../shared/date.helper';

const INCLUIR_AVISOS = [{ model: AvisoAgendamento, required: false }];

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject('APPOINTMENT_REPOSITORY')
    private readonly appoinmentsRepository: AppointmentRepositoryInterface,
    @Inject('AVISO_AGENDAMENTO_REPOSITORY')
    private readonly avisosRepository: BaseRepository<AvisoAgendamento>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    const { avisos, avisar, ...dados } = createAppointmentDto;
    const datas = this.calcularAvisos(dados.data_evento, avisos, avisar);

    const criado = await this.appoinmentsRepository.create({
      ...dados,
      ...this.dataHoraDoEvento(dados.data_evento, dados.hora_evento),
    } as any);
    await this.gravarAvisos(criado.id, datas);
    return this.findOne(criado.id);
  }

  findAll(start?: string, end?: string) {
    return this.appoinmentsRepository.findAll({
      where:
        start && end
          ? {
              data_evento: {
                [Op.between]: [start, end],
              },
            }
          : undefined,
      include: INCLUIR_AVISOS,
      order: [
        ['data_evento', 'ASC'],
        ['hora_evento', 'ASC'],
      ],
    });
  }

  async findOne(id: number) {
    const agendamento = await this.appoinmentsRepository.findOne({ where: { id }, include: INCLUIR_AVISOS });
    if (!agendamento) throw new NotFoundException(`Agendamento ${id} não encontrado.`);
    return agendamento;
  }

  async update(id: number, updateAppointmentDto: UpdateAppointmentDto) {
    const atual = await this.findOne(id);
    const { avisos, avisar, ...dados } = updateAppointmentDto;

    // Se a data ou a hora mudou, recalcula data_hora_evento com os valores já mesclados
    const mexeuNoHorario = dados.data_evento !== undefined || dados.hora_evento !== undefined;
    const dataFinal = dados.data_evento ?? atual.data_evento;
    const horaFinal = dados.hora_evento ?? atual.hora_evento ?? undefined;

    // Avisos informados SUBSTITUEM os que ainda não foram enviados
    const querAvisos = avisos !== undefined || avisar !== undefined;
    const datas = querAvisos ? this.calcularAvisos(dataFinal, avisos, avisar) : [];

    await this.appoinmentsRepository.update(
      { ...dados, ...(mexeuNoHorario ? this.dataHoraDoEvento(dataFinal, horaFinal) : {}) },
      { where: { id } },
    );
    if (querAvisos) {
      await this.avisosRepository.destroy({ where: { id_appointment: id, enviado_em: null } });
      await this.gravarAvisos(id, datas);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.avisosRepository.destroy({ where: { id_appointment: id } });
    await this.appoinmentsRepository.destroy({ where: { id } });
    return { deleted: true };
  }

  // ---- Avisos (consumidos por notificacoes/pendentes) ----

  /** Avisos que já deviam ter saído (avisar_em <= agora) e ainda não foram enviados. */
  async avisosPendentes(agora: Date) {
    const avisos = await this.avisosRepository.findAll({
      where: { enviado_em: null, avisar_em: { [Op.lte]: agora } },
      order: [['avisar_em', 'ASC']],
    });
    const pendentes: Array<{ aviso: AvisoAgendamento; agendamento: any }> = [];
    for (const aviso of avisos) {
      const agendamento = await this.appoinmentsRepository.findOne({ where: { id: aviso.id_appointment } });
      if (agendamento) pendentes.push({ aviso, agendamento }); // compromisso apagado: ignora
    }
    return pendentes;
  }

  async marcarAvisoEnviado(id: number) {
    const aviso = await this.avisosRepository.findOne({ where: { id } });
    if (!aviso) throw new NotFoundException(`Aviso ${id} não encontrado.`);
    await this.avisosRepository.update({ enviado_em: new Date() }, { where: { id } });
    return { ok: true };
  }

  // ---- Privados ----

  /** data_hora_evento = data + hora (horário de São Paulo); sem hora, fica vazio. */
  private dataHoraDoEvento(data: string, hora?: string | null) {
    return { data_hora_evento: hora ? combinarDataHora(data.slice(0, 10), hora) : null };
  }

  /** Junta os avisos exatos com o atalho escolhido, valida e remove repetidos. */
  private calcularAvisos(data: string, avisos?: string[], atalho?: string): Date[] {
    const textos = [...(avisos ?? [])];
    const dia = data.slice(0, 10);
    if (atalho === 'no_dia_8h') textos.push(`${dia}T08:00`);
    if (atalho === 'dia_anterior_20h') textos.push(`${somarDias(dia, -1)}T20:00`);

    const datas = textos.map((t) => {
      const d = dataHoraSP(t);
      if (!d) throw new BadRequestException(`Aviso inválido: ${t}`);
      return d;
    });
    return [...new Map(datas.map((d) => [d.getTime(), d])).values()];
  }

  private async gravarAvisos(id_appointment: number, datas: Date[]) {
    for (const avisar_em of datas) {
      await this.avisosRepository.create({ id_appointment, avisar_em } as any);
    }
  }
}
