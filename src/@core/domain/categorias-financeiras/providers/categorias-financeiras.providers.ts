import { CategoriaFinanceira } from '../entities/categoria-financeira.entity';
import { Lancamento } from '../../lancamentos/entities/lancamento.entity';

export const CategoriasFinanceirasProvider = [
  {
    provide: 'CATEGORIAS_FINANCEIRAS_REPOSITORY',
    useValue: CategoriaFinanceira,
  },
  {
    // Impede apagar categoria que ainda tem lançamentos
    provide: 'LANCAMENTOS_REPOSITORY',
    useValue: Lancamento,
  },
];
