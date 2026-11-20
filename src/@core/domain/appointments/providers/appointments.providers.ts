import { Appointment } from '../entities/appointment.entity';
import { AvisoAgendamento } from '../../../infraestructure/appointments/sequelize/aviso-agendamento.model';

export const AppointmentProvider = [
  {
    provide: 'APPOINTMENT_REPOSITORY',
    useValue: Appointment,
  },
  {
    provide: 'AVISO_AGENDAMENTO_REPOSITORY',
    useValue: AvisoAgendamento,
  },
];
