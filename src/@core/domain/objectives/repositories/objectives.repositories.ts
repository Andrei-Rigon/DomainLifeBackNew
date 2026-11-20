import { BaseRepository } from '../../shared/repository.interface';
import { CreateObjectiveDto } from '../dto/create-objective.dto';
import { Objectives } from '../entities/objectives.entity';

export interface ObjectivesRepositoryInterface extends BaseRepository<Objectives, CreateObjectiveDto> {}
