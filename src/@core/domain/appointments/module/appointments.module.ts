import { Module } from '@nestjs/common';
import { AppointmentsService } from '../services/appointments.service';
import { AppointmentsController } from '../controllers/appointments.controller';
import { AppointmentProvider } from '../providers/appointments.providers';
import { SequelizeModule } from '@nestjs/sequelize';
import { Appointment } from '../entities/appointment.entity';
import { AvisoAgendamento } from '../../../infraestructure/appointments/sequelize/aviso-agendamento.model';

@Module({
  imports: [SequelizeModule.forFeature([Appointment, AvisoAgendamento])],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    ...AppointmentProvider,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
