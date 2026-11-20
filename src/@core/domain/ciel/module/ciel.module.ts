import { Module } from '@nestjs/common';
import { CielService } from '../services/ciel.service';
import { CielController } from '../controllers/ciel.controller';
import { CategoriasFinanceirasModule } from '../../categorias-financeiras/module/categorias-financeiras.module';
import { LancamentosModule } from '../../lancamentos/module/lancamentos.module';
import { FinanceiroModule } from '../../financeiro/module/financeiro.module';
import { CountsModule } from '../../counts/module/counts.module';
import { PagarModule } from '../../pagar/module/pagar.module';
import { AppointmentsModule } from '../../appointments/module/appointments.module';
import { LembretesModule } from '../../lembretes/module/lembretes.module';
import { NotesModule } from '../../notes/module/notes.module';
import { ComprasModule } from '../../compras/module/compras.module';
import { TarefasModule } from '../../tarefas/module/tarefas.module';
import { PesoModule } from '../../peso/module/peso.module';
import { PerfilFinanceiroModule } from '../../perfil-financeiro/module/perfil-financeiro.module';

@Module({
  imports: [
    CategoriasFinanceirasModule,
    LancamentosModule,
    FinanceiroModule,
    CountsModule,
    PagarModule,
    AppointmentsModule,
    LembretesModule,
    NotesModule,
    ComprasModule,
    TarefasModule,
    PesoModule,
    PerfilFinanceiroModule,
  ],
  controllers: [CielController],
  providers: [CielService],
})
export class CielModule {}
