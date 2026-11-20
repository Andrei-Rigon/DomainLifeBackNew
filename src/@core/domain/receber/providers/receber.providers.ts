import { Receber } from '../entities/receber.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';

export const ReceberProvider = [
  {
    provide: 'RECEBER_REPOSITORY',
    useValue: Receber,
  },
  {
    // Valida a categoria informada
    provide: 'CATEGORIAS_FINANCEIRAS_REPOSITORY',
    useValue: CategoriaFinanceira,
  },
];
