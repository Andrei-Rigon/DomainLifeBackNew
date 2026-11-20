import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import request from 'supertest';
import { API_KEY_TESTE, criarAppEmMemoria } from './helpers/app-memoria';
import { FakeRepo } from './helpers/fake-repo';
import { ApiKeyGuard } from '../src/@core/domain/shared/api-key.guard';
import { NormalizarRespostaInterceptor } from '../src/@core/domain/shared/normalizar-resposta.interceptor';
import { lerPaginacao } from '../src/@core/domain/shared/pagination';
import { parseValor } from '../src/@core/domain/shared/money';
import {
  dataHoraSP,
  fimDoMes,
  formatarDiaMes,
  hoje,
  inicioDoMes,
  mesAnterior,
  mesAtual,
  nomeDiaSemana,
  nomeMes,
  resolverData,
  segundaDaSemana,
  somarDias,
  somarMeses,
} from '../src/@core/domain/shared/date.helper';

/** Cliente HTTP que já manda o X-API-Key. */
function cliente(app: INestApplication) {
  const http = () => request(app.getHttpServer());
  const k = (r: request.Test) => r.set('X-API-Key', API_KEY_TESTE);
  return {
    cru: http,
    get: (url: string) => k(http().get(url)),
    post: (url: string, corpo: object = {}) => k(http().post(url)).send(corpo),
    put: (url: string, corpo: object = {}) => k(http().put(url)).send(corpo),
    patch: (url: string, corpo: object = {}) => k(http().patch(url)).send(corpo),
    del: (url: string) => k(http().delete(url)),
  };
}

describe('Segurança e helpers', () => {
  let app: INestApplication;
  let api: ReturnType<typeof cliente>;

  beforeAll(async () => {
    ({ app } = await criarAppEmMemoria());
    api = cliente(app);
  });
  afterAll(() => app.close());

  it('GET /health é público', async () => {
    const res = await api.cru().get('/health').expect(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('sem X-API-Key ou com chave errada: 401; com a chave certa: 200', async () => {
    await api.cru().get('/notes').expect(401);
    await api.cru().get('/notes').set('X-API-Key', 'errada').expect(401);
    await api.get('/notes').expect(200);
  });

  it('no /ciel o 401 também vem como { ok:false, mensagem }', async () => {
    const res = await api.cru().post('/ciel/gasto').send({ valor: 10 }).expect(401);
    expect(res.body).toMatchObject({ ok: false });
    expect(typeof res.body.mensagem).toBe('string');
  });

  it('sem API_KEY configurada no servidor, nada passa (falha fechada)', () => {
    const guard = new ApiKeyGuard(new Reflector(), { get: () => undefined } as any);
    const contexto: any = {
      getHandler: () => function () {},
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => ({ headers: { 'x-api-key': 'qualquer' } }) }),
    };
    expect(() => guard.canActivate(contexto)).toThrow(UnauthorizedException);
  });

  it('valores: aceita 50, 50.5, "50,50", "R$ 1.234,56" e rejeita lixo', () => {
    expect(parseValor(50)).toBe(50);
    expect(parseValor('50.5')).toBe(50.5);
    expect(parseValor('50,50')).toBe(50.5);
    expect(parseValor('R$ 1.234,56')).toBe(1234.56);
    expect(parseValor('abc')).toBeNull();
    expect(parseValor('')).toBeNull();
    expect(parseValor(-5)).toBeNull();
  });

  it('datas: hoje/amanha/ontem, DD/MM e YYYY-MM-DD; rejeita data que não existe', () => {
    expect(resolverData(undefined)).toBe(hoje());
    expect(resolverData('hoje')).toBe(hoje());
    expect(resolverData('Amanhã')).toBe(somarDias(hoje(), 1));
    expect(resolverData('ontem')).toBe(somarDias(hoje(), -1));
    expect(resolverData('2026-11-19')).toBe('2026-11-19');
    expect(resolverData('19/11/2026')).toBe('2026-11-19');
    expect(resolverData('2026-02-31')).toBeNull();
    expect(resolverData('quando der')).toBeNull();
  });

  it('fuso: "hoje" tem formato YYYY-MM-DD e data+hora sem fuso vira horário de São Paulo', () => {
    expect(hoje()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dataHoraSP('2026-11-19T08:00')?.toISOString()).toBe('2026-11-19T11:00:00.000Z');
    expect(somarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(segundaDaSemana('2026-11-18')).toBe('2026-11-16'); // quarta -> segunda
  });

  it('paginação: padrão 50, máximo 200, valores ruins viram o padrão', () => {
    expect(lerPaginacao()).toEqual({ limit: 50, offset: 0 });
    expect(lerPaginacao('999', '10')).toEqual({ limit: 200, offset: 10 });
    expect(lerPaginacao('x', '-3')).toEqual({ limit: 50, offset: 0 });
  });

  it('interceptor: ids viram número e dinheiro vira número com 2 casas', async () => {
    const dados = { id: '5', id_categoria: '2', valor: '50.005', nome: 'x', itens: [{ valor_parcela: '10.5', id_count: '9' }] };
    const saida: any = await lastValueFrom(
      new NormalizarRespostaInterceptor().intercept({} as any, { handle: () => of(dados) } as any),
    );
    expect(saida).toEqual({ id: 5, id_categoria: 2, valor: 50.01, nome: 'x', itens: [{ valor_parcela: 10.5, id_count: 9 }] });
  });
});

describe('Financeiro: categorias, lançamentos e paginação', () => {
  let app: INestApplication;
  let api: ReturnType<typeof cliente>;

  beforeAll(async () => {
    ({ app } = await criarAppEmMemoria());
    api = cliente(app);
  });
  afterAll(() => app.close());

  it('cria as categorias iniciais e devolve ids como número', async () => {
    const res = await api.get('/categorias-financeiras?limit=200').expect(200);
    const nomes = res.body.map((c: any) => c.nome);
    expect(nomes).toEqual(expect.arrayContaining(['Mercado', 'Combustível', 'Salário', 'Extra', 'Outros']));
    expect(typeof res.body[0].id).toBe('number');
  });

  it('nome único sem diferenciar maiúsculas/acentos (409)', async () => {
    await api.post('/categorias-financeiras', { nome: 'SALARIO' }).expect(409);
    await api.post('/categorias-financeiras', { nome: ' mercado ' }).expect(409);
    await api.post('/categorias-financeiras', { nome: 'Pets', tipo: 'despesa', cor: '#fff' }).expect(201);
    await api.post('/categorias-financeiras', { nome: 'X', tipo: 'invalido' }).expect(400);
  });

  it('valida o lançamento e usa hoje como data padrão', async () => {
    const mercado = (await api.get('/categorias-financeiras').expect(200)).body.find((c: any) => c.nome === 'Mercado');

    await api.post('/lancamentos', { tipo: 'despesa', valor: 0 }).expect(400);
    await api.post('/lancamentos', { tipo: 'outro', valor: 10 }).expect(400);
    await api.post('/lancamentos', { tipo: 'despesa', valor: 10, id_categoria: 9999 }).expect(404);
    await api.post('/lancamentos', { tipo: 'despesa', valor: 10, forma_pagamento: 'cheque' }).expect(400);
    await api.post('/lancamentos', { tipo: 'despesa', valor: 10, data: '2026-02-31' }).expect(400);

    const criado = await api.post('/lancamentos', { tipo: 'despesa', valor: '12.5', id_categoria: mercado.id, forma_pagamento: 'pix' }).expect(201);
    expect(criado.body).toMatchObject({ valor: 12.5, data: hoje(), origem: 'manual', id_categoria: mercado.id });

    await api.del(`/categorias-financeiras/${mercado.id}`).expect(409); // tem lançamento
  });

  it('listagens aceitam limit e offset, e filtros', async () => {
    for (let i = 1; i <= 5; i++) await api.post('/tarefas', { titulo: `Tarefa ${i}`, prioridade: i === 1 ? 'alta' : 'baixa' }).expect(201);
    expect((await api.get('/tarefas?limit=2').expect(200)).body).toHaveLength(2);
    expect((await api.get('/tarefas?limit=2&offset=4').expect(200)).body).toHaveLength(1);
    expect((await api.get('/tarefas?limit=abc').expect(200)).body).toHaveLength(5);
    expect((await api.get('/tarefas?prioridade=alta').expect(200)).body).toHaveLength(1);
    await api.post('/tarefas', { titulo: 'x', status: 'parado' }).expect(400);
    await api.get('/tarefas/9999').expect(404);
  });

  it('metas semanais guardam sempre a segunda-feira', async () => {
    const res = await api.post('/metas-semanais', { titulo: 'Treinar 3x', semana: '2026-11-18' }).expect(201);
    expect(res.body.semana).toBe('2026-11-16');
    const padrao = await api.post('/metas-semanais', { titulo: 'Ler' }).expect(201);
    expect(padrao.body.semana).toBe(segundaDaSemana(hoje()));
  });
});

describe('Resumo do mês, CSV e /ciel financeiro', () => {
  let app: INestApplication;
  let api: ReturnType<typeof cliente>;
  const mes = mesAtual();

  beforeAll(async () => {
    ({ app } = await criarAppEmMemoria());
    api = cliente(app);
  });
  afterAll(() => app.close());

  it('/ciel/gasto cria categoria nova e a segunda vez reaproveita', async () => {
    const nova = await api.post('/ciel/gasto', { valor: '50,50', categoria: 'Padaria', descricao: 'pão' }).expect(201);
    expect(nova.body).toMatchObject({ ok: true, mensagem: 'Lancei R$ 50,50 em Padaria hoje.' });
    expect(nova.body.dados).toMatchObject({ valor: 50.5, categoria: 'Padaria', data: hoje() });

    await api.post('/ciel/gasto', { valor: 10, categoria: 'padaria' }).expect(201);
    const cats = (await api.get('/categorias-financeiras?limit=200').expect(200)).body;
    expect(cats.filter((c: any) => c.nome === 'Padaria')).toHaveLength(1);
  });

  it('/ciel/gasto com categoria existente (sem diferenciar maiúsculas/acentos) não duplica e grava origem "ciel"', async () => {
    const res = await api.post('/ciel/gasto', { valor: 50, categoria: 'mercado' }).expect(201);
    expect(res.body.mensagem).toBe('Lancei R$ 50,00 em Mercado hoje.');
    await api.post('/ciel/gasto', { valor: 5, categoria: 'alimentacao FORA' }).expect(201);

    const cats = (await api.get('/categorias-financeiras?limit=200').expect(200)).body;
    expect(cats.filter((c: any) => c.nome === 'Mercado')).toHaveLength(1);
    expect(cats.filter((c: any) => /alimenta/i.test(c.nome))).toHaveLength(1);

    const lancs = (await api.get('/lancamentos?tipo=despesa&limit=200').expect(200)).body;
    expect(lancs.every((l: any) => l.origem === 'ciel')).toBe(true);
  });

  it('/ciel/gasto entende valores e datas variados e avisa o que faltou', async () => {
    const amanha = await api.post('/ciel/gasto', { valor: 12.5, categoria: 'Lazer', data: 'amanha' }).expect(201);
    expect(amanha.body.mensagem).toBe('Lancei R$ 12,50 em Lazer amanhã.');
    expect(amanha.body.dados.data).toBe(somarDias(hoje(), 1));

    const ontem = await api.post('/ciel/gasto', { valor: 'R$ 1.234,56', categoria: 'Lazer', data: 'ontem' }).expect(201);
    expect(ontem.body.mensagem).toBe('Lancei R$ 1.234,56 em Lazer ontem.');

    const fixa = await api.post('/ciel/gasto', { valor: 1, categoria: 'Lazer', data: '2026-11-15' }).expect(201);
    expect(fixa.body.mensagem).toBe('Lancei R$ 1,00 em Lazer no dia 15/11.');

    const semValor = await api.post('/ciel/gasto', { categoria: 'Lazer' }).expect(400);
    expect(semValor.body).toMatchObject({ ok: false });
    expect(semValor.body.mensagem).toMatch(/valor/i);
    expect((await api.post('/ciel/gasto', { valor: 'abc' }).expect(400)).body.ok).toBe(false);
    expect((await api.post('/ciel/gasto', { valor: 5, data: '2026-02-31' }).expect(400)).body.mensagem).toMatch(/data/i);
    expect(JSON.stringify((await api.post('/ciel/gasto', { valor: 'abc' })).body)).not.toMatch(/stack|at /);
  });

  it('prepara os dados do mês para o resumo (Mercado 100, Lazer 100, salário 3000, mês anterior 80, parcelas)', async () => {
    // zera o que os testes acima criaram: usa uma app limpa via novas chamadas isoladas abaixo
    await app.close();
    ({ app } = await criarAppEmMemoria());
    api = cliente(app);

    const receita = await api.post('/ciel/receita', { valor: 3000, categoria: 'salário' }).expect(201);
    expect(receita.body.mensagem).toBe('Registrei R$ 3.000,00 de Salário.');
    await api.post('/ciel/gasto', { valor: '50,50', categoria: 'Mercado' }).expect(201);
    await api.post('/ciel/gasto', { valor: '49,50', categoria: 'Mercado' }).expect(201);
    await api.post('/ciel/gasto', { valor: 100, categoria: 'Lazer' }).expect(201);
    await api.post('/ciel/gasto', { valor: 80, categoria: 'Mercado', data: `${mesAnterior(mes)}-10` }).expect(201);

    const netflix = (await api.post('/counts', { nome: 'Netflix', tipo: 'Assinatura', valor_esperado: 40 }).expect(201)).body;
    const luz = (await api.post('/counts', { nome: 'Luz', tipo: 'Conta', valor_esperado: 100 }).expect(201)).body;
    await api.post('/pagar/gerar', { id_count: netflix.id, data_primeiro_vencimento: hoje() }).expect(201);
    await api.post('/pagar', { id_count: luz.id, valor_parcela: 100, data_vencimento: fimDoMes(mes) }).expect(201);
  });

  it('/ciel/pagar-conta acha a conta pelo nome e paga a parcela em aberto mais antiga', async () => {
    const res = await api.post('/ciel/pagar-conta', { conta: 'netflix' }).expect(201);
    expect(res.body.mensagem).toBe(`Marquei a parcela de ${nomeMes(hoje())} da conta Netflix como paga.`);
    expect(res.body.dados).toMatchObject({ conta: 'Netflix', status: 'Paga', valor_pago: 40 });

    const parcelas = (await api.get('/pagar?id_count=1').expect(200)).body;
    expect(parcelas[0]).toMatchObject({ status: 'Paga', data_pagamento: hoje(), valor_pago: 40 });
    expect(parcelas[1].status).toBe('Pendente');
  });

  it('/ciel/pagar-conta com conta inexistente explica e sugere opções', async () => {
    const res = await api.post('/ciel/pagar-conta', { conta: 'Spotify' }).expect(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.mensagem).toMatch(/Não achei a conta Spotify/);
    expect(res.body.mensagem).toMatch(/Netflix/);
    expect((await api.post('/ciel/pagar-conta', {}).expect(400)).body.mensagem).toMatch(/nome da conta/);
  });

  it('resumo do mês: entradas, saídas (lançamentos + parcelas pagas), saldo, categorias, parcelas e comparação', async () => {
    const { body } = await api.get(`/financeiro/resumo?mes=${mes}`).expect(200);
    expect(body).toMatchObject({
      mes,
      entradas: 3000,
      saidas: 240, // 50,50 + 49,50 + 100 de lançamentos + 40 da parcela da Netflix paga
      saldo: 2760,
      detalhe_saidas: { lancamentos: 200, parcelas_pagas: 40 },
    });
    expect(body.por_categoria).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoria: 'Mercado', tipo: 'despesa', total: 100 }),
        expect.objectContaining({ categoria: 'Salário', tipo: 'receita', total: 3000 }),
        expect.objectContaining({ categoria: 'Contas (parcelas pagas)', total: 40 }),
      ]),
    );
    expect(body.parcelas.Paga).toEqual({ qtd: 1, total: 40 });
    expect(body.parcelas.Pendente).toEqual({ qtd: 1, total: 100 });
    expect(body.comparacao).toMatchObject({ mes: mesAnterior(mes), saidas: 80, variacao_saidas_pct: 200 });
    await api.get('/financeiro/resumo?mes=2026-13').expect(400);
  });

  it('/ciel/quanto-gastei por categoria e por período', async () => {
    const mercado = await api.get('/ciel/quanto-gastei?categoria=mercado&periodo=mes').expect(200);
    expect(mercado.body.mensagem).toBe('Este mês você gastou R$ 100,00 em Mercado.');
    const total = await api.get('/ciel/quanto-gastei').expect(200);
    expect(total.body.dados.total).toBe(240);
    expect((await api.get('/ciel/quanto-gastei?periodo=hoje').expect(200)).body.mensagem).toMatch(/^Hoje você gastou/);
    const erro = await api.get('/ciel/quanto-gastei?categoria=Viagem').expect(404);
    expect(erro.body).toMatchObject({ ok: false });
    expect(erro.body.mensagem).toMatch(/Não achei a categoria Viagem/);
  });

  it('/ciel/resumo-mes fala o resumo e compara com o mês anterior', async () => {
    const { body } = await api.get('/ciel/resumo-mes').expect(200);
    expect(body.ok).toBe(true);
    expect(body.mensagem).toContain('você recebeu R$ 3.000,00, gastou R$ 240,00 e o saldo é R$ 2.760,00');
    expect(body.mensagem).toContain('200% a mais');
    await api.get('/ciel/resumo-mes?mes=novembro').expect(400);
  });

  it('/ciel/contas-a-pagar lista o que vence na semana/mês', async () => {
    const res = await api.get('/ciel/contas-a-pagar?periodo=mes').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.dados.itens.length).toBeLessThanOrEqual(10);
    expect(res.body.mensagem).toMatch(/Luz R\$ 100,00/);
    await api.get('/ciel/contas-a-pagar?periodo=ano').expect(400);
  });

  it('exporta CSV (BOM, separador ";", vírgula decimal) com lançamentos e parcelas pagas', async () => {
    await api.post('/ciel/gasto', { valor: 1, categoria: 'Outros', descricao: '=SOMA(1;2)' }).expect(201);

    const res = await api
      .get(`/financeiro/exportar?start=${inicioDoMes(mes)}&end=${fimDoMes(mes)}&formato=csv`)
      .buffer(true)
      .parse((r, cb) => {
        const partes: Buffer[] = [];
        r.on('data', (p: Buffer) => partes.push(p));
        r.on('end', () => cb(null, Buffer.concat(partes)));
      })
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    const bytes: Buffer = res.body;
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 com BOM
    const linhas = bytes.toString('utf8').replace(/^﻿/, '').split('\r\n').filter(Boolean);
    expect(linhas[0]).toBe('Data;Tipo;Descrição;Categoria;Valor;Forma de pagamento;Origem');
    expect(linhas.some((l) => l.includes(';Mercado;50,50;'))).toBe(true);
    expect(linhas.some((l) => l.includes('Contas (parcelas pagas);40,00;;parcela'))).toBe(true);
    expect(linhas.some((l) => l.includes(`"'=SOMA(1;2)"`))).toBe(true); // sem injeção de fórmula no Excel

    await api.get('/financeiro/exportar?formato=csv').expect(400);
    await api.get(`/financeiro/exportar?start=${inicioDoMes(mes)}&end=${fimDoMes(mes)}&formato=xlsx`).expect(400);
  });
});

describe('Vida pessoal: notificações, lembretes e Ciel', () => {
  let app: INestApplication;
  let api: ReturnType<typeof cliente>;
  let repos: Record<string, FakeRepo>;

  beforeAll(async () => {
    ({ app, repos } = await criarAppEmMemoria());
    api = cliente(app);
  });
  afterAll(() => app.close());

  it('agenda: data_hora_evento vem de data + hora e os avisos são gravados (exatos e atalhos)', async () => {
    const ontem = somarDias(hoje(), -1);
    const criado = await api
      .post('/appointments', { titulo: 'Dentista', data_evento: hoje(), hora_evento: '08:00', avisos: [`${ontem}T08:00`] })
      .expect(201);
    expect(new Date(criado.body.data_hora_evento).toISOString()).toBe(new Date(`${hoje()}T11:00:00.000Z`).toISOString());

    await api.post('/appointments', { titulo: 'Médico', data_evento: somarDias(hoje(), 3), avisar: 'dia_anterior_20h' }).expect(201);
    const avisos = repos['AVISO_AGENDAMENTO_REPOSITORY'].rows;
    expect(avisos).toHaveLength(2);
    expect(new Date(avisos[1].avisar_em).toISOString()).toBe(new Date(`${somarDias(hoje(), 2)}T23:00:00.000Z`).toISOString()); // 20h em SP

    await api.post('/appointments', { titulo: 'x', data_evento: hoje(), avisar: 'nunca' }).expect(400);
    await api.post('/appointments', { titulo: 'x', data_evento: hoje(), avisos: ['ontem'] }).expect(400);
  });

  it('GET /notificacoes/pendentes junta avisos, lembretes, parcelas (hoje/amanhã) e aniversários', async () => {
    await api.post('/lembretes', { texto: 'Ligar para o banco', lembrar_em: `${somarDias(hoje(), -1)}T09:00`, repetir: 'diario' }).expect(201);
    const conta = (await api.post('/counts', { nome: 'Internet', tipo: 'Conta', valor_esperado: 55 }).expect(201)).body;
    await api.post('/pagar', { id_count: conta.id, valor_parcela: 55, data_vencimento: somarDias(hoje(), 1) }).expect(201);
    await api.post('/aniversarios', { nome: 'Ana', data_nascimento: `1990-${hoje().slice(5)}`, telefone: '5511999999999', mensagem: 'Parabéns!' }).expect(201);
    await api.post('/aniversarios', { nome: 'Rui', data_nascimento: '1990-13-40' }).expect(400);

    const { body } = await api.get('/notificacoes/pendentes').expect(200);
    const porTipo = (t: string) => body.itens.filter((i: any) => i.tipo === t);

    expect(body.total).toBe(4);
    expect(porTipo('aviso_agendamento')[0].mensagem).toBe('Dentista hoje às 08:00.');
    expect(porTipo('lembrete')[0].mensagem).toBe('Ligar para o banco');
    expect(porTipo('parcela')[0].mensagem).toBe('Internet vence amanhã: R$ 55,00.');
    expect(porTipo('aniversario')[0]).toMatchObject({ mensagem: 'Hoje é aniversário de Ana.', dados: { telefone: '5511999999999', mensagem_parabens: 'Parabéns!' } });
    expect(typeof body.itens[0].id).toBe('number');
  });

  it('POST /notificacoes/:tipo/:id/enviado tira da lista; lembrete que repete agenda o próximo', async () => {
    const { body } = await api.get('/notificacoes/pendentes').expect(200);
    for (const item of body.itens) await api.post(`/notificacoes/${item.tipo}/${item.id}/enviado`).expect(201);

    expect((await api.get('/notificacoes/pendentes').expect(200)).body.total).toBe(0);

    const lembrete = (await api.get('/lembretes').expect(200)).body[0];
    expect(new Date(lembrete.lembrar_em).getTime()).toBeGreaterThan(Date.now()); // diário: próxima ocorrência no futuro
    expect(lembrete.enviado_em).toBeTruthy();

    await api.post('/notificacoes/foguete/1/enviado').expect(400);
  });

  it('/ciel/compras: adiciona, evita repetido, lista falada e limpa os comprados', async () => {
    for (const item of ['leite', 'pão', 'café']) await api.post('/ciel/compras', { item }).expect(201);
    const repetido = await api.post('/ciel/compras', { item: 'Leite' }).expect(201);
    expect(repetido.body.mensagem).toBe('Leite já está na lista do mercado.');
    expect((await api.post('/ciel/compras', { item: 'tênis', lista: 'online' }).expect(201)).body.mensagem).toBe('Coloquei tênis na lista do online.');

    const lista = await api.get('/ciel/compras?lista=mercado').expect(200);
    expect(lista.body.mensagem).toBe('Na lista do mercado: leite, pão e café.');

    const leite = (await api.get('/compras?lista=mercado').expect(200)).body.find((c: any) => c.item === 'leite');
    const comprado = await api.patch(`/compras/${leite.id}`, { comprado: true }).expect(200);
    expect(comprado.body.comprado_em).toBeTruthy();
    expect((await api.del('/compras/comprados?lista=mercado').expect(200)).body).toEqual({ removidos: 1 });
    expect((await api.get('/ciel/compras?lista=mercado').expect(200)).body.mensagem).toBe('Na lista do mercado: pão e café.');
    await api.post('/ciel/compras', { item: 'x', lista: 'padaria' }).expect(400);
  });

  it('/ciel/peso registra um por dia e compara com a semana passada; resumo do mês', async () => {
    await api.post('/peso', { data: somarDias(hoje(), -7), peso_kg: 79 }).expect(201);
    const res = await api.post('/ciel/peso', { peso_kg: '78,4' }).expect(201);
    expect(res.body.mensagem).toBe('Registrei 78,4 kg. 0,6 kg a menos que semana passada.');
    expect(res.body.dados.variacao_kg).toBe(-0.6);

    await api.post('/ciel/peso', { peso_kg: '78,0' }).expect(201); // mesmo dia: atualiza
    expect((await api.get(`/peso?start=${hoje()}&end=${hoje()}`).expect(200)).body).toHaveLength(1);
    await api.post('/ciel/peso', { peso_kg: 'muito' }).expect(400);

    await api.post('/peso', { data: '2026-01-05', peso_kg: 80 }).expect(201);
    await api.post('/peso', { data: '2026-01-20', peso_kg: 78 }).expect(201);
    const resumo = (await api.get('/peso/resumo?mes=2026-01').expect(200)).body;
    expect(resumo).toMatchObject({ registros: 2, variacao_kg: -2, media_kg: 79, minimo_kg: 78, maximo_kg: 80 });
    expect(resumo.inicial).toEqual({ data: '2026-01-05', peso_kg: 80 });
  });

  it('/ciel/agendar, /ciel/lembrete, /ciel/nota e /ciel/tarefa falam em português', async () => {
    const agendar = await api.post('/ciel/agendar', { titulo: 'Dentista', data: 'amanha', hora: '8h', avisar: 'no dia' }).expect(201);
    expect(agendar.body.mensagem).toBe('Agendei Dentista para amanhã às 08:00. Aviso no dia às 8h.');

    const longe = somarDias(hoje(), 5);
    const comData = await api.post('/ciel/agendar', { titulo: 'Churrasco', data: longe, local: 'Casa do João' }).expect(201);
    expect(comData.body.mensagem).toBe(`Agendei Churrasco para ${nomeDiaSemana(longe)}, ${formatarDiaMes(longe)}.`);
    await api.post('/ciel/agendar', { titulo: 'Sem data' }).expect(400);

    const lembrete = await api.post('/ciel/lembrete', { texto: 'Pagar o IPVA', quando: 'amanha 09:00' }).expect(201);
    expect(lembrete.body.mensagem).toBe('Vou te lembrar amanhã às 09:00.');
    expect((await api.post('/ciel/lembrete', { texto: 'x', quando: 'amanha' }).expect(400)).body.mensagem).toMatch(/hora/);
    expect((await api.post('/ciel/lembrete', { texto: 'x', quando: 'ontem 09:00' }).expect(400)).body.mensagem).toMatch(/passou/);

    const nota = await api.post('/ciel/nota', { titulo: 'Ideia', texto: 'App novo' }).expect(201);
    expect(nota.body.mensagem).toBe('Anotei.');
    expect(repos['NOTES_REPOSITORY'].rows[0]).toMatchObject({ titulo: 'Ideia', descricao: 'App novo' });

    const tarefa = await api.post('/ciel/tarefa', { titulo: 'Renovar CNH', prazo: 'amanha', prioridade: 'urgente' }).expect(201);
    expect(tarefa.body.mensagem).toBe('Criei a tarefa Renovar CNH para amanhã, com prioridade alta.');
  });

  it('/ciel/custo-horas pede o salário e depois calcula horas e dias de trabalho', async () => {
    expect((await api.get('/ciel/custo-horas?valor=300').expect(400)).body.mensagem).toMatch(/salário/);
    await api.put('/perfil-financeiro', { salario_liquido: 4400, dias_trabalhados_mes: 22, horas_por_dia: 8 }).expect(200);

    const res = await api.get('/ciel/custo-horas?valor=300').expect(200);
    expect(res.body.mensagem).toBe('Isso custa 12 horas de trabalho, umas 1,5 dias.');
    expect(res.body.dados).toMatchObject({ horas: 12, dias: 1.5, valor_hora: 25 });
    expect((await api.get('/custo-horas?valor=50,00').expect(200)).body.horas).toBe(2);
    await api.get('/custo-horas').expect(400);
  });

  it('/ciel/hoje e /dashboard resumem o dia, com no máximo 10 itens por bloco', async () => {
    await api.post('/appointments', { titulo: 'Reunião', data_evento: hoje(), hora_evento: '15:00' }).expect(201);
    for (let i = 1; i <= 12; i++) await api.post('/tarefas', { titulo: `Tarefa ${i}`, status: 'em_andamento' }).expect(201);

    const falado = (await api.get('/ciel/hoje').expect(200)).body;
    expect(falado.mensagem).toMatch(/^Hoje é /);
    expect(falado.mensagem).toContain('Reunião às 15:00');

    const { body } = await api.get('/dashboard').expect(200);
    expect(Object.keys(body)).toEqual(
      expect.arrayContaining([
        'agenda_proximos_7_dias',
        'tarefas_em_andamento',
        'lembretes_hoje',
        'financeiro_mes',
        'parcelas_vencendo_7_dias',
        'metas_da_semana',
        'ultimo_peso',
      ]),
    );
    expect(body.tarefas_em_andamento).toHaveLength(10);
    expect(body.ultimo_peso).toMatchObject({ peso_kg: 78 });
    for (const bloco of ['agenda_proximos_7_dias', 'lembretes_hoje', 'parcelas_vencendo_7_dias', 'metas_da_semana']) {
      expect(body[bloco].length).toBeLessThanOrEqual(10);
    }
  });
});
