import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriasFinanceirasService } from '../../categorias-financeiras/services/categorias-financeiras.service';
import { LancamentosService } from '../../lancamentos/services/lancamentos.service';
import { FinanceiroService } from '../../financeiro/services/financeiro.service';
import { CountsService } from '../../counts/services/counts.service';
import { PagarService } from '../../pagar/services/pagar.service';
import { AppointmentsService } from '../../appointments/services/appointments.service';
import { LembretesService } from '../../lembretes/services/lembretes.service';
import { NotesService } from '../../notes/services/notes.service';
import { ComprasService } from '../../compras/services/compras.service';
import { TarefasService } from '../../tarefas/services/tarefas.service';
import { PesoService } from '../../peso/services/peso.service';
import { PerfilFinanceiroService } from '../../perfil-financeiro/services/perfil-financeiro.service';
import {
  combinarDataHora,
  descreverData,
  domingoDaSemana,
  fimDoMes,
  formatarDiaMes,
  hoje,
  inicioDoMes,
  mesAtual,
  mesValido,
  nomeDiaSemana,
  nomeMes,
  resolverData,
  segundaDaSemana,
  somarDias,
} from '../../shared/date.helper';
import { arredondar2, formatarNumero, formatarReais, parseValor, somar } from '../../shared/money';
import { normalizar, procurarNome } from '../../shared/text';

const MAX_ITENS = 10; // listas na resposta: no máximo 10 itens

export interface RespostaCiel {
  mensagem: string;
  dados: Record<string, unknown>;
}

/**
 * Regras para um modelo pequeno que fala com a API a partir de uma frase:
 *  - aceita NOMES (categoria, conta, lista), sem diferenciar maiúsculas/acentos;
 *  - datas opcionais (padrão hoje; "hoje", "amanha", "ontem" ou YYYY-MM-DD);
 *  - valores como 50, 50.5 ou "50,50";
 *  - sempre devolve uma frase curta pronta para ser falada.
 */
@Injectable()
export class CielService {
  constructor(
    private readonly categorias: CategoriasFinanceirasService,
    private readonly lancamentos: LancamentosService,
    private readonly financeiro: FinanceiroService,
    private readonly contas: CountsService,
    private readonly pagar: PagarService,
    private readonly agenda: AppointmentsService,
    private readonly lembretes: LembretesService,
    private readonly notas: NotesService,
    private readonly compras: ComprasService,
    private readonly tarefas: TarefasService,
    private readonly peso: PesoService,
    private readonly perfil: PerfilFinanceiroService,
  ) {}

  // ---------------------------------------------------------------- dinheiro

  async gasto(corpo: Record<string, any>): Promise<RespostaCiel> {
    const valor = this.valor(corpo.valor);
    const data = this.data(corpo.data);
    const nomeCategoria = this.textoOpcional(corpo.categoria) ?? 'Outros';
    const categoria = await this.categorias.obterOuCriar(nomeCategoria, 'despesa'); // inexistente -> cria

    const lancamento = await this.lancamentos.criar({
      tipo: 'despesa',
      valor,
      id_categoria: Number(categoria.id),
      descricao: this.textoOpcional(corpo.descricao),
      data,
      forma_pagamento: this.formaPagamento(corpo.forma_pagamento),
      origem: 'ciel',
    });

    return {
      mensagem: `Lancei ${formatarReais(valor)} em ${categoria.nome} ${this.quando(data)}.`,
      dados: { id: Number(lancamento.id), tipo: 'despesa', valor, categoria: categoria.nome, data },
    };
  }

  async receita(corpo: Record<string, any>): Promise<RespostaCiel> {
    const valor = this.valor(corpo.valor);
    const data = this.data(corpo.data);
    const categoria = await this.categorias.obterOuCriar(this.textoOpcional(corpo.categoria) ?? 'Extra', 'receita');

    const lancamento = await this.lancamentos.criar({
      tipo: 'receita',
      valor,
      id_categoria: Number(categoria.id),
      descricao: this.textoOpcional(corpo.descricao),
      data,
      origem: 'ciel',
    });

    const quando = data === hoje() ? '' : ` ${this.quando(data)}`;
    return {
      mensagem: `Registrei ${formatarReais(valor)} de ${categoria.nome}${quando}.`,
      dados: { id: Number(lancamento.id), tipo: 'receita', valor, categoria: categoria.nome, data },
    };
  }

  async quantoGastei(consulta: Record<string, any>): Promise<RespostaCiel> {
    const periodo = this.periodo(consulta.periodo, ['hoje', 'semana', 'mes'], 'mes');
    const { start, end, rotulo } = this.janela(periodo);

    let idCategoria: number | undefined;
    let nomeCategoria: string | undefined;
    if (this.textoOpcional(consulta.categoria)) {
      const categoria = await this.acharCategoria(String(consulta.categoria));
      idCategoria = Number(categoria.id);
      nomeCategoria = categoria.nome;
    }

    const totais = await this.financeiro.totais(start, end, idCategoria);
    const despesas = totais.por_categoria.filter((c) => c.tipo === 'despesa');
    const principal = despesas[0];

    let mensagem = nomeCategoria
      ? `${rotulo} você gastou ${formatarReais(totais.saidas)} em ${nomeCategoria}.`
      : `${rotulo} você gastou ${formatarReais(totais.saidas)} no total.`;
    if (!nomeCategoria && principal && despesas.length > 1) {
      mensagem += ` O maior gasto foi ${principal.categoria}, ${formatarReais(principal.total)}.`;
    }

    return {
      mensagem,
      dados: {
        periodo,
        start,
        end,
        categoria: nomeCategoria ?? null,
        total: totais.saidas,
        por_categoria: despesas.slice(0, MAX_ITENS),
      },
    };
  }

  async pagarConta(corpo: Record<string, any>): Promise<RespostaCiel> {
    const conta = await this.acharConta(this.texto(corpo.conta, 'o nome da conta'));
    const data = this.data(corpo.data);

    const abertas = await this.pagar.naoPagasDaConta(Number(conta.id));
    if (!abertas.length) {
      throw new NotFoundException(`A conta ${conta.nome} não tem parcelas em aberto. Gere as parcelas no Domain Life.`);
    }

    // Paga a parcela em aberto mais antiga (as atrasadas primeiro)
    const parcela = abertas[0];
    const valor = corpo.valor === undefined || corpo.valor === '' ? Number(parcela.valor_parcela) : this.valor(corpo.valor);
    const atualizada: any = await this.pagar.update(Number(parcela.id), { valor_pago: valor, data_pagamento: data });
    const mes = nomeMes(parcela.data_vencimento);

    const mensagem =
      atualizada.status === 'Paga'
        ? `Marquei a parcela de ${mes} da conta ${conta.nome} como paga.`
        : `Registrei ${formatarReais(valor)} na parcela de ${mes} da conta ${conta.nome}. Ainda faltam ${formatarReais(Number(parcela.valor_parcela) - valor)}.`;

    return {
      mensagem,
      dados: {
        id_parcela: Number(parcela.id),
        conta: conta.nome,
        vencimento: parcela.data_vencimento,
        valor_pago: valor,
        status: atualizada.status,
      },
    };
  }

  async contasAPagar(consulta: Record<string, any>): Promise<RespostaCiel> {
    const periodo = this.periodo(consulta.periodo, ['semana', 'mes'], 'semana');
    const dia = hoje();
    const fim = periodo === 'semana' ? domingoDaSemana(dia) : fimDoMes(dia.slice(0, 7));
    const rotulo = periodo === 'semana' ? 'esta semana' : 'este mês';

    const nomes = new Map((await this.contas.findAll()).map((c) => [Number(c.id), c.nome]));
    const nomeDe = (p: any) => nomes.get(Number(p.id_count)) ?? p.descricao ?? 'Conta';

    const abertas = await this.pagar.naoPagasNoPeriodo(dia, fim);
    const atrasadas = await this.pagar.naoPagasNoPeriodo('2000-01-01', somarDias(dia, -1));

    const itens = abertas.slice(0, MAX_ITENS).map((p) => ({
      id_parcela: Number(p.id),
      conta: nomeDe(p),
      valor: Number(p.valor_parcela),
      vencimento: p.data_vencimento,
    }));

    let mensagem: string;
    if (!abertas.length) {
      mensagem = `Você não tem contas para pagar ${rotulo}.`;
    } else {
      const lista = itens
        .slice(0, 5)
        .map((i) => `${i.conta} ${formatarReais(i.valor)} (dia ${formatarDiaMes(i.vencimento).slice(0, 2)})`)
        .join(', ');
      mensagem = `Você tem ${abertas.length} ${abertas.length === 1 ? 'conta' : 'contas'} para pagar ${rotulo}: ${lista}.`;
    }
    if (atrasadas.length) {
      mensagem += ` Atenção: ${atrasadas.length} ${atrasadas.length === 1 ? 'atrasada' : 'atrasadas'}, somando ${formatarReais(somar(atrasadas.map((p) => p.valor_parcela)))}.`;
    }

    return {
      mensagem,
      dados: { periodo, total_a_pagar: somar(abertas.map((p) => p.valor_parcela)), itens, atrasadas: atrasadas.length },
    };
  }

  // ------------------------------------------------------------ vida pessoal

  async agendar(corpo: Record<string, any>): Promise<RespostaCiel> {
    const titulo = this.texto(corpo.titulo, 'o título do compromisso');
    if (corpo.data === undefined || corpo.data === '') throw new BadRequestException('Faltou a data do compromisso.');
    const data = this.data(corpo.data);
    const hora = corpo.hora === undefined || corpo.hora === '' ? undefined : this.hora(corpo.hora);
    const avisar = this.atalhoAviso(corpo.avisar);

    await this.agenda.create({
      titulo,
      data_evento: data,
      hora_evento: hora,
      localizacao: this.textoOpcional(corpo.local ?? corpo.localizacao),
      avisar,
    } as any);

    let mensagem = `Agendei ${titulo} para ${descreverData(data)}${hora ? ` às ${hora}` : ''}.`;
    if (avisar === 'no_dia_8h') mensagem += ' Aviso no dia às 8h.';
    if (avisar === 'dia_anterior_20h') mensagem += ' Aviso na véspera às 20h.';
    return { mensagem, dados: { titulo, data, hora: hora ?? null, aviso: avisar ?? null } };
  }

  async lembrete(corpo: Record<string, any>): Promise<RespostaCiel> {
    const texto = this.texto(corpo.texto, 'o texto do lembrete');
    const { data, hora } = this.dataHora(corpo.quando);
    if (combinarDataHora(data, hora) <= new Date()) {
      throw new BadRequestException('Esse horário já passou. Diga um horário no futuro.');
    }
    const repetir = this.repeticao(corpo.repetir);

    await this.lembretes.criar({ texto, lembrar_em: `${data}T${hora}`, repetir });

    const repete = { nao: '', diario: ' Repete todo dia.', semanal: ' Repete toda semana.', mensal: ' Repete todo mês.' }[repetir];
    return {
      mensagem: `Vou te lembrar ${descreverData(data)} às ${hora}.${repete}`,
      dados: { texto, quando: `${data}T${hora}`, repetir },
    };
  }

  async nota(corpo: Record<string, any>): Promise<RespostaCiel> {
    const texto = this.texto(corpo.texto, 'o texto da nota');
    const titulo = this.textoOpcional(corpo.titulo) ?? texto.slice(0, 40);
    const nota: any = await this.notas.create({ titulo, descricao: texto } as any);
    return { mensagem: 'Anotei.', dados: { id: Number(nota.id), titulo } };
  }

  async adicionarCompra(corpo: Record<string, any>): Promise<RespostaCiel> {
    const item = this.texto(corpo.item, 'o item');
    const lista = this.lista(corpo.lista) ?? 'mercado';
    const quantidade = this.textoOpcional(corpo.quantidade);

    const naLista = await this.compras.aComprar(lista);
    if (naLista.some((c) => normalizar(c.item) === normalizar(item))) {
      return { mensagem: `${item} já está na lista do ${lista}.`, dados: { item, lista, repetido: true } };
    }

    await this.compras.criar({ item, lista, quantidade });
    return {
      mensagem: `Coloquei ${item}${quantidade ? ` (${quantidade})` : ''} na lista do ${lista}.`,
      dados: { item, lista, quantidade: quantidade ?? null },
    };
  }

  async listarCompras(consulta: Record<string, any>): Promise<RespostaCiel> {
    const lista = this.lista(consulta.lista);
    const listas = lista ? [lista] : ['mercado', 'online'];

    const dados: Record<string, string[]> = {};
    const frases: string[] = [];
    for (const nome of listas) {
      const itens = (await this.compras.aComprar(nome)).map((c) => c.item);
      dados[nome] = itens.slice(0, MAX_ITENS);
      const resto = itens.length > MAX_ITENS ? ` e mais ${itens.length - MAX_ITENS}` : '';
      frases.push(
        itens.length
          ? `Na lista do ${nome}: ${this.listaFalada(itens.slice(0, MAX_ITENS))}${resto}.`
          : `A lista do ${nome} está vazia.`,
      );
    }
    return { mensagem: frases.join(' '), dados };
  }

  async tarefa(corpo: Record<string, any>): Promise<RespostaCiel> {
    const titulo = this.texto(corpo.titulo, 'o título da tarefa');
    const prazo = corpo.prazo === undefined || corpo.prazo === '' ? undefined : this.data(corpo.prazo);
    const prioridade = this.prioridade(corpo.prioridade);

    const tarefa: any = await this.tarefas.criar({ titulo, prazo, prioridade });
    return {
      mensagem: `Criei a tarefa ${titulo}${prazo ? ` para ${descreverData(prazo)}` : ''}${prioridade === 'alta' ? ', com prioridade alta' : ''}.`,
      dados: { id: Number(tarefa.id), titulo, prazo: prazo ?? null, prioridade },
    };
  }

  async registrarPeso(corpo: Record<string, any>): Promise<RespostaCiel> {
    const pesoKg = this.numero(corpo.peso_kg, 'o peso');
    if (pesoKg < 20 || pesoKg > 500) throw new BadRequestException('Esse peso parece errado. Diga algo como 78,4.');
    const data = this.data(corpo.data);

    // Compara com o último registro de 7 dias antes (ou mais antigo)
    const anterior: any = await this.peso.ultimoAte(somarDias(data, -7));
    await this.peso.registrar({ data, peso_kg: pesoKg });

    let mensagem = `Registrei ${formatarNumero(pesoKg, 2)} kg.`;
    let variacao: number | null = null;
    if (anterior) {
      variacao = arredondar2(pesoKg - Number(anterior.peso_kg));
      const referencia = anterior.data >= somarDias(data, -10) ? 'semana passada' : `em ${formatarDiaMes(anterior.data)}`;
      if (variacao === 0) mensagem += ` Mesmo peso de ${referencia}.`;
      else mensagem += ` ${formatarNumero(Math.abs(variacao), 2)} kg a ${variacao < 0 ? 'menos' : 'mais'} que ${referencia}.`;
    }
    return { mensagem, dados: { data, peso_kg: pesoKg, variacao_kg: variacao } };
  }

  async hoje(): Promise<RespostaCiel> {
    const dia = hoje();
    const frases: string[] = [`Hoje é ${nomeDiaSemana(dia)}, ${formatarDiaMes(dia)}.`];

    const compromissos = (await this.agenda.findAll(dia, dia)).slice(0, MAX_ITENS);
    const lembretes = (await this.lembretes.doDia(dia)).slice(0, MAX_ITENS);
    const vencendo = await this.pagar.naoPagasNoPeriodo(dia, dia);
    const atrasadas = await this.pagar.naoPagasNoPeriodo('2000-01-01', somarDias(dia, -1));
    const andamento = await this.tarefas.listar({ status: 'em_andamento' }, { limit: MAX_ITENS, offset: 0 });
    const venceHoje = await this.tarefas.listarFiltrado({ end: dia }, { limit: MAX_ITENS, offset: 0 });
    const tarefas = [...new Map([...andamento, ...venceHoje.filter((t) => t.status !== 'feito')].map((t) => [Number(t.id), t])).values()].slice(0, MAX_ITENS);

    if (compromissos.length) {
      frases.push(
        `Compromissos: ${this.listaFalada(compromissos.map((c) => `${c.titulo}${c.hora_evento ? ` às ${String(c.hora_evento).slice(0, 5)}` : ''}`))}.`,
      );
    }
    if (lembretes.length) frases.push(`Lembretes: ${this.listaFalada(lembretes.map((l) => l.texto))}.`);
    if (vencendo.length) {
      frases.push(`Contas vencendo hoje: ${this.listaFalada(vencendo.map((p) => `${p.descricao ?? 'conta'} ${formatarReais(p.valor_parcela)}`))}.`);
    }
    if (atrasadas.length) frases.push(`Você tem ${atrasadas.length} ${atrasadas.length === 1 ? 'conta atrasada' : 'contas atrasadas'}.`);
    if (tarefas.length) frases.push(`Tarefas: ${this.listaFalada(tarefas.map((t) => t.titulo))}.`);
    if (frases.length === 1) frases.push('Seu dia está livre.');

    return {
      mensagem: frases.join(' '),
      dados: {
        data: dia,
        compromissos: compromissos.map((c) => ({ titulo: c.titulo, hora: c.hora_evento ? String(c.hora_evento).slice(0, 5) : null })),
        lembretes: lembretes.map((l) => l.texto),
        contas_vencendo_hoje: vencendo.length,
        contas_atrasadas: atrasadas.length,
        tarefas: tarefas.map((t) => t.titulo),
      },
    };
  }

  async resumoMes(consulta: Record<string, any>): Promise<RespostaCiel> {
    const mes = this.textoOpcional(consulta.mes) ?? mesAtual();
    if (!mesValido(mes)) throw new BadRequestException('Mês inválido. Use o formato AAAA-MM, por exemplo 2026-11.');

    const r = await this.financeiro.resumo(mes);
    let mensagem = `Em ${nomeMes(mes)} você recebeu ${formatarReais(r.entradas)}, gastou ${formatarReais(r.saidas)} e o saldo é ${formatarReais(r.saldo)}.`;

    const maior = r.por_categoria.find((c) => c.tipo === 'despesa');
    if (maior) mensagem += ` O maior gasto foi ${maior.categoria}, ${formatarReais(maior.total)}.`;

    const variacao = r.comparacao.variacao_saidas_pct;
    if (variacao !== null && variacao !== 0) {
      mensagem += ` Você gastou ${formatarNumero(Math.abs(variacao), 1)}% a ${variacao > 0 ? 'mais' : 'menos'} que em ${nomeMes(r.comparacao.mes)}.`;
    }
    const abertas = r.parcelas.Pendente.qtd + r.parcelas.Atrasada.qtd;
    if (abertas) {
      mensagem += ` Faltam ${abertas} ${abertas === 1 ? 'parcela' : 'parcelas'} do mês${r.parcelas.Atrasada.qtd ? `, ${r.parcelas.Atrasada.qtd} atrasada(s)` : ''}.`;
    }

    return {
      mensagem,
      dados: {
        mes,
        entradas: r.entradas,
        saidas: r.saidas,
        saldo: r.saldo,
        por_categoria: r.por_categoria.slice(0, MAX_ITENS),
        parcelas: r.parcelas,
        variacao_saidas_pct: variacao,
      },
    };
  }

  async custoHoras(consulta: Record<string, any>): Promise<RespostaCiel> {
    const valor = this.valor(consulta.valor);
    const perfil: any = await this.perfil.obter();
    if (!Number(perfil.salario_liquido)) {
      throw new BadRequestException('Ainda não tenho seu salário líquido cadastrado. Cadastre no Domain Life para eu calcular.');
    }

    const c = await this.perfil.custoHoras(valor);
    const dias = c.dias < 1 ? 'menos de um dia' : `umas ${formatarNumero(c.dias, 1)} ${c.dias <= 1.05 ? 'dia' : 'dias'}`;
    return {
      mensagem: `Isso custa ${formatarNumero(c.horas, 1)} ${c.horas === 1 ? 'hora' : 'horas'} de trabalho, ${dias}.`,
      dados: { valor, horas: c.horas, dias: c.dias, valor_hora: c.valor_hora },
    };
  }

  // ----------------------------------------------------------- achar por nome

  /** Categoria por nome; aceita nome parecido só se houver UMA opção clara. */
  private async acharCategoria(nome: string) {
    const todas = await this.categorias.todas();
    const { exato, parecidos } = procurarNome(nome, todas, (c) => c.nome);
    if (exato) return exato;
    if (parecidos.length === 1) return parecidos[0];
    const opcoes = (parecidos.length ? parecidos : todas).slice(0, 5).map((c) => c.nome).join(', ');
    throw new NotFoundException(`Não achei a categoria ${nome}. ${parecidos.length ? 'Parecidas' : 'Categorias que tenho'}: ${opcoes}.`);
  }

  /** Conta por nome, com mensagem clara quando não acha ou há mais de uma opção. */
  private async acharConta(nome: string) {
    const todas = await this.contas.findAll();
    const { exato, parecidos } = procurarNome(nome, todas, (c) => c.nome);
    if (exato) return exato;
    if (parecidos.length === 1) return parecidos[0];
    if (parecidos.length > 1) {
      throw new BadRequestException(`Qual conta? Achei: ${parecidos.slice(0, 5).map((c) => c.nome).join(', ')}.`);
    }
    const opcoes = todas.slice(0, 5).map((c) => c.nome).join(', ');
    throw new NotFoundException(`Não achei a conta ${nome}.${opcoes ? ` Contas que tenho: ${opcoes}.` : ' Ainda não há contas cadastradas.'}`);
  }

  // --------------------------------------------------------------- entradas

  private valor(entrada: unknown): number {
    const valor = parseValor(entrada);
    if (valor === null || valor <= 0) throw new BadRequestException('Não entendi o valor. Diga algo como 50 ou 50,50.');
    return valor;
  }

  private numero(entrada: unknown, campo: string): number {
    const valor = parseValor(entrada);
    if (valor === null || valor <= 0) throw new BadRequestException(`Não entendi ${campo}. Diga algo como 78,4.`);
    return valor;
  }

  private data(entrada: unknown): string {
    const data = resolverData(entrada);
    if (!data) throw new BadRequestException(`Não entendi a data ${entrada}. Diga hoje, amanhã, ontem ou use AAAA-MM-DD.`);
    return data;
  }

  /** "8", "8h", "8h30", "08:00" -> "08:00" */
  private hora(entrada: unknown): string {
    const m = String(entrada).trim().toLowerCase().match(/^(\d{1,2})(?:\s*(?:h|:)\s*(\d{2})?)?$/);
    if (m) {
      const h = Number(m[1]);
      const min = Number(m[2] ?? 0);
      if (h <= 23 && min <= 59) return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
    throw new BadRequestException(`Não entendi a hora ${entrada}. Diga algo como 08:00.`);
  }

  /** "amanha 09:00", "2026-11-19T09:00", "2026-11-19 9h" -> { data, hora } */
  private dataHora(entrada: unknown): { data: string; hora: string } {
    const texto = String(entrada ?? '').trim();
    if (!texto) throw new BadRequestException('Faltou quando devo lembrar. Diga o dia e a hora.');

    const partes = texto.split(/[T\s]+/).filter(Boolean);
    if (partes.length < 2) throw new BadRequestException('Diga também a hora do lembrete, por exemplo amanhã 09:00.');
    const hora = this.hora(partes[partes.length - 1].replace(/(:\d{2})(:\d{2})$/, '$1'));
    const data = this.data(partes.slice(0, -1).join(' '));
    return { data, hora };
  }

  private texto(entrada: unknown, descricao: string): string {
    const texto = this.textoOpcional(entrada);
    if (!texto) throw new BadRequestException(`Faltou ${descricao}.`);
    return texto;
  }

  private textoOpcional(entrada: unknown): string | undefined {
    if (entrada === undefined || entrada === null) return undefined;
    const texto = String(entrada).trim();
    return texto || undefined;
  }

  private formaPagamento(entrada: unknown): string | undefined {
    const t = normalizar(entrada);
    if (!t) return undefined;
    if (t.includes('pix')) return 'pix';
    if (t.includes('debito')) return 'debito';
    if (t.includes('credito') || t.includes('cartao')) return 'credito';
    if (t.includes('dinheiro') || t.includes('especie')) return 'dinheiro';
    return 'outro';
  }

  private lista(entrada: unknown): 'mercado' | 'online' | undefined {
    const t = normalizar(entrada);
    if (!t) return undefined;
    if (['mercado', 'supermercado', 'feira'].includes(t)) return 'mercado';
    if (['online', 'internet', 'site'].includes(t)) return 'online';
    throw new BadRequestException('Lista inválida. Use mercado ou online.');
  }

  private prioridade(entrada: unknown): 'baixa' | 'media' | 'alta' {
    const t = normalizar(entrada);
    if (!t) return 'media';
    if (['alta', 'urgente', 'importante'].includes(t)) return 'alta';
    if (['baixa', 'tranquila'].includes(t)) return 'baixa';
    if (['media', 'normal'].includes(t)) return 'media';
    throw new BadRequestException('Prioridade inválida. Use baixa, média ou alta.');
  }

  private repeticao(entrada: unknown): 'nao' | 'diario' | 'semanal' | 'mensal' {
    const t = normalizar(entrada);
    if (!t || t === 'nao' || t === 'nunca') return 'nao';
    if (['diario', 'diariamente', 'todo dia', 'todos os dias'].includes(t)) return 'diario';
    if (['semanal', 'semanalmente', 'toda semana'].includes(t)) return 'semanal';
    if (['mensal', 'mensalmente', 'todo mes', 'todos os meses'].includes(t)) return 'mensal';
    throw new BadRequestException('Repetição inválida. Use não, diário, semanal ou mensal.');
  }

  private atalhoAviso(entrada: unknown): 'no_dia_8h' | 'dia_anterior_20h' | undefined {
    const t = normalizar(entrada).replace(/_/g, ' ');
    if (!t || t === 'nao') return undefined;
    if (t.startsWith('no dia')) return 'no_dia_8h';
    if (t.startsWith('dia anterior') || t.includes('vespera')) return 'dia_anterior_20h';
    throw new BadRequestException('Aviso inválido. Use no dia às 8h ou dia anterior às 20h.');
  }

  private periodo<T extends string>(entrada: unknown, validos: T[], padrao: T): T {
    const t = normalizar(entrada) || padrao;
    const alias: Record<string, string> = { dia: 'hoje', semanal: 'semana', mensal: 'mes', 'este mes': 'mes', 'esta semana': 'semana' };
    const valor = (alias[t] ?? t) as T;
    if (!validos.includes(valor)) throw new BadRequestException(`Período inválido. Use ${validos.join(', ')}.`);
    return valor;
  }

  // ------------------------------------------------------------ apresentação

  /** hoje | período usado em quanto-gastei */
  private janela(periodo: string) {
    const dia = hoje();
    if (periodo === 'hoje') return { start: dia, end: dia, rotulo: 'Hoje' };
    if (periodo === 'semana') return { start: segundaDaSemana(dia), end: domingoDaSemana(dia), rotulo: 'Esta semana' };
    return { start: inicioDoMes(dia.slice(0, 7)), end: fimDoMes(dia.slice(0, 7)), rotulo: 'Este mês' };
  }

  /** "hoje", "ontem", "amanhã" ou "no dia 19/11" */
  private quando(data: string): string {
    const d = descreverData(data);
    return ['hoje', 'ontem', 'amanhã'].includes(d) ? d : `no dia ${formatarDiaMes(data)}`;
  }

  /** ["leite", "pão", "café"] -> "leite, pão e café" */
  private listaFalada(itens: string[]): string {
    if (itens.length <= 1) return itens.join('');
    return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
  }
}
