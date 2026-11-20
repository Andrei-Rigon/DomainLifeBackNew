import { Module } from '@nestjs/common';
import { NotificacoesService } from '../services/notificacoes.service';
import { NotificacoesController } from '../controllers/notificacoes.controller';
import { AppointmentsModule } from '../../appointments/module/appointments.module';
import { LembretesModule } from '../../lembretes/module/lembretes.module';
import { CountsModule } from '../../counts/module/counts.module';
import { PagarModule } from '../../pagar/module/pagar.module';
import { AniversariosModule } from '../../aniversarios/module/aniversarios.module';

@Module({
  imports: [CountsModule, AppointmentsModule, LembretesModule, PagarModule, AniversariosModule],
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
})
export class NotificacoesModule {}
