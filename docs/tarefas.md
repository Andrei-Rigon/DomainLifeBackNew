# Tarefas — `/tarefas`

| Rota | Descrição |
| --- | --- |
| `GET /tarefas?status=&prioridade=&start=&end=&limit=&offset=` | Lista por prazo (sem prazo por último). `start`/`end` filtram o `prazo` |
| `GET /tarefas/:id`, `POST`, `PATCH /:id`, `DELETE /:id` | CRUD |

Campos: `titulo`*, `descricao`, `status` (`a_fazer` | `em_andamento` | `feito`; padrão `a_fazer`), `prazo` (YYYY-MM-DD), `prioridade` (`baixa` | `media` | `alta`; padrão `media`).
