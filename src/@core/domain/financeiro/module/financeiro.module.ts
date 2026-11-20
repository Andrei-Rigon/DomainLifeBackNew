import { Module } from '@nestjs/common';
import { FinanceiroService } from '../services/financeiro.service';
import { FinanceiroController } from '../controllers/financeiro.controller';
import { LancamentosModule } from '../../lancamentos/module/lancamentos.module';
import { PagarModule } from '../../pagar/module/pagar.module';
import { ReceberModule } from '../../receber/module/receber.module';
import { PerfilFinanceiroModule } from '../../perfil-financeiro/module/perfil-financeiro.module';
import { CategoriasFinanceirasModule } from '../../categorias-financeiras/module/categorias-financeiras.module';

@Module({
  imports: [LancamentosModule, PagarModule, ReceberModule, CategoriasFinanceirasModule, PerfilFinanceiroModule],
  controllers: [FinanceiroController],
  providers: [FinanceiroService],
  exports: [FinanceiroService],
})
export class FinanceiroModule {}
