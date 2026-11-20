-- Dinheiro passa a ser DECIMAL(12,2) em todas as tabelas que já existem.
-- Usa IF EXISTS: em banco novo o synchronize já cria as tabelas no formato certo.
ALTER TABLE IF EXISTS counts     ALTER COLUMN valor_esperado TYPE NUMERIC(12,2);
ALTER TABLE IF EXISTS counts     ALTER COLUMN valor_pago     TYPE NUMERIC(12,2);
ALTER TABLE IF EXISTS pagar      ALTER COLUMN valor_parcela  TYPE NUMERIC(12,2);
ALTER TABLE IF EXISTS pagar      ALTER COLUMN valor_pago     TYPE NUMERIC(12,2);
ALTER TABLE IF EXISTS objectives ALTER COLUMN valor_guardado TYPE NUMERIC(12,2);
ALTER TABLE IF EXISTS objectives ALTER COLUMN valor_objetivo TYPE NUMERIC(12,2);
