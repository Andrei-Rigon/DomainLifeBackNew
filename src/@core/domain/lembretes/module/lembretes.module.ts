import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LembretesService } from '../services/lembretes.service';
import { LembretesController } from '../controllers/lembretes.controller';
import { LembretesProvider } from '../providers/lembretes.providers';
import { Lembrete } from '../entities/lembrete.entity';

@Module({
  imports: [SequelizeModule.forFeature([Lembrete])],
  controllers: [LembretesController],
  providers: [LembretesService, ...LembretesProvider],
  exports: [LembretesService],
})
export class LembretesModule {}
