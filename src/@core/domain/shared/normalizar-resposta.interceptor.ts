import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

/**
 * Padroniza TODAS as respostas JSON:
 *  - ids (`id`, `id_*`): o `pg` devolve BIGINT como string -> vira número.
 *  - dinheiro: DECIMAL vem como string ("50.00") -> vira número com 2 casas.
 * Respostas que não são objeto/array (CSV, texto) passam direto.
 */
const CAMPOS_DINHEIRO = new Set([
  'valor',
  'valor_parcela',
  'valor_pago',
  'valor_esperado',
  'valor_guardado',
  'valor_objetivo',
  'valor_hora',
  'salario_liquido',
  'saldo_inicial',
  'valor_recebido',
  'recebimentos',
  'saldo_acumulado',
  'preco_estimado',
  'entradas',
  'saidas',
  'saldo',
  'total',
  'lancamentos',
  'parcelas_pagas',
  'diferenca',
]);
const CAMPOS_DECIMAL = new Set(['peso_kg', 'horas_por_dia', 'horas', 'dias', 'variacao_kg', 'media_kg', 'minimo_kg', 'maximo_kg']);

function converter(valor: any, chave?: string): any {
  if (Array.isArray(valor)) return valor.map((v) => converter(v));
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, converter(v, k)]));
  }
  if (chave && (typeof valor === 'string' || typeof valor === 'number')) {
    if ((chave === 'id' || chave.startsWith('id_')) && /^\d+$/.test(String(valor))) return Number(valor);
    if ((CAMPOS_DINHEIRO.has(chave) || CAMPOS_DECIMAL.has(chave)) && valor !== '' && !Number.isNaN(Number(valor))) {
      return Math.round(Number(valor) * 100) / 100;
    }
  }
  return valor;
}

@Injectable()
export class NormalizarRespostaInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((dados) => {
        if (dados === null || typeof dados !== 'object') return dados;
        const ehObjetoSimples = Array.isArray(dados) || Object.getPrototypeOf(dados) === Object.prototype || typeof dados.toJSON === 'function';
        if (!ehObjetoSimples) return dados; // StreamableFile etc.
        return converter(JSON.parse(JSON.stringify(dados)));
      }),
    );
  }
}
