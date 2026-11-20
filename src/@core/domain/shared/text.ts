/** Minúsculas, sem acento e sem espaços sobrando: "  Salário " -> "salario". */
export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function distancia(a: string, b: string): number {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = guardado;
    }
  }
  return linha[b.length];
}

/**
 * Procura `busca` numa lista de nomes (sem diferenciar maiúsculas/acentos).
 * `exato`: nome igual. `parecidos`: contém / está contido / erro de digitação.
 */
export function procurarNome<T>(busca: string, itens: T[], nomeDe: (item: T) => string) {
  const alvo = normalizar(busca);
  const exato = itens.find((i) => normalizar(nomeDe(i)) === alvo) ?? null;
  if (exato) return { exato, parecidos: [] as T[] };

  const parecidos = itens.filter((i) => {
    const nome = normalizar(nomeDe(i));
    return nome.includes(alvo) || alvo.includes(nome) || distancia(nome, alvo) <= 2;
  });
  return { exato: null, parecidos };
}
