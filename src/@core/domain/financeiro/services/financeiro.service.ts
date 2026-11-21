import { Injectable } from '@nestjs/common';
import { LancamentosService } from '../../lancamentos/services/lancamentos.service';
import { PagarService } from '../../pagar/services/pagar.service';
import { ReceberService } from '../../receber/services/receber.service';
import { CategoriasFinanceirasService } from '../../categorias-financeiras/services/categorias-financeiras.service';
import { PerfilFinanceiroService } from '../../perfil-financeiro/services/perfil-financeiro.service';
import { ContasBancariasService } from '../../contas-bancarias/services/contas-bancarias.service';
import { fimDoMes, hoje, inicioDoMes, mesAnterior, mesAtual } from '../../shared/date.helper';
import { arredondar2, somar } from '../../shared/money';
import { contaNoCaixa } from '../../shared/contabilizar';

const CATEGORIA_PARCELAS = 'Contas (parcelas pagas)';
const CATEGORIA_RECEBIMENTOS = 'Contas a receber';
const SEM_CATEGORIA = 'Sem categoria';
const INICIO_DOS_TEMPOS = '1900-01-01';

export interface SaldoConta {
  id: number;
  nome: string;
  tipo: string; // corrente | investimento | cartao
  ativa: boolean;
  saldo_inicial: number;
  saldo: number;
}

export interface TotaisPeriodo {
  entradas: number;
  saidas: number;
  saldo: number;
  detalhe_entradas: { lancamentos: number; recebimentos: number };
  detalhe_saidas: { lancamentos: number; parcelas_pagas: number };
  por_categoria: Array<{ id_categoria: number | null; categoria: string; tipo: string; total: number }>;
}

/**
 * Regra do "caixa" (o que de fato entrou/saiu):
 *  - ENTRADAS = receitas lançadas + cobranças a receber RECEBIDAS (pela data de recebimento);
 *  - SAÍDAS   = despesas lançadas + parcelas de contas PAGAS (pela data de pagamento).
 * Assim dar baixa numa parcela/cobrança já aparece no saldo, sem lançar duas vezes.
 * Registros com contabilizar = false (ex.: pagos no cartão) ficam fora de tudo isso.
 * Transferências (tipo = transferencia) só movem dinheiro entre contas bancárias:
 * nunca entram em entradas, saídas nem no saldo do mês.
 */
@Injectable()
export class FinanceiroService {
  constructor(
    private readonly lancamentos: LancamentosService,
    private readonly pagar: PagarService,
    private readonly receber: ReceberService,
    private readonly categorias: CategoriasFinanceirasService,
    private readonly perfil: PerfilFinanceiroService,
    private readonly contasBancarias: ContasBancariasService,
  ) {}

  async totais(start: string, end: string, idCategoria?: number): Promise<TotaisPeriodo> {
    // Só o que conta no caixa: contabilizar = false fica fora de entradas, saídas e saldo
    // Transferências também ficam fora: só movem dinheiro entre contas
    const lancs = (await this.lancamentos.doPeriodo(start, end, idCategoria ? { id_categoria: idCategoria } : {}))
      .filter(contaNoCaixa)
      .filter((l) => l.tipo !== 'transferencia');
    // Parcelas de contas não têm categoria financeira: com filtro de categoria ficam de fora
    const parcelas = idCategoria ? [] : (await this.pagar.pagasNoPeriodo(start, end)).filter(contaNoCaixa);
    let recebidas = (await this.receber.recebidasNoPeriodo(start, end)).filter(contaNoCaixa);
    if (idCategoria) recebidas = recebidas.filter((r) => Number(r.id_categoria) === idCategoria);

    const nomes = new Map((await this.categorias.todas()).map((c) => [Number(c.id), c.nome]));
    const receitas = somar(lancs.filter((l) => l.tipo === 'receita').map((l) => l.valor));
    const despesas = somar(lancs.filter((l) => l.tipo === 'despesa').map((l) => l.valor));
    const recebimentos = somar(recebidas.map((r) => r.valor_recebido ?? r.valor));
    const pagas = somar(parcelas.map((p) => p.valor_pago ?? p.valor_parcela));
    const entradas = somar([receitas, recebimentos]);
    const saidas = somar([despesas, pagas]);

    // Total por categoria (despesas e receitas separadas pelo campo `tipo`)
    const porCategoria = new Map<string, { id_categoria: number | null; categoria: string; tipo: string; valores: number[] }>();
    const somarEm = (tipo: string, id: number | null, valor: number, nomePadrao = SEM_CATEGORIA) => {
      const chave = `${tipo}:${id}`;
      const atual = porCategoria.get(chave) ?? {
        id_categoria: id,
        categoria: id === null ? nomePadrao : (nomes.get(id) ?? nomePadrao),
        tipo,
        valores: [],
      };
      atual.valores.push(valor);
      porCategoria.set(chave, atual);
    };
    for (const l of lancs) somarEm(l.tipo, l.id_categoria == null ? null : Number(l.id_categoria), Number(l.valor));
    for (const r of recebidas) {
      somarEm('receita', r.id_categoria == null ? null : Number(r.id_categoria), Number(r.valor_recebido ?? r.valor), CATEGORIA_RECEBIMENTOS);
    }
    if (parcelas.length) {
      porCategoria.set('despesa:parcelas', {
        id_categoria: null,
        categoria: CATEGORIA_PARCELAS,
        tipo: 'despesa',
        valores: parcelas.map((p) => Number(p.valor_pago ?? p.valor_parcela)),
      });
    }

    return {
      entradas,
      saidas,
      saldo: somar([entradas, -saidas]),
      detalhe_entradas: { lancamentos: receitas, recebimentos },
      detalhe_saidas: { lancamentos: despesas, parcelas_pagas: pagas },
      por_categoria: [...porCategoria.values()]
        .map(({ valores, ...resto }) => ({ ...resto, total: somar(valores) }))
        .sort((a, b) => b.total - a.total),
    };
  }

  /** Resumo do mês (YYYY-MM): totais, por categoria, parcelas/cobranças por status e comparação com o mês anterior. */
  async resumo(mes: string = mesAtual()) {
    const atual = await this.totais(inicioDoMes(mes), fimDoMes(mes));
    const mesAnt = mesAnterior(mes);
    const anterior = await this.totais(inicioDoMes(mesAnt), fimDoMes(mesAnt));

    const parcelasDoMes = await this.pagar.findAll({ start: inicioDoMes(mes), end: fimDoMes(mes) });
    const cobrancasDoMes = await this.receber.listarFiltrado({ start: inicioDoMes(mes), end: fimDoMes(mes) });

    const agrupar = <T>(itens: T[], statusPago: string, valorDe: (i: T) => number | string | null | undefined, statusDe: (i: T) => string) => {
      const grupos: Record<string, { qtd: number; total: number }> = {};
      for (const status of [statusPago, 'Pendente', 'Atrasada']) {
        const doStatus = itens.filter((i) => statusDe(i) === status);
        grupos[status] = { qtd: doStatus.length, total: somar(doStatus.map(valorDe)) };
      }
      return grupos;
    };
    const parcelas = agrupar(parcelasDoMes, 'Paga', (p) => (p.status === 'Paga' ? (p.valor_pago ?? p.valor_parcela) : p.valor_parcela), (p) => p.status);
    const a_receber = agrupar(cobrancasDoMes, 'Recebida', (r) => (r.status === 'Recebida' ? (r.valor_recebido ?? r.valor) : r.valor), (r) => r.status);

    const variacao = anterior.saidas > 0 ? arredondar2(((atual.saidas - anterior.saidas) / anterior.saidas) * 100) : null;

    return {
      mes,
      entradas: atual.entradas,
      saidas: atual.saidas,
      saldo: atual.saldo,
      detalhe_entradas: atual.detalhe_entradas,
      detalhe_saidas: atual.detalhe_saidas,
      por_categoria: atual.por_categoria,
      parcelas,
      a_receber,
      comparacao: {
        mes: mesAnt,
        entradas: anterior.entradas,
        saidas: anterior.saidas,
        saldo: anterior.saldo,
        variacao_saidas_pct: variacao, // positivo = gastou mais que no mês anterior
      },
    };
  }

  /**
   * Saldo acumulado até a data (padrão hoje). Lançamentos com data futura ficam de fora.
   *
   * Cada conta bancária: saldo inicial + receitas - despesas + recebimentos - parcelas pagas
   * + transferências que chegaram - transferências que saíram (só o que conta no caixa).
   * O que não tem conta vai para "sem conta" (assim, sem nenhuma conta cadastrada, o
   * resultado é igual ao de antes: saldo inicial do perfil + entradas - saídas).
   *
   *  - saldo (disponível) = saldo inicial do perfil + contas correntes + sem conta
   *  - patrimonio         = saldo + investimentos + cartões
   */
  async saldo(ate: string = hoje()) {
    const perfil: any = await this.perfil.obter();
    const totais = await this.totais(INICIO_DOS_TEMPOS, ate);
    const saldoPerfil = arredondar2(perfil.saldo_inicial ?? 0);

    const contas = await this.contasBancarias.todas();
    const lancs = (await this.lancamentos.doPeriodo(INICIO_DOS_TEMPOS, ate)).filter(contaNoCaixa);
    const parcelas = (await this.pagar.pagasNoPeriodo(INICIO_DOS_TEMPOS, ate)).filter(contaNoCaixa);
    const recebidas = (await this.receber.recebidasNoPeriodo(INICIO_DOS_TEMPOS, ate)).filter(contaNoCaixa);

    // Movimentos por conta ('sem' = sem conta)
    const movimentos = new Map<string, Array<number | string | null>>();
    const mover = (idConta: unknown, valor: number | string | null) => {
      const chave = idConta == null ? 'sem' : String(idConta);
      movimentos.set(chave, [...(movimentos.get(chave) ?? []), valor]);
    };
    for (const l of lancs) {
      const valor = Number(l.valor);
      if (l.tipo === 'transferencia') {
        mover(l.id_conta_bancaria, -valor);
        mover(l.id_conta_destino, valor);
      } else {
        mover(l.id_conta_bancaria, l.tipo === 'receita' ? valor : -valor);
      }
    }
    for (const p of parcelas) mover((p as any).id_conta_bancaria, -Number(p.valor_pago ?? p.valor_parcela));
    for (const r of recebidas) mover((r as any).id_conta_bancaria, Number(r.valor_recebido ?? r.valor));

    const saldoContas: SaldoConta[] = contas.map((c) => {
      const inicial = arredondar2(c.saldo_inicial);
      return {
        id: Number(c.id),
        nome: c.nome,
        tipo: c.tipo,
        ativa: c.ativa !== false,
        saldo_inicial: inicial,
        saldo: somar([inicial, ...(movimentos.get(String(c.id)) ?? [])]),
      };
    });
    const semConta = somar(movimentos.get('sem') ?? []);
    const correntes = saldoContas.filter((c) => c.tipo === 'corrente');
    const saldoDisponivel = somar([saldoPerfil, semConta, ...correntes.map((c) => c.saldo)]);

    return {
      ate,
      // "Inicial" do card: saldo inicial do perfil + saldos iniciais das contas correntes
      saldo_inicial: somar([saldoPerfil, ...correntes.map((c) => c.saldo_inicial)]),
      entradas: totais.entradas,
      saidas: totais.saidas,
      saldo: saldoDisponivel,
      contas: saldoContas,
      sem_conta: semConta,
      patrimonio: somar([saldoDisponivel, ...saldoContas.filter((c) => c.tipo !== 'corrente').map((c) => c.saldo)]),
    };
  }

  /** Entradas, saídas e saldo dos últimos `meses` meses (para o gráfico de evolução). */
  async evolucao(meses = 6, ate: string = mesAtual()) {
    const lista: string[] = [];
    for (let mes = ate, i = 0; i < meses; i++, mes = mesAnterior(mes)) lista.unshift(mes);

    const pontos: Array<{ mes: string; entradas: number; saidas: number; saldo: number }> = [];
    for (const mes of lista) {
      const t = await this.totais(inicioDoMes(mes), fimDoMes(mes));
      pontos.push({ mes, entradas: t.entradas, saidas: t.saidas, saldo: t.saldo });
    }
    return pontos;
  }

  /** CSV (separador `;`, UTF-8 com BOM, valores com vírgula) para abrir direto no Excel. */
  async csv(start: string, end: string): Promise<string> {
    const lancs = await this.lancamentos.doPeriodo(start, end);
    const parcelas = await this.pagar.pagasNoPeriodo(start, end);
    const recebidas = await this.receber.recebidasNoPeriodo(start, end);
    const nomes = new Map((await this.categorias.todas()).map((c) => [Number(c.id), c.nome]));
    const nomeDe = (id: unknown, padrao: string) => (id == null ? padrao : (nomes.get(Number(id)) ?? padrao));
    const contas = new Map((await this.contasBancarias.todas()).map((c) => [Number(c.id), c.nome]));
    const contaDe = (id: unknown) => (id == null ? '' : (contas.get(Number(id)) ?? ''));

    const linhas = [
      ...lancs.map((l) => ({
        data: l.data,
        tipo: l.tipo,
        descricao: l.descricao ?? '',
        categoria: l.tipo === 'transferencia' ? '' : nomeDe(l.id_categoria, SEM_CATEGORIA),
        valor: Number(l.valor),
        forma: l.forma_pagamento ?? '',
        origem: l.origem,
        // Transferência nunca entra nos totais, por isso sai como "Não"
        contabilizar: l.tipo !== 'transferencia' && contaNoCaixa(l),
        conta: contaDe(l.id_conta_bancaria),
        destino: contaDe(l.id_conta_destino),
      })),
      ...parcelas.map((p) => ({
        data: p.data_pagamento as string,
        tipo: 'despesa',
        descricao: p.descricao ?? `Conta ${p.id_count}`,
        categoria: CATEGORIA_PARCELAS,
        valor: Number(p.valor_pago ?? p.valor_parcela),
        forma: '',
        origem: 'parcela',
        contabilizar: contaNoCaixa(p),
        conta: contaDe((p as any).id_conta_bancaria),
        destino: '',
      })),
      ...recebidas.map((r) => ({
        data: r.data_recebimento as string,
        tipo: 'receita',
        descricao: r.descricao,
        categoria: nomeDe(r.id_categoria, CATEGORIA_RECEBIMENTOS),
        valor: Number(r.valor_recebido ?? r.valor),
        forma: '',
        origem: 'recebimento',
        contabilizar: contaNoCaixa(r),
        conta: contaDe((r as any).id_conta_bancaria),
        destino: '',
      })),
    ].sort((a, b) => a.data.localeCompare(b.data));

    // O CSV traz TODAS as linhas (para bater com o extrato), com a coluna "Contabilizado".
    // Quem não é contabilizado não entra nos totais da API; no Excel dá para filtrar por ela.
    const cabecalho = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Forma de pagamento', 'Origem', 'Contabilizado', 'Conta', 'Conta destino'];
    const corpo = linhas.map((l) =>
      [l.data, l.tipo, l.descricao, l.categoria, l.valor.toFixed(2).replace('.', ','), l.forma, l.origem, l.contabilizar ? 'Sim' : 'Não', l.conta, l.destino]
        .map(celulaCsv)
        .join(';'),
    );
    return '﻿' + [cabecalho.join(';'), ...corpo].join('\r\n') + '\r\n';
  }
}

/** Escapa a célula e impede "injeção de fórmula" no Excel (texto começando com = + - @). */
function celulaCsv(valor: unknown): string {
  let texto = String(valor ?? '');
  if (/^[=+\-@]/.test(texto) && !/^-?\d+([.,]\d+)?$/.test(texto)) texto = `'${texto}`;
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}
