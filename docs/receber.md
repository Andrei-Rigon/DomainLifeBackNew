# Contas a receber — `/receber`

Espelho de `/pagar` para o dinheiro que **vai entrar** (salário, aluguel, freela).

| Rota | Descrição |
| --- | --- |
| `GET /receber?status=&id_categoria=&start=&end=&limit=&offset=` | Lista por vencimento. `start`/`end` filtram o vencimento |
| `POST /receber` | Cria uma cobrança |
| `POST /receber/gerar` | Gera várias cobranças mensais de uma vez |
| `GET /receber/:id`, `PATCH /:id`, `DELETE /:id` | Um item / atualiza / apaga (soft delete) |

Campos: `descricao`*, `valor`* (> 0), `data_vencimento`* (YYYY-MM-DD), `id_categoria` (categoria financeira), `numero_parcela`, `valor_recebido`, `data_recebimento`, `status`.

`POST /receber/gerar`: `{ descricao, valor, primeiro_vencimento, qtde (1–60, padrão 1), id_categoria }`. Cria uma por mês mantendo o dia (31/01 → 28/02) e numera a descrição ("Aluguel - 1/3").

**Status calculado pelo back:**
- **Recebida:** `valor_recebido` cobre o `valor` (e `data_recebimento` vira hoje se não vier);
- **Atrasada:** venceu e não foi recebida por completo (recebimento parcial continua em aberto);
- **Pendente:** o resto. Ao listar, pendentes vencidas viram Atrasada.

O que foi **recebido** entra nas **entradas** do caixa (`/financeiro/resumo`, `/financeiro/saldo`, CSV) pela data de recebimento. Tabela `receber` (criada pelo `synchronize`).
