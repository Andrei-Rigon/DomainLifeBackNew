import { BaseRepository } from '../../shared/repository.interface';
import { CreateObjectivesCategoryDto } from '../dto/create-objectives_category.dto';
import { ObjectivesCategories } from '../entities/objectives_category.entity';

export interface ObjectivesCategoriesInterface
  extends BaseRepository<ObjectivesCategories, CreateObjectivesCategoryDto> {}
