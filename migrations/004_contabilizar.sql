-- "Contabilizar no caixa": quando false, o registro aparece nas listas mas fica fora
-- das entradas, saídas, saldo e evolução (ex.: assinatura paga no cartão, cuja fatura
-- já é lançada à parte; sem isso o valor entrava duplicado).
-- Padrão true: tudo o que já existe continua contando exatamente como antes.
-- Em `counts` (a conta/molde) o valor serve de padrão para as parcelas novas.
ALTER TABLE IF EXISTS lancamentos ADD COLUMN IF NOT EXISTS contabilizar BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS pagar ADD COLUMN IF NOT EXISTS contabilizar BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS receber ADD COLUMN IF NOT EXISTS contabilizar BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS counts ADD COLUMN IF NOT EXISTS contabilizar BOOLEAN NOT NULL DEFAULT true;
