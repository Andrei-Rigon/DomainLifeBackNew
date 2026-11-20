import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LancamentosService } from '../services/lancamentos.service';
import { LancamentosController } from '../controllers/lancamentos.controller';
import { LancamentosProvider } from '../providers/lancamentos.providers';
import { Lancamento } from '../entities/lancamento.entity';
import { CategoriaFinanceira } from '../../categorias-financeiras/entities/categoria-financeira.entity';

@Module({
  imports: [SequelizeModule.forFeature([Lancamento, CategoriaFinanceira])],
  controllers: [LancamentosController],
  providers: [LancamentosService, ...LancamentosProvider],
  exports: [LancamentosService],
})
export class LancamentosModule {}
