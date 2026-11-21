import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API_KEY_TESTE, criarAppEmMemoria } from './helpers/app-memoria';
import { fimDoMes, hoje, inicioDoMes, mesAnterior, mesAtual, somarDias } from '../src/@core/domain/shared/date.helper';

function cliente(app: INestApplication) {
  const k = (r: request.Test) => r.set('X-API-Key', API_KEY_TESTE);
  const http = () => request(app.getHttpServer());
  return {
    get: (u: string) => k(http().get(u)),
    post: (u: string, b: object = {}) => k(http().post(u)).send(b),
    put: (u: string, b: object = {}) => k(http().put(u)).send(b),
    patch: (u: string, b: object = {}) => k(http().patch(u)).send(b),
    del: (u: string) => k(http().delete(u)),
  };
}

describe('Financeiro completo: receber, saldo e evolução', () => {
  let app: INestApplication;
  let api: ReturnType<typeof cliente>;
  let cat: Record<string, number>;
  const mes = mesAtual();

  beforeAll(async () => {
    ({ app } = await criarAppEmMemoria());
    api = cliente(app);
    const todas = (await api.get('/categorias-financeiras?limit=200')).body as Array<{ id: number; nome: string }>;
    cat = Object.fromEntries(todas.map((c) => [c.nome, c.id]));
  });
  afterAll(() => app.close());

  it('contas a receber: status calculado (Pendente, Atrasada, Recebida) e validações', async () => {
    const futura = await api.post('/receber', { descricao: 'Salário', valor: 3000, data_vencimento: somarDias(hoje(), 5), id_categoria: cat['Salário'] }).expect(201);
    expect(futura.body).toMatchObject({ status: 'Pendente', valor: 3000, data_recebimento: null });
    expect(typeof futura.body.id).toBe('number');

    const vencida = await api.post('/receber', { descricao: 'Freela', valor: 800, data_vencimento: somarDias(hoje(), -3) }).expect(201);
    expect(vencida.body.status).toBe('Atrasada');

    const parcial = await api.patch(`/receber/${vencida.body.id}`, { valor_recebido: 300 }).expect(200);
    expect(parcial.body.status).toBe('Atrasada'); // parcial continua em aberto
    const total = await api.patch(`/receber/${vencida.body.id}`, { valor_recebido: 800 }).expect(200);
    expect(total.body).toMatchObject({ status: 'Recebida', data_recebimento: hoje(), valor_recebido: 800 });

    await api.post('/receber', { descricao: 'x', valor: 0, data_vencimento: hoje() }).expect(400);
    await api.post('/receber', { descricao: 'x', valor: 10, data_vencimento: '2026-02-31' }).expect(400);
    await api.post('/receber', { descricao: 'x', valor: 10, data_vencimento: hoje(), id_categoria: 9999 }).expect(404);
    await api.get('/receber/9999').expect(404);

    expect((await api.get('/receber?status=Pendente').expect(200)).body).toHaveLength(1);
    expect((await api.get('/receber?limit=1').expect(200)).body).toHaveLength(1);
  });

  it('gera cobranças mensais mantendo o dia (31/01 -> 28/02)', async () => {
    const res = await api.post('/receber/gerar', { descricao: 'Aluguel', valor: 1200, primeiro_vencimento: '2099-01-31', qtde: 3 }).expect(201);
    expect(res.body.map((r: any) => r.data_vencimento)).toEqual(['2099-01-31', '2099-02-28', '2099-03-31']);
    expect(res.body[0].descricao).toBe('Aluguel - 1/3');
    await api.post('/receber/gerar', { descricao: 'x', valor: 1, primeiro_vencimento: '2099-01-01', qtde: 99 }).expect(400);
  });

  it('o que foi recebido entra nas entradas do mês e em por_categoria', async () => {
    const { body } = await api.get(`/financeiro/resumo?mes=${mes}`).expect(200);
    expect(body.entradas).toBe(800);
    expect(body.detalhe_entradas).toEqual({ lancamentos: 0, recebimentos: 800 });
    expect(body.por_categoria).toEqual(expect.arrayContaining([expect.objectContaining({ categoria: 'Contas a receber', tipo: 'receita', total: 800 })]));
    expect(body.a_receber.Recebida).toEqual({ qtd: 1, total: 800 });
  });

  it('saldo acumulado = saldo inicial + entradas - saídas, sem contar datas futuras', async () => {
    await api.put('/perfil-financeiro', { saldo_inicial: 1000 }).expect(200);
    await api.post('/lancamentos', { tipo: 'receita', valor: 500, id_categoria: cat['Extra'] }).expect(201);
    await api.post('/lancamentos', { tipo: 'despesa', valor: 100, id_categoria: cat['Mercado'] }).expect(201);
    await api.post('/lancamentos', { tipo: 'despesa', valor: 999, data: somarDias(hoje(), 1) }).expect(201); // amanhã: fora do saldo de hoje

    const saldo = (await api.get('/financeiro/saldo').expect(200)).body;
    // Sem contas bancárias: tudo cai em "sem conta" e o saldo é o de sempre
    expect(saldo).toEqual({ ate: hoje(), saldo_inicial: 1000, entradas: 1300, saidas: 100, saldo: 2200, contas: [], sem_conta: 1200, patrimonio: 2200 });

    const amanha = (await api.get(`/financeiro/saldo?ate=${somarDias(hoje(), 1)}`).expect(200)).body;
    expect(amanha.saldo).toBe(1201);
    await api.get('/financeiro/saldo?ate=2026-02-31').expect(400);
    expect((await api.get('/perfil-financeiro').expect(200)).body.saldo_inicial).toBe(1000);
  });

  it('evolução devolve os últimos meses em ordem, terminando no mês atual', async () => {
    await api.post('/lancamentos', { tipo: 'despesa', valor: 40, data: `${mesAnterior(mes)}-10` }).expect(201);
    const pontos = (await api.get('/financeiro/evolucao?meses=3').expect(200)).body;
    expect(pontos).toHaveLength(3);
    expect(pontos[2].mes).toBe(mes);
    expect(pontos[1]).toMatchObject({ mes: mesAnterior(mes), saidas: 40, saldo: -40 });
    // o lançamento de 999 (amanhã) conta no mês atual, a menos que amanhã já seja o mês seguinte
    const amanhaNoMes = somarDias(hoje(), 1).slice(0, 7) === mes;
    expect(pontos[2]).toMatchObject({ entradas: 1300, saidas: amanhaNoMes ? 1099 : 100 });
    expect((await api.get('/financeiro/evolucao?meses=abc').expect(200)).body).toHaveLength(6);
  });

  it('o CSV inclui os recebimentos', async () => {
    const res = await api.get(`/financeiro/exportar?start=${inicioDoMes(mes)}&end=${fimDoMes(mes)}&formato=csv`).buffer(true).parse((r, cb) => {
      const partes: Buffer[] = [];
      r.on('data', (p: Buffer) => partes.push(p));
      r.on('end', () => cb(null, Buffer.concat(partes)));
    });
    const linhas = (res.body as Buffer).toString('utf8').split('\r\n');
    expect(linhas.some((l) => l.includes('Freela') && l.includes(';recebimento;') && l.includes('800,00'))).toBe(true);
  });
});
