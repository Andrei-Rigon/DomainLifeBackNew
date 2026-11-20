import { Aniversario } from '../entities/aniversario.entity';

export const AniversariosProvider = [
  {
    provide: 'ANIVERSARIOS_REPOSITORY',
    useValue: Aniversario,
  },
];
