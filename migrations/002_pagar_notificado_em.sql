-- Controle de aviso das parcelas (usado por GET /notificacoes/pendentes).
-- O synchronize NÃO adiciona coluna em tabela existente, por isso esta migration.
ALTER TABLE IF EXISTS pagar ADD COLUMN IF NOT EXISTS notificado_em TIMESTAMP WITH TIME ZONE;
