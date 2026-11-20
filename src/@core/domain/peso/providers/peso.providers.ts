import { Peso } from '../entities/peso.entity';

export const PesoProvider = [
  {
    provide: 'PESO_REPOSITORY',
    useValue: Peso,
  },
];
