import { BadRequestException, Injectable } from '@nestjs/common';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { LembretesService } from '../../lembretes/services/lembretes.service';
import { CountsService } from '../../counts/services/counts.service';
import { PagarService } from '../../pagar/services/pagar.service';
import { AniversariosService } from '../../aniversarios/services/aniversarios.service';
import { dataSP, descreverData, horaSP, hoje, somarDias } from '../../shared/date.helper';
import { formatarReais } from '../../shared/money';
import { Paginacao } from '../../shared/pagination';

export const TIPOS_NOTIFICACAO = ['aviso_agendamento', 'lembrete', 'parcela', 'aniversario'] as const;
export type TipoNotificacao = (typeof TIPOS_NOTIFICACAO)[number];

export interface Notificacao {
  tipo: TipoNotificacao;
  id: number; // id do registro de origem (usado em POST /notificacoes/:tipo/:id/enviado)
  mensagem: string;
  quando: string; // quando deveria ter sido avisado (ISO)
  dados: Record<string, unknown>;
}

/**
 * Junta tudo o que já devia ter sido avisado e ainda não foi. O ENVIO (WhatsApp)
 * não é feito aqui: outra peça lê esta lista e confirma cada item em `.../enviado`.
 */
@Injectable()
export class NotificacoesService {
  constructor(
    private readonly agenda: AppointmentsService,
    private readonly lembretes: LembretesService,
    private readonly pagar: PagarService,
    private readonly aniversarios: AniversariosService,
    private readonly contas: CountsService,
  ) {}

  async pendentes(pagina: Paginacao) {
    const agora = new Date();
    const dia = hoje();
    const itens: Notificacao[] = [];

    for (const { aviso, agendamento } of await this.agenda.avisosPendentes(agora)) {
      const hora = agendamento.hora_evento ? ` às ${String(agendamento.hora_evento).slice(0, 5)}` : '';
      itens.push({
        tipo: 'aviso_agendamento',
        id: Number(aviso.id),
        mensagem: `${agendamento.titulo} ${descreverData(agendamento.data_evento)}${hora}.`,
        quando: new Date(aviso.avisar_em).toISOString(),
        dados: {
          id_appointment: Number(agendamento.id),
          titulo: agendamento.titulo,
          data_evento: agendamento.data_evento,
          hora_evento: agendamento.hora_evento,
          localizacao: agendamento.localizacao,
        },
      });
    }

    for (const lembrete of await this.lembretes.pendentes(agora)) {
      itens.push({
        tipo: 'lembrete',
        id: Number(lembrete.id),
        mensagem: lembrete.texto,
        quando: new Date(lembrete.lembrar_em).toISOString(),
        dados: { texto: lembrete.texto, repetir: lembrete.repetir },
      });
    }

    const nomesContas = new Map((await this.contas.findAll()).map((c) => [Number(c.id), c.nome]));

    // Parcelas que vencem hoje ou amanhã (atrasadas já foram avisadas antes ou aparecem no resumo)
    for (const parcela of await this.pagar.paraAvisar(dia, somarDias(dia, 1))) {
      itens.push({
        tipo: 'parcela',
        id: Number(parcela.id),
        mensagem: `${parcela.descricao ?? nomesContas.get(Number(parcela.id_count)) ?? 'Conta'} vence ${descreverData(parcela.data_vencimento)}: ${formatarReais(parcela.valor_parcela)}.`,
        quando: `${parcela.data_vencimento}T00:00:00-03:00`,
        dados: { id_count: Number(parcela.id_count), valor_parcela: Number(parcela.valor_parcela), data_vencimento: parcela.data_vencimento },
      });
    }

    const ano = Number(dia.slice(0, 4));
    for (const a of await this.aniversarios.doDia(dia)) {
      if (a.ultimo_aviso_ano === ano) continue;
      itens.push({
        tipo: 'aniversario',
        id: Number(a.id),
        mensagem: `Hoje é aniversário de ${a.nome}.`,
        quando: `${dia}T00:00:00-03:00`,
        dados: { nome: a.nome, telefone: a.telefone, mensagem_parabens: a.mensagem },
      });
    }

    itens.sort((a, b) => a.quando.localeCompare(b.quando));
    return {
      gerado_em: `${dataSP(agora)}T${horaSP(agora)}`,
      total: itens.length,
      itens: itens.slice(pagina.offset, pagina.offset + pagina.limit),
    };
  }

  /** Confirma que o aviso foi enviado (some de /pendentes). */
  async marcarEnviado(tipo: string, id: number) {
    switch (tipo) {
      case 'aviso_agendamento':
        return this.agenda.marcarAvisoEnviado(id);
      case 'lembrete':
        await this.lembretes.marcarEnviado(id);
        return { ok: true };
      case 'parcela':
        return this.pagar.marcarNotificada(id);
      case 'aniversario':
        return this.aniversarios.marcarAvisado(id, Number(hoje().slice(0, 4)));
      default:
        throw new BadRequestException(`Tipo inválido. Use: ${TIPOS_NOTIFICACAO.join(', ')}.`);
    }
  }
}
