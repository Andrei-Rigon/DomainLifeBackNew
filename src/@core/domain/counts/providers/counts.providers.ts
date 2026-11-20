import { Counts, CategoriaConta } from '../entities/count.entity';

export const CountsProvider = [
  {
    provide: 'COUNT_REPOSITORY',
    useValue: Counts,
  },
  {
    provide: 'CATEGORIA_CONTA_REPOSITORY',
    useValue: CategoriaConta,
  },
];
