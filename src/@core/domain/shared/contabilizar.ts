/**
 * "Contabilizar no caixa" (migration 004): quando false, o registro aparece nas listas
 * mas fica fora das entradas, saídas, saldo e evolução. Ex.: assinatura paga no cartão,
 * cuja fatura já é lançada à parte; sem isso o valor entrava duplicado.
 */

/** Aceita true/false e também "true"/"false" (a Ciel e formulários antigos mandam texto). */
export const paraBooleano = ({ value }: { value: unknown }) =>
  value === 'true' || value === true
    ? true
    : value === 'false' || value === false
      ? false
      : value;

/** Conta no caixa? Registros antigos (sem o campo) contam, como sempre contaram. */
export const contaNoCaixa = (registro: { contabilizar?: boolean | null }) =>
  registro.contabilizar !== false;
