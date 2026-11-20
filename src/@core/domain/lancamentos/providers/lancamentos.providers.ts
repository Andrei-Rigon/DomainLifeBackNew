import { Lancamento } from '../entities/lancamento.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';

export const LancamentosProvider = [
  {
    provide: 'LANCAMENTOS_REPOSITORY',
    useValue: Lancamento,
  },
  {
    // Valida a categoria informada no lançamento
    provide: 'CATEGORIAS_FINANCEIRAS_REPOSITORY',
    useValue: CategoriaFinanceira,
  },
];
