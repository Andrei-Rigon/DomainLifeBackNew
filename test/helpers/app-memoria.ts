import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { FakeRepo } from './fake-repo';

import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { ApiKeyGuard } from '../../src/@core/domain/shared/api-key.guard';
import { NormalizarRespostaInterceptor } from '../../src/@core/domain/shared/normalizar-resposta.interceptor';

import { NotesController } from '../../src/@core/domain/notes/controllers/notes.controller';
import { NotesService } from '../../src/@core/domain/notes/services/notes.service';
import { AppointmentsController } from '../../src/@core/domain/appointments/controllers/appointments.controller';
import { AppointmentsService } from '../../src/@core/domain/appointments/services/appointments.service';
import { ObjectivesController } from '../../src/@core/domain/objectives/controllers/objectives.controller';
import { ObjectivesService } from '../../src/@core/domain/objectives/services/objectives.service';
import { ObjectivesCategoriesController } from '../../src/@core/domain/objectives_categories/controllers/objectives_categories.controller';
import { ObjectivesCategoriesService } from '../../src/@core/domain/objectives_categories/services/objectives_categories.service';
import { CountsController } from '../../src/@core/domain/counts/controllers/counts.controller';
import { CountsService } from '../../src/@core/domain/counts/services/counts.service';
import { CategoriaContaController } from '../../src/@core/domain/counts/controllers/categoria-conta.controller';
import { CategoriaContaService } from '../../src/@core/domain/counts/services/categoria-conta.service';
import { PagarController } from '../../src/@core/domain/pagar/controller/pagar.controller';
import { PagarService } from '../../src/@core/domain/pagar/services/pagar.service';
import { CategoriasFinanceirasController } from '../../src/@core/domain/categorias-financeiras/controllers/categorias-financeiras.controller';
import { CategoriasFinanceirasService } from '../../src/@core/domain/categorias-financeiras/services/categorias-financeiras.service';
import { LancamentosController } from '../../src/@core/domain/lancamentos/controllers/lancamentos.controller';
import { LancamentosService } from '../../src/@core/domain/lancamentos/services/lancamentos.service';
import { FinanceiroController } from '../../src/@core/domain/financeiro/controllers/financeiro.controller';
import { FinanceiroService } from '../../src/@core/domain/financeiro/services/financeiro.service';
import { PerfilFinanceiroController } from '../../src/@core/domain/perfil-financeiro/controllers/perfil-financeiro.controller';
import { PerfilFinanceiroService } from '../../src/@core/domain/perfil-financeiro/services/perfil-financeiro.service';
import { LembretesController } from '../../src/@core/domain/lembretes/controllers/lembretes.controller';
import { LembretesService } from '../../src/@core/domain/lembretes/services/lembretes.service';
import { TarefasController } from '../../src/@core/domain/tarefas/controllers/tarefas.controller';
import { TarefasService } from '../../src/@core/domain/tarefas/services/tarefas.service';
import { MetasSemanaisController } from '../../src/@core/domain/metas-semanais/controllers/metas-semanais.controller';
import { MetasSemanaisService } from '../../src/@core/domain/metas-semanais/services/metas-semanais.service';
import { ComprasController } from '../../src/@core/domain/compras/controllers/compras.controller';
import { ComprasService } from '../../src/@core/domain/compras/services/compras.service';
import { PesoController } from '../../src/@core/domain/peso/controllers/peso.controller';
import { PesoService } from '../../src/@core/domain/peso/services/peso.service';
import { AniversariosController } from '../../src/@core/domain/aniversarios/controllers/aniversarios.controller';
import { AniversariosService } from '../../src/@core/domain/aniversarios/services/aniversarios.service';
import { NotificacoesController } from '../../src/@core/domain/notificacoes/controllers/notificacoes.controller';
import { NotificacoesService } from '../../src/@core/domain/notificacoes/services/notificacoes.service';
import { DashboardController } from '../../src/@core/domain/dashboard/controllers/dashboard.controller';
import { DashboardService } from '../../src/@core/domain/dashboard/services/dashboard.service';
import { ReceberController } from '../../src/@core/domain/receber/controllers/receber.controller';
import { ReceberService } from '../../src/@core/domain/receber/services/receber.service';
import { CielController } from '../../src/@core/domain/ciel/controllers/ciel.controller';
import { CielService } from '../../src/@core/domain/ciel/services/ciel.service';

export const API_KEY_TESTE = 'chave-de-teste-123';

const TOKENS = [
  'NOTES_REPOSITORY',
  'APPOINTMENT_REPOSITORY',
  'AVISO_AGENDAMENTO_REPOSITORY',
  'OBJECTIVES_REPOSITORY',
  'OBJECTIVES_CATEGORIES_REPOSITORY',
  'COUNT_REPOSITORY',
  'CATEGORIA_CONTA_REPOSITORY',
  'PAGAR_REPOSITORY',
  'CATEGORIAS_FINANCEIRAS_REPOSITORY',
  'LANCAMENTOS_REPOSITORY',
  'PERFIL_FINANCEIRO_REPOSITORY',
  'LEMBRETES_REPOSITORY',
  'TAREFAS_REPOSITORY',
  'METAS_SEMANAIS_REPOSITORY',
  'COMPRAS_REPOSITORY',
  'PESO_REPOSITORY',
  'ANIVERSARIOS_REPOSITORY',
  'RECEBER_REPOSITORY',
];

/**
 * Sobe a API inteira (controllers, services, guard de token, interceptor de
 * resposta e ValidationPipe) com repositórios em memória no lugar do banco.
 */
export async function criarAppEmMemoria(): Promise<{ app: INestApplication; repos: Record<string, FakeRepo> }> {
  const repos = Object.fromEntries(TOKENS.map((t) => [t, new FakeRepo()]));

  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ API_KEY: API_KEY_TESTE })] })],
    controllers: [
      AppController,
      NotesController,
      AppointmentsController,
      ObjectivesController,
      ObjectivesCategoriesController,
      CountsController,
      CategoriaContaController,
      PagarController,
      CategoriasFinanceirasController,
      LancamentosController,
      FinanceiroController,
      PerfilFinanceiroController,
      LembretesController,
      TarefasController,
      MetasSemanaisController,
      ComprasController,
      PesoController,
      AniversariosController,
      NotificacoesController,
      DashboardController,
      CielController,
      ReceberController,
    ],
    providers: [
      AppService,
      NotesService,
      AppointmentsService,
      ObjectivesService,
      ObjectivesCategoriesService,
      CountsService,
      CategoriaContaService,
      PagarService,
      CategoriasFinanceirasService,
      LancamentosService,
      FinanceiroService,
      PerfilFinanceiroService,
      LembretesService,
      TarefasService,
      MetasSemanaisService,
      ComprasService,
      PesoService,
      AniversariosService,
      NotificacoesService,
      DashboardService,
      CielService,
      ReceberService,
      { provide: APP_GUARD, useClass: ApiKeyGuard },
      { provide: APP_INTERCEPTOR, useClass: NormalizarRespostaInterceptor },
      ...Object.entries(repos).map(([provide, useValue]) => ({ provide, useValue })),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init(); // também roda o seed das categorias (onApplicationBootstrap)
  return { app, repos };
}
