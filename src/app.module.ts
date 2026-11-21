import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiKeyGuard } from './@core/domain/shared/api-key.guard';
import { NormalizarRespostaInterceptor } from './@core/domain/shared/normalizar-resposta.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppointmentsModule } from './@core/domain/appointments/module/appointments.module';
import { NotesModule } from './@core/domain/notes/module/notes.module';
import { ObjectivesModule } from './@core/domain/objectives/module/objectives.module';
import { ObjectivesCategoriesModule } from './@core/domain/objectives_categories/module/objectives_categories.module';
import { CountsModule } from './@core/domain/counts/module/counts.module';
import { CategoriasFinanceirasModule } from './@core/domain/categorias-financeiras/module/categorias-financeiras.module';
import { LancamentosModule } from './@core/domain/lancamentos/module/lancamentos.module';
import { FinanceiroModule } from './@core/domain/financeiro/module/financeiro.module';
import { PerfilFinanceiroModule } from './@core/domain/perfil-financeiro/module/perfil-financeiro.module';
import { LembretesModule } from './@core/domain/lembretes/module/lembretes.module';
import { TarefasModule } from './@core/domain/tarefas/module/tarefas.module';
import { MetasSemanaisModule } from './@core/domain/metas-semanais/module/metas-semanais.module';
import { ComprasModule } from './@core/domain/compras/module/compras.module';
import { PesoModule } from './@core/domain/peso/module/peso.module';
import { AniversariosModule } from './@core/domain/aniversarios/module/aniversarios.module';
import { NotificacoesModule } from './@core/domain/notificacoes/module/notificacoes.module';
import { DashboardModule } from './@core/domain/dashboard/module/dashboard.module';
import { CielModule } from './@core/domain/ciel/module/ciel.module';
import { ReceberModule } from './@core/domain/receber/module/receber.module';
import { PagarModule } from './@core/domain/pagar/module/pagar.module';
import { ContasBancariasModule } from './@core/domain/contas-bancarias/module/contas-bancarias.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Deixar global
    }),

    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),

        autoLoadModels: true,
        synchronize: true, // Não pode subir pra prod
      }),
    }),
    AppointmentsModule,
    NotesModule,
    ObjectivesCategoriesModule,
    ObjectivesModule,
    CountsModule,
    PagarModule,
    CategoriasFinanceirasModule,
    LancamentosModule,
    ContasBancariasModule,
    ReceberModule,
    FinanceiroModule,
    PerfilFinanceiroModule,
    LembretesModule,
    TarefasModule,
    MetasSemanaisModule,
    ComprasModule,
    PesoModule,
    AniversariosModule,
    NotificacoesModule,
    DashboardModule,
    CielModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Toda rota exige X-API-Key (exceto @Public) e toda resposta sai com ids/dinheiro padronizados
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_INTERCEPTOR, useClass: NormalizarRespostaInterceptor },
  ],
})
export class AppModule {}
