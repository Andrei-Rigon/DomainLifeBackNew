import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReceberService } from '../services/receber.service';
import { ReceberController } from '../controllers/receber.controller';
import { ReceberProvider } from '../providers/receber.providers';
import { Receber } from '../entities/receber.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';

@Module({
  imports: [SequelizeModule.forFeature([Receber, CategoriaFinanceira])],
  controllers: [ReceberController],
  providers: [ReceberService, ...ReceberProvider],
  exports: [ReceberService],
})
export class ReceberModule {}
