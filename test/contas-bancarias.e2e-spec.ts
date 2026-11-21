import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API_KEY_TESTE, criarAppEmMemoria } from './helpers/app-memoria';

function cliente(app: INestApplication) {
  const k = (r: request.Test) => r.set('X-API-Key', API_KEY_TESTE);
  const http = () => request(app.getHttpServer());
  return {
    get: (u: string) => k(http().get(u)),
    post: (u: string, b: object = {}) => k(http().post(u)).send(b),
    patch: (u: string, b: object = {}) => k(http().patch(u)).send(b),
    del: (u: string) => k(http().delete(u)),
  };
}

/**
 * Cenário real de novembro/2026 (conferido com os extratos do Sicoob e do Nubank).
 * Esperado: entradas 3.495,58 / saídas 3.592,17 / saldo do mês -96,59 /
 * Sicoob 0,00 / Nubank 5,59 / saldo acumulado (correntes) 5,59.
 */
describe('Contas bancárias e transferências (novembro/2026)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof cliente>;
  const ids: Record<string, number> = {};

  beforeAll(async () => {
    ({ app } = await criarAppEmMemoria());
    api = cliente(app);
    for (const [nome, tipo, saldo_inicial] of [
      ['Sicoob', 'corrente', 0],
      ['Nubank', 'corrente', 21.55],
      ['Investimentos', 'investimento', 1000],
    ] as const) {
      ids[nome] = (await api.post('/contas-bancarias', { nome, tipo, saldo_inicial }).expect(201)).body.id;
    }

    const lanc = (tipo: string, valor: number, data: string, conta: string, extra: object = {}) =>
      api.post('/lancamentos', { tipo, valor, data, descricao: `${tipo} ${valor}`, id_conta_bancaria: ids[conta], ...extra }).expect(201);

    // ---- Sicoob: receitas 3.495,58
    await lanc('receita', 3318.98, '2026-11-01', 'Sicoob');
    await lanc('receita', 170, '2026-11-10', 'Sicoob');
    await lanc('receita', 6.6, '2026-11-19', 'Sicoob');
    // ---- Sicoob: despesas 1.388,82
    for (const [v, d] of [
      [8.4, '05'], [10.92, '06'], [30, '09'], [103, '09'], [40, '10'], [17.94, '12'], [8.3, '14'], [0.5, '18'],
      [95, '20'], [500, '20'], [179.08, '20'], [48.48, '20'], [112, '20'], [235.2, '20'],
    ] as const) {
      await lanc('despesa', v, `2026-11-${d}`, 'Sicoob');
    }
    // Contas não contabilizadas (no cartão / pagas por outros lançamentos): não mexem em nada
    for (const v of [118.4, 9.99, 23.9, 650]) await lanc('despesa', v, '2026-11-20', 'Sicoob', { contabilizar: false });

    // ---- Nubank: despesas 2.203,35
    for (const [v, d] of [[1832.19, '04'], [0.01, '06'], [300, '20'], [21.65, '16'], [49.5, '19']] as const) {
      await lanc('despesa', v, `2026-11-${d}`, 'Nubank');
    }

    // ---- Transferências (fora do resultado)
    const transf = (valor: number, data: string, de: string, para: string) =>
      lanc('transferencia', valor, data, de, { id_conta_destino: ids[para] });
    await transf(2000, '2026-11-04', 'Sicoob', 'Nubank');
    await transf(500, '2026-11-12', 'Investimentos', 'Nubank');
    await transf(106.76, '2026-11-20', 'Sicoob', 'Nubank');
    await transf(422.03, '2026-11-20', 'Nubank', 'Investimentos');
    await transf(2.66, '2026-11-20', 'Investimentos', 'Nubank');
  });
  afterAll(() => app.close());

  it('resumo do mês ignora transferências', async () => {
    const r = (await api.get('/financeiro/resumo?mes=2026-11').expect(200)).body;
    expect(r.entradas).toBe(3495.58);
    expect(r.saidas).toBe(3592.17);
    expect(r.saldo).toBe(-96.59);
    expect(r.por_categoria.some((c: any) => c.tipo === 'transferencia')).toBe(false);
  });

  it('saldo por conta bate com os extratos', async () => {
    const s = (await api.get('/financeiro/saldo?ate=2026-11-30').expect(200)).body;
    const conta = (nome: string) => s.contas.find((c: any) => c.nome === nome);
    expect(conta('Sicoob').saldo).toBe(0);
    expect(conta('Nubank').saldo).toBe(5.59);
    expect(conta('Investimentos').saldo).toBe(919.37); // 1000 - 500 + 422,03 - 2,66
    expect(s.sem_conta).toBe(0);
    expect(s.saldo).toBe(5.59); // disponível = correntes
    expect(s.saldo_inicial).toBe(21.55); // perfil (0) + iniciais das correntes
    expect(s.patrimonio).toBe(924.96);
  });

  it('valida transferência', async () => {
    const base = { tipo: 'transferencia', valor: 10, data: '2026-11-21' };
    await api.post('/lancamentos', { ...base, id_conta_bancaria: ids.Sicoob }).expect(400); // sem destino
    await api.post('/lancamentos', { ...base, id_conta_bancaria: ids.Sicoob, id_conta_destino: ids.Sicoob }).expect(400);
    await api.post('/lancamentos', { ...base, id_conta_bancaria: ids.Sicoob, id_conta_destino: 9999 }).expect(404);
    // Despesa nunca guarda destino
    const d = await api.post('/lancamentos', { tipo: 'despesa', valor: 1, data: '2026-12-01', id_conta_destino: ids.Nubank }).expect(201);
    expect(d.body.id_conta_destino).toBeNull();
    await api.del(`/lancamentos/${d.body.id}`).expect(200);
  });

  it('sem nenhuma conta, o saldo continua como antes (perfil + entradas - saídas)', async () => {
    const { app: app2 } = await criarAppEmMemoria();
    const api2 = cliente(app2);
    await api2.post('/lancamentos', { tipo: 'receita', valor: 100, data: '2026-11-01' }).expect(201);
    await api2.post('/lancamentos', { tipo: 'despesa', valor: 30, data: '2026-11-02' }).expect(201);
    const s = (await api2.get('/financeiro/saldo?ate=2026-11-30').expect(200)).body;
    expect(s.saldo).toBe(70);
    expect(s.contas).toEqual([]);
    await app2.close();
  });

  it('CSV traz as colunas de conta', async () => {
    const res = await api.get('/financeiro/exportar?start=2026-11-01&end=2026-11-30').expect(200);
    const linhas = res.text.replace('﻿', '').trim().split('\r\n');
    expect(linhas[0]).toBe('Data;Tipo;Descrição;Categoria;Valor;Forma de pagamento;Origem;Contabilizado;Conta;Conta destino');
    expect(linhas.some((l) => l.includes(';transferencia;') && l.endsWith(';Sicoob;Nubank'))).toBe(true);
  });
});
