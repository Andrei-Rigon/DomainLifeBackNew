import { BaseRepository } from '../../shared/repository.interface';
import { CreatePagarDto } from '../dto/create-pagar.dto';
import { Pagar } from '../entities/pagar.entity';

export interface PagarRepositoryInterface extends BaseRepository<Pagar, CreatePagarDto> {
  bulkCreate(values: any[]): Promise<Pagar[]>;
}
