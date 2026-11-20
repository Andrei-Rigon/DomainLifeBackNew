import { Injectable } from '@nestjs/common';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { TarefasService } from '../../tarefas/services/tarefas.service';
import { LembretesService } from '../../lembretes/services/lembretes.service';
import { FinanceiroService } from '../../financeiro/services/financeiro.service';
import { PagarService } from '../../pagar/services/pagar.service';
import { MetasSemanaisService } from '../../metas-semanais/services/metas-semanais.service';
import { PesoService } from '../../peso/services/peso.service';
import { hoje, mesAtual, somarDias } from '../../shared/date.helper';

const MAX_ITENS = 10; // cada bloco do dashboard devolve no máximo 10 itens

/** Tudo da tela inicial num único JSON. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly agenda: AppointmentsService,
    private readonly tarefas: TarefasService,
    private readonly lembretes: LembretesService,
    private readonly financeiro: FinanceiroService,
    private readonly pagar: PagarService,
    private readonly metas: MetasSemanaisService,
    private readonly peso: PesoService,
  ) {}

  async montar() {
    const dia = hoje();
    const [compromissos, emAndamento, lembretesHoje, resumo, vencendo, metas, ultimoPeso] = await Promise.all([
      this.agenda.findAll(dia, somarDias(dia, 7)),
      this.tarefas.listar({ status: 'em_andamento' }, { limit: MAX_ITENS, offset: 0 }),
      this.lembretes.doDia(dia),
      this.financeiro.resumo(mesAtual()),
      this.pagar.naoPagasNoPeriodo(dia, somarDias(dia, 7)),
      this.metas.daSemanaAtual(),
      this.peso.ultimoAte(dia),
    ]);

    return {
      data: dia,
      agenda_proximos_7_dias: compromissos.slice(0, MAX_ITENS).map((a) => ({
        id: a.id,
        titulo: a.titulo,
        data_evento: a.data_evento,
        hora_evento: a.hora_evento,
        localizacao: a.localizacao,
      })),
      tarefas_em_andamento: emAndamento.slice(0, MAX_ITENS).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        prazo: t.prazo,
        prioridade: t.prioridade,
      })),
      lembretes_hoje: lembretesHoje.slice(0, MAX_ITENS).map((l) => ({ id: l.id, texto: l.texto, lembrar_em: l.lembrar_em, repetir: l.repetir })),
      financeiro_mes: { ...resumo, por_categoria: resumo.por_categoria.slice(0, MAX_ITENS) },
      parcelas_vencendo_7_dias: vencendo.slice(0, MAX_ITENS).map((p) => ({
        id: p.id,
        descricao: p.descricao,
        valor_parcela: p.valor_parcela,
        data_vencimento: p.data_vencimento,
        status: p.status,
      })),
      metas_da_semana: metas.slice(0, MAX_ITENS).map((m) => ({ id: m.id, titulo: m.titulo, concluida: m.concluida })),
      ultimo_peso: ultimoPeso ? { data: ultimoPeso.data, peso_kg: ultimoPeso.peso_kg } : null,
    };
  }
}
