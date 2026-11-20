import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Op } from 'sequelize';
import { ObjectivesController } from '../src/@core/domain/objectives/controllers/objectives.controller';
import { ObjectivesService } from '../src/@core/domain/objectives/services/objectives.service';
import { ObjectivesCategoriesController } from '../src/@core/domain/objectives_categories/controllers/objectives_categories.controller';
import { ObjectivesCategoriesService } from '../src/@core/domain/objectives_categories/services/objectives_categories.service';
import { CountsController } from '../src/@core/domain/counts/controllers/counts.controller';
import { CountsService } from '../src/@core/domain/counts/services/counts.service';
import { CategoriaContaController } from '../src/@core/domain/counts/controllers/categoria-conta.controller';
import { CategoriaContaService } from '../src/@core/domain/counts/services/categoria-conta.service';
import { PagarController } from '../src/@core/domain/pagar/controller/pagar.controller';
import { PagarService } from '../src/@core/domain/pagar/services/pagar.service';

/**
 * Repositório em memória: imita só o que os services usam dos models do
 * Sequelize (where por igualdade, Op.lt e Op.between). Não toca no banco.
 */
class FakeRepo {
  rows: any[] = [];
  private nextId = 1;

  private wrap(row: any) {
    Object.defineProperty(row, 'get', { value: () => ({ ...row }), enumerable: false, configurable: true });
    return row;
  }

  private match(row: any, where: Record<string, any> = {}) {
    return Object.entries(where).every(([campo, cond]) => {
      if (cond && typeof cond === 'object') {
        if (Op.lt in cond) return row[campo] < cond[Op.lt];
        if (Op.between in cond) return row[campo] >= cond[Op.between][0] && row[campo] <= cond[Op.between][1];
      }
      return String(row[campo]) === String(cond);
    });
  }

  async create(values: any) {
    const row = this.wrap({ id: this.nextId++, ...values });
    this.rows.push(row);
    return row;
  }
  async bulkCreate(values: any[]) {
    return Promise.all(values.map((v) => this.create(v)));
  }
  async findAll(q: any = {}) {
    return this.rows.filter((r) => this.match(r, q.where));
  }
  async findOne(q: any = {}) {
    return this.rows.find((r) => this.match(r, q.where)) ?? null;
  }
  async count(q: any = {}) {
    return (await this.findAll(q)).length;
  }
  async update(values: any, q: any = {}) {
    const alvo = this.rows.filter((r) => this.match(r, q.where));
    alvo.forEach((r) => Object.assign(r, values));
    return [alvo.length] as [number];
  }
  async destroy(q: any = {}) {
    const antes = this.rows.length;
    this.rows = this.rows.filter((r) => !this.match(r, q.where));
    return antes - this.rows.length;
  }
}

describe('Objetivos, Contas e Pagar (HTTP, repositórios em memória)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const repos = {
      OBJECTIVES_REPOSITORY: new FakeRepo(),
      OBJECTIVES_CATEGORIES_REPOSITORY: new FakeRepo(),
      COUNT_REPOSITORY: new FakeRepo(),
      CATEGORIA_CONTA_REPOSITORY: new FakeRepo(),
      PAGAR_REPOSITORY: new FakeRepo(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [
        ObjectivesController,
        ObjectivesCategoriesController,
        CountsController,
        CategoriaContaController,
        PagarController,
      ],
      providers: [
        ObjectivesService,
        ObjectivesCategoriesService,
        CountsService,
        CategoriaContaService,
        PagarService,
        ...Object.entries(repos).map(([provide, useValue]) => ({ provide, useValue })),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    http = request(app.getHttpServer()) as any;
  });

  afterAll(() => app.close());

  describe('Objetivos', () => {
    let categoriaId: number;
    let objetivoId: number;

    it('cria categoria e rejeita título vazio', async () => {
      await http.post('/objectives-categories').send({ titulo: '' }).expect(400);
      const res = await http.post('/objectives-categories').send({ titulo: 'Viagem' }).expect(201);
      categoriaId = res.body.id;
    });

    it('cria objetivo no formato que o front envia (strings) e calcula a porcentagem', async () => {
      const res = await http
        .post('/objectives')
        .send({
          titulo: 'Europa',
          valor_guardado: '2500',
          valor_objetivo: '10000',
          checked: 'false',
          prioridade: 'alta',
          id_categoria: String(categoriaId),
        })
        .expect(201);
      objetivoId = res.body.id;
      expect(res.body.porcentagem).toBe(25);
      expect(res.body.checked).toBe(false);
    });

    it('recalcula a porcentagem ao atualizar o valor guardado e limita em 100', async () => {
      const res = await http.patch(`/objectives/${objetivoId}`).send({ valor_guardado: 20000 }).expect(200);
      expect(res.body.porcentagem).toBe(100);
    });

    it('marca como concluído com checked "true"', async () => {
      const res = await http.patch(`/objectives/${objetivoId}`).send({ checked: 'true' }).expect(200);
      expect(res.body.checked).toBe(true);
    });

    it('valida categoria inexistente (404) e dados inválidos (400)', async () => {
      await http.post('/objectives').send({ titulo: 'X', prioridade: 'baixa', id_categoria: 999 }).expect(404);
      await http.post('/objectives').send({ titulo: 'X', valor_guardado: '1.234', id_categoria: categoriaId }).expect(400);
      await http.post('/objectives').send({ prioridade: 'baixa', id_categoria: categoriaId }).expect(400);
    });

    it('filtra por checked', async () => {
      const abertos = await http.get('/objectives?checked=false').expect(200);
      expect(abertos.body).toHaveLength(0);
      const feitos = await http.get('/objectives?checked=true').expect(200);
      expect(feitos.body).toHaveLength(1);
    });

    it('não apaga categoria com objetivos (409), apaga depois do objetivo', async () => {
      await http.delete(`/objectives-categories/${categoriaId}`).expect(409);
      await http.delete(`/objectives/${objetivoId}`).expect(200);
      await http.delete(`/objectives/${objetivoId}`).expect(404);
      await http.delete(`/objectives-categories/${categoriaId}`).expect(200);
    });
  });

  describe('Contas e Pagar', () => {
    let categoriaId: number;
    let luzId: number;
    let tvId: number;
    let netflixId: number;

    it('cria categoria de conta e conta, validando tipo e categoria', async () => {
      categoriaId = (await http.post('/categoria-conta').send({ nome: 'Casa' }).expect(201)).body.id;

      await http.post('/counts').send({ nome: 'Luz', tipo: 'Inexistente' }).expect(400);
      await http.post('/counts').send({ nome: 'Luz', tipo: 'Conta', valor_esperado: 10.123 }).expect(400);
      await http.post('/counts').send({ nome: 'Luz', tipo: 'Conta', id_categoria_conta: 999 }).expect(404);

      luzId = (
        await http
          .post('/counts')
          .send({ nome: 'Luz', tipo: 'Recorrente', valor_esperado: 110, id_categoria_conta: categoriaId })
          .expect(201)
      ).body.id;
      tvId = (
        await http.post('/counts').send({ nome: 'TV', tipo: 'Conta', valor_esperado: 500, qtde_parceladas: 6 }).expect(201)
      ).body.id;
      netflixId = (await http.post('/counts').send({ nome: 'Netflix', tipo: 'Assinatura', valor_esperado: 40 }).expect(201)).body.id;
    });

    it('conta inexistente devolve 404 em vez de 200 vazio', async () => {
      await http.get('/counts/9999').expect(404);
      await http.patch('/counts/9999').send({ nome: 'x' }).expect(404);
      await http.delete('/counts/9999').expect(404);
    });

    it('gera 12 parcelas para Recorrente (31/01 -> 28/02) e usa o valor da conta', async () => {
      const res = await http.post('/pagar/gerar').send({ id_count: luzId, data_primeiro_vencimento: '2099-01-31' }).expect(201);
      expect(res.body).toHaveLength(12);
      expect(res.body[0]).toMatchObject({ numero_parcela: 1, valor_parcela: 110, data_vencimento: '2099-01-31', status: 'Pendente' });
      expect(res.body[1].data_vencimento).toBe('2099-02-28');
      expect(res.body[2].data_vencimento).toBe('2099-03-31');
      expect(res.body[0].descricao).toBe('Luz - parcela 1/12');
    });

    it('gera 6 parcelas para Conta parcelada e 12 para Assinatura', async () => {
      const tv = await http.post('/pagar/gerar').send({ id_count: tvId, data_primeiro_vencimento: '2099-05-10' }).expect(201);
      expect(tv.body).toHaveLength(6);
      const net = await http.post('/pagar/gerar').send({ id_count: netflixId, data_primeiro_vencimento: '2099-05-10' }).expect(201);
      expect(net.body).toHaveLength(12);
    });

    it('não gera de novo (409) nem para conta inexistente (404)', async () => {
      await http.post('/pagar/gerar').send({ id_count: luzId, data_primeiro_vencimento: '2099-01-31' }).expect(409);
      await http.post('/pagar/gerar').send({ id_count: 9999, data_primeiro_vencimento: '2099-01-31' }).expect(404);
    });

    it('pagamento total vira Paga com data de hoje; parcial continua Pendente', async () => {
      const lista = (await http.get(`/pagar?id_count=${luzId}`).expect(200)).body;
      const parcial = await http.patch(`/pagar/${lista[0].id}`).send({ valor_pago: 50 }).expect(200);
      expect(parcial.body.status).toBe('Pendente');

      const total = await http.patch(`/pagar/${lista[0].id}`).send({ valor_pago: 110 }).expect(200);
      expect(total.body.status).toBe('Paga');
      expect(total.body.data_pagamento).toBe(new Date().toISOString().slice(0, 10));
    });

    it('vencimento no passado vira Atrasada e o filtro por status funciona', async () => {
      const criada = await http
        .post('/pagar')
        .send({ id_count: luzId, valor_parcela: 100, data_vencimento: '2020-01-10' })
        .expect(201);
      expect(criada.body.status).toBe('Atrasada');

      const atrasadas = (await http.get('/pagar?status=Atrasada').expect(200)).body;
      expect(atrasadas.map((p: any) => p.id)).toContain(criada.body.id);
      expect((await http.get('/pagar?status=Paga').expect(200)).body).toHaveLength(1);
    });

    it('filtra por intervalo de vencimento', async () => {
      const res = await http.get('/pagar?start=2099-02-01&end=2099-02-28&id_count=' + luzId).expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].data_vencimento).toBe('2099-02-28');
    });

    it('valida os dados da parcela e devolve 404 para id inexistente', async () => {
      await http.post('/pagar').send({ id_count: luzId, valor_parcela: 10 }).expect(400);
      await http.post('/pagar').send({ id_count: 9999, valor_parcela: 10, data_vencimento: '2099-01-01' }).expect(404);
      await http.get('/pagar/9999').expect(404);
      await http.delete('/pagar/9999').expect(404);
    });

    it('não apaga categoria de conta em uso (409)', async () => {
      await http.delete(`/categoria-conta/${categoriaId}`).expect(409);
      await http.delete(`/counts/${luzId}`).expect(200);
      await http.delete(`/categoria-conta/${categoriaId}`).expect(200);
    });
  });
});
