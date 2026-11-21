import { ContaBancaria } from '../entities/conta-bancaria.entity';
import { Lancamento } from '../../lancamentos/entities/lancamento.entity';
import { Pagar } from '../../pagar/entities/pagar.entity';
import { Receber } from '../../receber/entities/receber.entity';

export const ContasBancariasProvider = [
  { provide: 'CONTAS_BANCARIAS_REPOSITORY', useValue: ContaBancaria },
  // Impede apagar conta que ainda tem movimentação
  { provide: 'LANCAMENTOS_REPOSITORY', useValue: Lancamento },
  { provide: 'PAGAR_REPOSITORY', useValue: Pagar },
  { provide: 'RECEBER_REPOSITORY', useValue: Receber },
];
