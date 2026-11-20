import { Lembrete } from '../entities/lembrete.entity';

export const LembretesProvider = [
  {
    provide: 'LEMBRETES_REPOSITORY',
    useValue: Lembrete,
  },
];
