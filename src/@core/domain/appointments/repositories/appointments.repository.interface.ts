import { BaseRepository } from '../../shared/repository.interface';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { Appointment } from '../entities/appointment.entity';

export interface AppointmentRepositoryInterface extends BaseRepository<Appointment, CreateAppointmentDto> {}
