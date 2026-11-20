# Lançamentos — `/lancamentos`

Gastos e receitas avulsos do dia a dia (diferente de `pagar`, que são parcelas de contas recorrentes).

| Rota | Descrição |
| --- | --- |
| `GET /lancamentos?tipo=&id_categoria=&start=&end=&limit=&offset=` | Lista (mais recentes primeiro). `start`/`end` filtram a `data` |
| `GET /lancamentos/:id` | Um lançamento |
| `POST /lancamentos` | Cria |
| `PATCH /lancamentos/:id` | Atualiza |
| `DELETE /lancamentos/:id` | Apaga (soft delete) |

Campos: `tipo`* (`despesa` | `receita`), `valor`* (> 0, até 2 casas), `id_categoria`, `descricao`, `data` (YYYY-MM-DD; padrão **hoje em São Paulo**), `forma_pagamento` (`pix` | `debito` | `credito` | `dinheiro` | `outro`), `origem` (`manual` | `ciel` | `whatsapp` | `importacao`; padrão `manual`), `observacao`.

`valor` é `DECIMAL(12,2)` no banco e sai como número com 2 casas. Categoria inexistente → 404. Cada item já vem com `categoria`.
