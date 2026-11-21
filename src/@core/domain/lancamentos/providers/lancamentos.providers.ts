import { Lancamento } from '../entities/lancamento.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';
import { ContaBancaria } from '../../contas-bancarias/entities/conta-bancaria.entity';

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
  {
    // Valida as contas bancárias (origem/destino) do lançamento
    provide: 'CONTAS_BANCARIAS_REPOSITORY',
    useValue: ContaBancaria,
  },
];
