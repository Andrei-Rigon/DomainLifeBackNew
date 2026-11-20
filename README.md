# Domain Life API

API do Domain Life (NestJS 11 + Sequelize + Postgres): agenda, notas, objetivos, contas, financeiro, vida pessoal e a camada `/ciel/*` para o assistente Ciel.

## Como rodar

```powershell
npm install
copy .env.exemple .env      # preencha o .env (veja abaixo)
npm run migrate             # aplica as migrations SQL (veja "Migrations")
npm run start:dev           # http://localhost:3000
```

Checagem: `GET http://localhost:3000/health` → `{ "ok": true }` (única rota sem token).

### Variáveis do `.env`

| Variável | Para quê |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_DIALECT` | Conexão com o Postgres |
| `DB_SSL` | `true` se o banco exigir SSL (usado só pelo `npm run migrate`) |
| `PORT` | Porta da API (padrão 3000) |
| `API_KEY` | **Obrigatória.** Token que toda chamada manda no header `X-API-Key`. Sem ela, todas as rotas (exceto `/health`) respondem 401. Gere um valor longo e aleatório |
| `CORS_ORIGINS` | Origens liberadas no CORS, separadas por vírgula. Vazio = `FRONTEND_URL`, `http://localhost:5173` e `http://127.0.0.1:5174` |
| `FRONTEND_URL` | Origem do front (entra na lista padrão do CORS) |

### Autenticação

Toda rota exige `X-API-Key: <API_KEY>`. O front atual (`DomainLife.front`) ainda não manda esse header: precisa passar a mandá-lo (por exemplo em `src/api/client.ts`) antes de apontar para esta versão da API.

## Banco e migrations

`synchronize: true` (em `app.module.ts`) **só cria tabelas novas**; ele nunca altera tabela ou coluna que já existe, e não deve ir para produção. Mudanças em tabelas existentes são feitas por migrations SQL versionadas em [`migrations/`](migrations):

```powershell
npm run migrate
```

O script (`scripts/migrate.js`) usa as variáveis do `.env`, roda os `.sql` em ordem alfabética, **cada um uma vez** (registra em `schema_migrations`) e dentro de uma transação. Para criar uma nova: adicione `migrations/003_descricao.sql` (de preferência idempotente: `IF EXISTS` / `IF NOT EXISTS`).

| Migration | O que faz |
| --- | --- |
| `001_dinheiro_decimal_12_2.sql` | Colunas de dinheiro de `counts`, `pagar` e `objectives` viram `NUMERIC(12,2)` |
| `002_pagar_notificado_em.sql` | Adiciona `pagar.notificado_em` (controle de aviso de parcelas) |
| `003_perfil_saldo_inicial.sql` | Adiciona `perfil_financeiro.saldo_inicial` (saldo acumulado) |

> **Rode `npm run migrate` ANTES de subir a versão nova num banco que já existe.** O model de `pagar` passou a ter a coluna `notificado_em`; sem a migration, as consultas de `/pagar` falham.

Tabelas novas (`categorias_financeiras`, `lancamentos`, `receber`, `perfil_financeiro`, `avisos_agendamento`, `lembretes`, `tarefas`, `metas_semanais`, `compras`, `pesos`, `aniversarios`) são criadas sozinhas pelo `synchronize`.

## Convenções das respostas

- **Ids** (`id`, `id_*`) sempre como número (o `pg` devolve BIGINT como texto; um interceptor global converte).
- **Dinheiro** como número com 2 casas (`DECIMAL(12,2)` no banco). Contas são feitas em centavos.
- **"Hoje"** é sempre o dia em `America/Sao_Paulo` (`@core/domain/shared/date.helper.ts`).
- **Listagens novas** aceitam `?limit=` (padrão 50, máximo 200) e `?offset=`.
- Erros: `{ statusCode, message }` do Nest; nas rotas `/ciel/*`: `{ ok:false, mensagem }`.

## Rotas

| Área | Rotas | Doc |
| --- | --- | --- |
| Agenda | `/appointments` (+ avisos) | [appointments-flow](docs/appointments-flow.md), [agenda-avisos](docs/agenda-avisos.md) |
| Notas | `/notes` | |
| Objetivos | `/objectives`, `/objectives-categories` | [objetivos-contas-pagar](docs/objetivos-contas-pagar.md) |
| Contas | `/counts`, `/categoria-conta`, `/pagar` | [objetivos-contas-pagar](docs/objetivos-contas-pagar.md) |
| Financeiro | `/categorias-financeiras`, `/lancamentos`, `/receber`, `/financeiro/resumo`, `/financeiro/saldo`, `/financeiro/evolucao`, `/financeiro/exportar`, `/perfil-financeiro`, `/custo-horas` | [categorias-financeiras](docs/categorias-financeiras.md), [lancamentos](docs/lancamentos.md), [receber](docs/receber.md), [financeiro](docs/financeiro.md), [perfil-financeiro](docs/perfil-financeiro.md) |
| Vida pessoal | `/lembretes`, `/tarefas`, `/metas-semanais`, `/compras`, `/peso`, `/aniversarios` | [lembretes](docs/lembretes.md), [tarefas](docs/tarefas.md), [metas-semanais](docs/metas-semanais.md), [compras](docs/compras.md), [peso](docs/peso.md), [aniversarios](docs/aniversarios.md) |
| Avisos | `/notificacoes/pendentes`, `/notificacoes/:tipo/:id/enviado` | [notificacoes](docs/notificacoes.md) |
| Dashboard | `/dashboard` | [dashboard](docs/dashboard.md) |
| Ciel | `/ciel/*` | [ciel](docs/ciel.md) |

Arquitetura (igual em todos os módulos): `@core/domain/<modulo>/{controllers,dto,entities,module,providers,repositories,services}` + model Sequelize em `@core/infraestructure/<modulo>/sequelize`. Veja [appointments-flow](docs/appointments-flow.md).

## Testes

```powershell
npm run test:api
```

Sobe controllers, services, guard de token e `ValidationPipe` reais com **repositórios em memória** (não usa o banco) e confere os módulos reais com uma conexão Sequelize que nunca conecta. Cobre: token, `/ciel/gasto` (categoria nova e existente), `/ciel/pagar-conta` por nome, datas "amanha"/"hoje", valores com vírgula, resumo do mês, CSV, notificações, paginação e ids/dinheiro nas respostas.

`npm run test:e2e` roda também o teste padrão do Nest (`app.e2e-spec.ts`), que **conecta no banco do `.env`**.

## Instalação inicial (histórico)

```
nest new .
npm install sequelize sequelize-typescript pg pg-hstore
```
