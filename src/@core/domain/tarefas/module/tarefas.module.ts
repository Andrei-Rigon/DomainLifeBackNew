import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TarefasService } from '../services/tarefas.service';
import { TarefasController } from '../controllers/tarefas.controller';
import { TarefasProvider } from '../providers/tarefas.providers';
import { Tarefa } from '../entities/tarefa.entity';

@Module({
  imports: [SequelizeModule.forFeature([Tarefa])],
  controllers: [TarefasController],
  providers: [TarefasService, ...TarefasProvider],
  exports: [TarefasService],
})
export class TarefasModule {}
