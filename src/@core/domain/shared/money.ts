/**
 * Dinheiro: o banco guarda DECIMAL(12,2). Em memória, as contas são feitas em
 * CENTAVOS (inteiros) para não acumular erro de ponto flutuante.
 */
export function paraCentavos(valor: number | string | null | undefined): number {
  return Math.round(Number(valor ?? 0) * 100);
}

export function arredondar2(valor: number | string | null | undefined): number {
  return paraCentavos(valor) / 100;
}

/** Soma valores monetários sem erro de float. */
export function somar(valores: Array<number | string | null | undefined>): number {
  return valores.reduce<number>((total, v) => total + paraCentavos(v), 0) / 100;
}

/**
 * Lê valores como 50, 50.5, "50,50", "R$ 1.234,56". Devolve null se não for
 * um número válido e positivo.
 */
export function parseValor(entrada: unknown): number | null {
  if (typeof entrada === 'number') return Number.isFinite(entrada) && entrada >= 0 ? arredondar2(entrada) : null;
  if (typeof entrada !== 'string') return null;

  let texto = entrada.replace(/R\$|\s/gi, '');
  if (!texto) return null;
  if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
  if (!/^\d+(\.\d+)?$/.test(texto)) return null;

  const numero = Number(texto);
  return Number.isFinite(numero) ? arredondar2(numero) : null;
}

/** "R$ 1.234,56" (com espaço comum, pronto para ser falado) */
export function formatarReais(valor: number | string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(valor))
    .replace(/ /g, ' ');
}

/** "78,4" */
export function formatarNumero(valor: number, casas = 1): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: casas });
}
