/**
 * Datas em America/Sao_Paulo. TODO "hoje" do sistema vem daqui (nunca de
 * `new Date().toISOString()`, que é UTC e vira o dia errado depois das 21h).
 *
 * Datas "puras" são strings YYYY-MM-DD; a aritmética é feita em UTC só para
 * não sofrer com horário de verão/fuso do servidor.
 */
export const FUSO = 'America/Sao_Paulo';
const OFFSET_SP = '-03:00'; // o Brasil não usa horário de verão desde 2019

const fmtData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}); // en-CA formata como YYYY-MM-DD

const fmtHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Data (YYYY-MM-DD) de um instante, no fuso de São Paulo. */
export function dataSP(instante: Date = new Date()): string {
  return fmtData.format(instante);
}

/** Hoje (YYYY-MM-DD) em São Paulo. */
export function hoje(): string {
  return dataSP(new Date());
}

/** Hora (HH:mm) de um instante, no fuso de São Paulo. */
export function horaSP(instante: Date): string {
  return fmtHora.format(instante);
}

function paraUtc(data: string): Date {
  const [a, m, d] = data.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

function deUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function somarDias(data: string, dias: number): string {
  const d = paraUtc(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return deUtc(d);
}

/** Soma meses mantendo o dia (31/01 + 1 mês = 28/02 ou 29/02). */
export function somarMeses(data: string, meses: number): string {
  const [ano, mes, dia] = data.slice(0, 10).split('-').map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return deUtc(alvo);
}

/** Segunda-feira da semana da data informada. */
export function segundaDaSemana(data: string): string {
  const dow = paraUtc(data).getUTCDay(); // 0 = domingo
  return somarDias(data, dow === 0 ? -6 : 1 - dow);
}

export function domingoDaSemana(data: string): string {
  return somarDias(segundaDaSemana(data), 6);
}

/** Mês (YYYY-MM) da data. */
export function mesDe(data: string): string {
  return data.slice(0, 7);
}

export function mesAtual(): string {
  return mesDe(hoje());
}

export function inicioDoMes(mes: string): string {
  return `${mes}-01`;
}

export function fimDoMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return deUtc(new Date(Date.UTC(a, m, 0)));
}

export function mesAnterior(mes: string): string {
  return mesDe(somarMeses(inicioDoMes(mes), -1));
}

export function mesValido(mes: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

/** Data (YYYY-MM-DD) real e existente? (rejeita 2026-02-31) */
export function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  return deUtc(paraUtc(data)) === data;
}

/**
 * Aceita "hoje", "amanha", "ontem", YYYY-MM-DD e DD/MM[/YYYY].
 * Devolve null se não entender.
 */
export function resolverData(valor: unknown, base: string = hoje()): string | null {
  if (valor === undefined || valor === null || valor === '') return base;
  const texto = String(valor)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  if (texto === 'hoje') return hoje();
  if (texto === 'amanha') return somarDias(hoje(), 1);
  if (texto === 'ontem') return somarDias(hoje(), -1);
  if (texto === 'depois de amanha') return somarDias(hoje(), 2);

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return dataValida(texto) ? texto : null;

  const br = texto.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (br) {
    const ano = br[3] ? (br[3].length === 2 ? `20${br[3]}` : br[3]) : hoje().slice(0, 4);
    const data = `${ano}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
    return dataValida(data) ? data : null;
  }
  return null;
}

/**
 * Data+hora sem fuso ("2026-11-19T08:00", "2026-11-19 08:00") é lida como
 * horário de São Paulo. Se já vier com Z ou offset, respeita.
 */
export function dataHoraSP(texto: string): Date | null {
  const t = texto.trim().replace(' ', 'T');
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(t);
  const completo = temFuso ? t : `${t.length === 16 ? `${t}:00` : t}${OFFSET_SP}`;
  const d = new Date(completo);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Combina data (YYYY-MM-DD) + hora (HH:mm[:ss]) em São Paulo. */
export function combinarDataHora(data: string, hora: string): Date {
  return new Date(`${data}T${hora.slice(0, 5)}:00${OFFSET_SP}`);
}

/** "19/11" */
export function formatarDiaMes(data: string): string {
  const [, m, d] = data.slice(0, 10).split('-');
  return `${d}/${m}`;
}

/** "quinta" (sem o "-feira") */
export function nomeDiaSemana(data: string): string {
  return paraUtc(data)
    .toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' })
    .replace('-feira', '');
}

/** "novembro" */
export function nomeMes(dataOuMes: string): string {
  const [a, m] = dataOuMes.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
}

/** "hoje", "amanhã", "ontem" ou "quinta, 19/11" */
export function descreverData(data: string): string {
  const h = hoje();
  if (data === h) return 'hoje';
  if (data === somarDias(h, 1)) return 'amanhã';
  if (data === somarDias(h, -1)) return 'ontem';
  return `${nomeDiaSemana(data)}, ${formatarDiaMes(data)}`;
}
