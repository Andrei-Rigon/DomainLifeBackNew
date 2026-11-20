import { Compra } from '../entities/compra.entity';

export const ComprasProvider = [
  {
    provide: 'COMPRAS_REPOSITORY',
    useValue: Compra,
  },
];
