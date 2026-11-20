# Objetivos, Contas e Pagar

Todos seguem o mesmo padrão do módulo de agendamentos: `controller → service →
repositório (= model Sequelize) → Postgres`. Veja `docs/appointments-flow.md`.

Regras comuns:
- `GET /x/:id`, `PATCH /x/:id` e `DELETE /x/:id` devolvem **404** se o registro não existe.
- `PATCH` devolve o registro atualizado; `DELETE` devolve `{ "deleted": true }`.
- Exclusão lógica (`deleted_at`): o registro some das consultas, mas continua no banco.
- Categoria inexistente → 404. Apagar categoria que ainda tem registros → 409.

## Objetivos

| Rota | Descrição |
| --- | --- |
| `/objectives-categories` | CRUD de categorias (`titulo`) |
| `/objectives` | CRUD de objetivos. Filtros: `?id_categoria=1&checked=false` |

Campos do objetivo: `titulo`*, `descricao`, `prazo` (YYYY-MM-DD), `valor_guardado`,
`valor_objetivo`, `porcentagem`, `checked`, `prioridade`, `id_categoria`*.

- Números e `checked` podem ir como número/booleano **ou** como string (`"100"`, `"true"`), que é como o front atual envia.
- `porcentagem` é recalculada pelo back (`guardado / objetivo`, no máximo 100) sempre que os dois valores existem.
- A lista vem ordenada: abertos primeiro, depois por prazo (sem prazo por último). Cada objetivo traz `categoria`.

## Contas (o "molde": Luz, Água, Netflix…)

| Rota | Descrição |
| --- | --- |
| `/categoria-conta` | CRUD de categorias (`nome`) |
| `/counts` | CRUD de contas |

Campos da conta: `nome`*, `descricao`, `valor_esperado`, `valor_pago`, `tipo`*
(`Recorrente` / `Conta` / `Assinatura`), `qtde_parceladas`, `id_categoria_conta`.
A lista vem ordenada por nome e traz `categoria`.

## Pagar (as parcelas de cada conta)

| Rota | Descrição |
| --- | --- |
| `POST /pagar/gerar` | Gera as parcelas de uma conta |
| `/pagar` | CRUD de parcelas. Filtros: `?id_count=1&status=Atrasada&start=2026-01-01&end=2026-01-31` (intervalo sobre o vencimento) |

`POST /pagar/gerar` recebe `id_count` e `data_primeiro_vencimento` e, opcionalmente,
`qtde_parceladas` e `valor_parcela`. Quantidade de parcelas, nesta ordem:
1. a informada na chamada;
2. `qtde_parceladas` da conta;
3. padrão por tipo: `Recorrente` e `Assinatura` = 12, `Conta` = 1.

Uma parcela por mês, mantendo o dia (31/01 → 28/02 → 31/03). Se a conta já tem
parcelas, devolve 409.

Status (`Pendente`, `Paga`, `Atrasada`) é **calculado pelo back**:
- **Paga**: `valor_pago` cobre `valor_parcela` (`data_pagamento` vira hoje se não vier).
- **Atrasada**: venceu e não foi paga por completo.
- **Pendente**: o resto. Ao listar, pendentes vencidas viram Atrasada.

## Testes

```
npm run test:api
```

Sobe os controllers e services reais com repositórios em memória (não usa o banco).

## Atenção ao banco existente

`synchronize: true` só **cria** tabelas que faltam; não altera colunas de tabelas que
já existem. Se alguma tabela foi criada antes por outra versão do código, confira
colunas e chaves. Se `POST` der `duplicate key ... _pkey` após inserir ids na mão, ajuste a sequência:

```sql
SELECT setval(pg_get_serial_sequence('counts','id'), (SELECT MAX(id) FROM counts));
```
