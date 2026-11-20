import { Tarefa } from '../entities/tarefa.entity';

export const TarefasProvider = [
  {
    provide: 'TAREFAS_REPOSITORY',
    useValue: Tarefa,
  },
];
