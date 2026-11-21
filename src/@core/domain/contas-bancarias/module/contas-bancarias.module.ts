import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContasBancariasService } from '../services/contas-bancarias.service';
import { ContasBancariasController } from '../controllers/contas-bancarias.controller';
import { ContasBancariasProvider } from '../providers/contas-bancarias.providers';
import { ContaBancaria } from '../entities/conta-bancaria.entity';
import { Lancamento } from '../../lancamentos/entities/lancamento.entity';
import { Pagar } from '../../pagar/entities/pagar.entity';
import { Receber } from '../../receber/entities/receber.entity';

@Module({
  imports: [SequelizeModule.forFeature([ContaBancaria, Lancamento, Pagar, Receber])],
  controllers: [ContasBancariasController],
  providers: [ContasBancariasService, ...ContasBancariasProvider],
  exports: [ContasBancariasService],
})
export class ContasBancariasModule {}
