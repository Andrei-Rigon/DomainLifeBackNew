import { BaseRepository } from '../../shared/repository.interface';
import { CreateCountDto } from '../dto/create-count.dto';
import { CreateCategoriaContaDto } from '../dto/create-categoria-conta.dto';
import { Counts, CategoriaConta } from '../entities/count.entity';

export interface CountsRepositoryInterface extends BaseRepository<Counts, CreateCountDto> {}

export interface CategoriaContaRepositoryInterface
  extends BaseRepository<CategoriaConta, CreateCategoriaContaDto> {}
