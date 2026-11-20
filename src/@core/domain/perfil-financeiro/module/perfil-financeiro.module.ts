import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PerfilFinanceiroService } from '../services/perfil-financeiro.service';
import { PerfilFinanceiroController } from '../controllers/perfil-financeiro.controller';
import { PerfilFinanceiroProvider } from '../providers/perfil-financeiro.providers';
import { PerfilFinanceiro } from '../entities/perfil-financeiro.entity';

@Module({
  imports: [SequelizeModule.forFeature([PerfilFinanceiro])],
  controllers: [PerfilFinanceiroController],
  providers: [PerfilFinanceiroService, ...PerfilFinanceiroProvider],
  exports: [PerfilFinanceiroService],
})
export class PerfilFinanceiroModule {}
