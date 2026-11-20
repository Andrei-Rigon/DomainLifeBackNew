/**
 * Roda as migrations SQL da pasta /migrations (ordem alfabética) uma única vez
 * cada, registrando o que já foi aplicado na tabela `schema_migrations`.
 *
 *   npm run migrate
 *
 * Usa as mesmas variáveis do .env da API (DB_HOST, DB_PORT, DB_USERNAME,
 * DB_PASSWORD, DB_DATABASE; DB_SSL=true se o banco exigir SSL).
 * Cada arquivo roda dentro de uma transação: se falhar, nada dele é aplicado.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (nome TEXT PRIMARY KEY, aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const { rows } = await client.query('SELECT nome FROM schema_migrations');
  const aplicadas = new Set(rows.map((r) => r.nome));

  const pasta = path.join(__dirname, '..', 'migrations');
  const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort();

  let novas = 0;
  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const sql = fs.readFileSync(path.join(pasta, arquivo), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (nome) VALUES ($1)', [arquivo]);
      await client.query('COMMIT');
      console.log(`aplicada: ${arquivo}`);
      novas++;
    } catch (erro) {
      await client.query('ROLLBACK');
      console.error(`FALHOU: ${arquivo}\n${erro.message}`);
      await client.end();
      process.exit(1);
    }
  }
  console.log(novas ? `${novas} migration(s) aplicada(s).` : 'Nada a aplicar: banco já está atualizado.');
  await client.end();
}

main().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
