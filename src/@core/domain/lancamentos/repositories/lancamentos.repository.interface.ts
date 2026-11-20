import { BaseRepository } from '../../shared/repository.interface';
import { Lancamento } from '../entities/lancamento.entity';

export interface LancamentosRepositoryInterface extends BaseRepository<Lancamento> {}
