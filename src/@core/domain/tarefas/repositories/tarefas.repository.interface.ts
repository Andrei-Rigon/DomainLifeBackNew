import { BaseRepository } from '../../shared/repository.interface';
import { Tarefa } from '../entities/tarefa.entity';

export interface TarefasRepositoryInterface extends BaseRepository<Tarefa> {}
