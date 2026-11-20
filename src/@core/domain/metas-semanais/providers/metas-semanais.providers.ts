import { MetaSemanal } from '../entities/meta-semanal.entity';

export const MetasSemanaisProvider = [
  {
    provide: 'METAS_SEMANAIS_REPOSITORY',
    useValue: MetaSemanal,
  },
];
