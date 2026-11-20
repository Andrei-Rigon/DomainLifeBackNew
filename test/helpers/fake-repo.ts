import { Op } from 'sequelize';

/**
 * Repositório em memória: imita só o que os services usam dos models do Sequelize
 * (where por igualdade/null, Op.lt/lte/gt/gte/between/in/ne, order, limit, offset).
 * Não toca no banco.
 *
 * Como o `pg` faz com BIGINT, `id` e `id_*` são guardados como TEXTO ("1"):
 * assim os testes pegam qualquer lugar que esqueça de converter para número.
 */
export class FakeRepo {
  rows: any[] = [];
  private nextId = 1;

  private normalizar(valores: Record<string, any>) {
    const saida: Record<string, any> = { ...valores };
    for (const [chave, valor] of Object.entries(saida)) {
      if ((chave === 'id' || chave.startsWith('id_')) && typeof valor === 'number') saida[chave] = String(valor);
    }
    return saida;
  }

  private embrulhar(row: any) {
    // `get({ plain: true })` existe nas instâncias do Sequelize e os services usam
    Object.defineProperty(row, 'get', { value: () => ({ ...row }), enumerable: false, configurable: true });
    return row;
  }

  private bate(row: any, where: Record<string, any> = {}) {
    return Object.entries(where).every(([campo, cond]) => {
      const v = row[campo];
      if (cond === null) return v == null;
      if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
        return Object.getOwnPropertySymbols(cond).every((op) => {
          const alvo = (cond as any)[op];
          if (op === Op.lt) return v != null && v < alvo;
          if (op === Op.lte) return v != null && v <= alvo;
          if (op === Op.gt) return v != null && v > alvo;
          if (op === Op.gte) return v != null && v >= alvo;
          if (op === Op.between) return v != null && v >= alvo[0] && v <= alvo[1];
          if (op === Op.in) return alvo.map(String).includes(String(v));
          if (op === Op.ne) return String(v) !== String(alvo);
          throw new Error(`FakeRepo: operador não suportado em "${campo}"`);
        });
      }
      return String(v) === String(cond);
    });
  }

  private ordenar(lista: any[], order: any[] = []) {
    return [...lista].sort((a, b) => {
      for (const [campo, direcao = 'ASC'] of order) {
        const desc = String(direcao).startsWith('DESC');
        const va = a[campo];
        const vb = b[campo];
        if (va == null && vb == null) continue;
        if (va == null) return desc ? -1 : 1; // nulos por último em ASC
        if (vb == null) return desc ? 1 : -1;
        if (va < vb) return desc ? 1 : -1;
        if (va > vb) return desc ? -1 : 1;
      }
      return 0;
    });
  }

  async create(valores: any) {
    const row = this.embrulhar({ ...this.normalizar(valores), id: String(this.nextId++) });
    this.rows.push(row);
    return row;
  }

  async bulkCreate(lista: any[]) {
    return Promise.all(lista.map((v) => this.create(v)));
  }

  async findAll(q: any = {}) {
    const achados = this.ordenar(
      this.rows.filter((r) => this.bate(r, q.where)),
      q.order,
    );
    const inicio = q.offset ?? 0;
    return q.limit ? achados.slice(inicio, inicio + q.limit) : achados.slice(inicio);
  }

  async findOne(q: any = {}) {
    return this.rows.find((r) => this.bate(r, q.where)) ?? null;
  }

  async count(q: any = {}) {
    return this.rows.filter((r) => this.bate(r, q.where)).length;
  }

  async update(valores: any, q: any = {}) {
    const alvo = this.rows.filter((r) => this.bate(r, q.where));
    alvo.forEach((r) => Object.assign(r, this.normalizar(valores)));
    return [alvo.length] as [number];
  }

  async destroy(q: any = {}) {
    const antes = this.rows.length;
    this.rows = this.rows.filter((r) => !this.bate(r, q.where));
    return antes - this.rows.length;
  }
}
