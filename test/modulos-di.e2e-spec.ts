import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { AppointmentsModule } from '../src/@core/domain/appointments/module/appointments.module';
import { NotesModule } from '../src/@core/domain/notes/module/notes.module';
import { ObjectivesModule } from '../src/@core/domain/objectives/module/objectives.module';
import { ObjectivesCategoriesModule } from '../src/@core/domain/objectives_categories/module/objectives_categories.module';
import { CountsModule } from '../src/@core/domain/counts/module/counts.module';
import { PagarModule } from '../src/@core/domain/pagar/module/pagar.module';
import { CategoriasFinanceirasModule } from '../src/@core/domain/categorias-financeiras/module/categorias-financeiras.module';
import { LancamentosModule } from '../src/@core/domain/lancamentos/module/lancamentos.module';
import { FinanceiroModule } from '../src/@core/domain/financeiro/module/financeiro.module';
import { PerfilFinanceiroModule } from '../src/@core/domain/perfil-financeiro/module/perfil-financeiro.module';
import { LembretesModule } from '../src/@core/domain/lembretes/module/lembretes.module';
import { TarefasModule } from '../src/@core/domain/tarefas/module/tarefas.module';
import { MetasSemanaisModule } from '../src/@core/domain/metas-semanais/module/metas-semanais.module';
import { ComprasModule } from '../src/@core/domain/compras/module/compras.module';
import { PesoModule } from '../src/@core/domain/peso/module/peso.module';
import { AniversariosModule } from '../src/@core/domain/aniversarios/module/aniversarios.module';
import { NotificacoesModule } from '../src/@core/domain/notificacoes/module/notificacoes.module';
import { DashboardModule } from '../src/@core/domain/dashboard/module/dashboard.module';
import { CielModule } from '../src/@core/domain/ciel/module/ciel.module';
import { ReceberModule } from '../src/@core/domain/receber/module/receber.module';
import { Receber } from '../src/@core/infraestructure/receber/sequelize/receber.model';
import { CielService } from '../src/@core/domain/ciel/services/ciel.service';

import { Appointment } from '../src/@core/infraestructure/appointments/sequelize/appointment.model';
import { AvisoAgendamento } from '../src/@core/infraestructure/appointments/sequelize/aviso-agendamento.model';
import { Notes } from '../src/@core/infraestructure/notes/sequelize/note.model';
import { Objectives } from '../src/@core/infraestructure/objectives/sequelize/objectives.model';
import { ObjectivesCategories } from '../src/@core/infraestructure/objectives/sequelize/categories_objectives.model';
import { Counts } from '../src/@core/infraestructure/counts/sequelize/counts.model';
import { CategoriaConta } from '../src/@core/infraestructure/counts/sequelize/categoria_conta.model';
import { Pagar } from '../src/@core/infraestructure/pagar/sequelize/pagar.model';
import { CategoriaFinanceira } from '../src/@core/infraestructure/categorias-financeiras/sequelize/categoria-financeira.model';
import { Lancamento } from '../src/@core/infraestructure/lancamentos/sequelize/lancamento.model';
import { PerfilFinanceiro } from '../src/@core/infraestructure/perfil-financeiro/sequelize/perfil-financeiro.model';
import { Lembrete } from '../src/@core/infraestructure/lembretes/sequelize/lembrete.model';
import { Tarefa } from '../src/@core/infraestructure/tarefas/sequelize/tarefa.model';
import { MetaSemanal } from '../src/@core/infraestructure/metas-semanais/sequelize/meta-semanal.model';
import { Compra } from '../src/@core/infraestructure/compras/sequelize/compra.model';
import { Peso } from '../src/@core/infraestructure/peso/sequelize/peso.model';
import { Aniversario } from '../src/@core/infraestructure/aniversarios/sequelize/aniversario.model';

const MODELS = [
  Appointment, AvisoAgendamento, Notes, Objectives, ObjectivesCategories, Counts, CategoriaConta, Pagar,
  CategoriaFinanceira, Lancamento, PerfilFinanceiro, Lembrete, Tarefa, MetaSemanal, Compra, Peso, Aniversario, Receber,
];

// Conexão Sequelize que só registra os models (nunca conecta no banco)
const semBanco = new Sequelize({ dialect: 'postgres', logging: false, models: MODELS });

@Global()
@Module({ providers: [{ provide: getConnectionToken(), useValue: semBanco }], exports: [getConnectionToken()] })
class ConexaoSemBancoModule {}

describe('Módulos reais: injeção de dependência e models', () => {
  it('todos os módulos do AppModule se resolvem (imports, exports e providers fecham)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ConexaoSemBancoModule,
        AppointmentsModule,
        NotesModule,
        ObjectivesCategoriesModule,
        ObjectivesModule,
        CountsModule,
        PagarModule,
        CategoriasFinanceirasModule,
        LancamentosModule,
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
        ReceberModule,
      ],
    }).compile();

    expect(moduleRef.get(CielService, { strict: false })).toBeDefined();
    await moduleRef.close();
  });

  it('associações dos models (FK/HasMany) ficam consistentes', () => {
    expect(Object.keys(Appointment.associations)).toContain('avisos');
    expect(Object.keys(Lancamento.associations)).toContain('categoria');
    expect(Object.keys(Pagar.associations)).toContain('conta');
    expect(Object.keys(Objectives.associations)).toContain('categoria');
    expect(Object.keys(Counts.associations)).toContain('categoria');
    expect(Object.keys(Receber.associations)).toContain('categoria');
  });
});
