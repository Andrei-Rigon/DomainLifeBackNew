-- Saldo inicial do perfil financeiro (entra no saldo acumulado: GET /financeiro/saldo).
-- Se a tabela ainda não existe, o synchronize já cria com a coluna.
ALTER TABLE IF EXISTS perfil_financeiro ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0;
