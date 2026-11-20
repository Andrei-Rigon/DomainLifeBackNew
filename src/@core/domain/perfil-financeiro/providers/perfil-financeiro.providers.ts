import { PerfilFinanceiro } from '../entities/perfil-financeiro.entity';

export const PerfilFinanceiroProvider = [
  {
    provide: 'PERFIL_FINANCEIRO_REPOSITORY',
    useValue: PerfilFinanceiro,
  },
];
