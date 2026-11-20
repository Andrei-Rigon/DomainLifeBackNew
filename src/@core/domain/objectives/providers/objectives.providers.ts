import { ObjectivesCategories } from '../../objectives_categories/entities/objectives_category.entity';
import { Objectives } from '../entities/objectives.entity';

export const ObjectivesProvider = [
  {
    provide: 'OBJECTIVES_REPOSITORY',
    useValue: Objectives,
  },
  {
    // Usado para validar a categoria informada no objetivo
    provide: 'OBJECTIVES_CATEGORIES_REPOSITORY',
    useValue: ObjectivesCategories,
  },
];
