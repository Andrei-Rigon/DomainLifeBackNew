export const LIMITE_PADRAO = 50;
export const LIMITE_MAXIMO = 200;

export interface Paginacao {
  limit: number;
  offset: number;
}

/** `?limit=` (padrão 50, máximo 200) e `?offset=` (padrão 0). Valores ruins viram o padrão. */
export function lerPaginacao(limit?: string | number, offset?: string | number): Paginacao {
  const l = Number(limit);
  const o = Number(offset);
  return {
    limit: Number.isInteger(l) && l > 0 ? Math.min(l, LIMITE_MAXIMO) : LIMITE_PADRAO,
    offset: Number.isInteger(o) && o > 0 ? o : 0,
  };
}
