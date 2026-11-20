import { Module } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { DashboardController } from '../controllers/dashboard.controller';
import { AppointmentsModule } from '../../appointments/module/appointments.module';
import { TarefasModule } from '../../tarefas/module/tarefas.module';
import { LembretesModule } from '../../lembretes/module/lembretes.module';
import { FinanceiroModule } from '../../financeiro/module/financeiro.module';
import { PagarModule } from '../../pagar/module/pagar.module';
import { MetasSemanaisModule } from '../../metas-semanais/module/metas-semanais.module';
import { PesoModule } from '../../peso/module/peso.module';

@Module({
  imports: [AppointmentsModule, TarefasModule, LembretesModule, FinanceiroModule, PagarModule, MetasSemanaisModule, PesoModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
