import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MetasSemanaisService } from '../services/metas-semanais.service';
import { MetasSemanaisController } from '../controllers/metas-semanais.controller';
import { MetasSemanaisProvider } from '../providers/metas-semanais.providers';
import { MetaSemanal } from '../entities/meta-semanal.entity';

@Module({
  imports: [SequelizeModule.forFeature([MetaSemanal])],
  controllers: [MetasSemanaisController],
  providers: [MetasSemanaisService, ...MetasSemanaisProvider],
  exports: [MetasSemanaisService],
})
export class MetasSemanaisModule {}
