-- Contas bancárias (Sicoob, Nubank, Investimentos, cartão...) e o tipo "transferencia".
-- Obs.: a tabela `counts` já se chama "Conta" no código, mas é o molde das contas a pagar;
-- por isso aqui o nome é contas_bancarias.
--
-- Só ADICIONA estrutura: nenhum lançamento existente muda de valor, tipo ou conta.
-- Registros sem conta (id_conta_bancaria NULL) continuam contando como sempre.
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'corrente', -- corrente | investimento | cartao
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

-- "transferencia" tem 13 letras; a coluna era VARCHAR(10)
ALTER TABLE IF EXISTS lancamentos ALTER COLUMN tipo TYPE VARCHAR(15);

ALTER TABLE IF EXISTS lancamentos ADD COLUMN IF NOT EXISTS id_conta_bancaria BIGINT NULL REFERENCES contas_bancarias(id);
-- Só nas transferências: para onde o dinheiro foi (id_conta_bancaria = de onde saiu)
ALTER TABLE IF EXISTS lancamentos ADD COLUMN IF NOT EXISTS id_conta_destino BIGINT NULL REFERENCES contas_bancarias(id);
ALTER TABLE IF EXISTS pagar ADD COLUMN IF NOT EXISTS id_conta_bancaria BIGINT NULL REFERENCES contas_bancarias(id);
ALTER TABLE IF EXISTS receber ADD COLUMN IF NOT EXISTS id_conta_bancaria BIGINT NULL REFERENCES contas_bancarias(id);
