import { Objectives } from '../../objectives/entities/objectives.entity';
import { ObjectivesCategories } from '../entities/objectives_category.entity';

export const ObjectivesCategoriesProvider = [
  {
    provide: 'OBJECTIVES_CATEGORIES_REPOSITORY',
    useValue: ObjectivesCategories,
  },
  {
    // Usado para impedir apagar categoria que ainda tem objetivos
    provide: 'OBJECTIVES_REPOSITORY',
    useValue: Objectives,
  },
];
