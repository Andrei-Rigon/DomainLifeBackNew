import { Counts } from '../../counts/entities/count.entity';
import { Pagar } from '../entities/pagar.entity';

export const PagarProvider = [
  {
    provide: 'PAGAR_REPOSITORY',
    useValue: Pagar,
  },
  {
    // Usado para validar a conta e gerar parcelas a partir dela
    provide: 'COUNT_REPOSITORY',
    useValue: Counts,
  },
];
