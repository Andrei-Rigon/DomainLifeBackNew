# Metas semanais — `/metas-semanais`

Metas pequenas da semana. (Os `/objectives` continuam sendo os objetivos maiores, com valor guardado.)

| Rota | Descrição |
| --- | --- |
| `GET /metas-semanais?semana=&concluida=&limit=&offset=` | Lista. `semana` aceita qualquer dia: vira a segunda-feira |
| `GET /metas-semanais/:id`, `POST`, `PATCH /:id`, `DELETE /:id` | CRUD |

Campos: `titulo`*, `semana` (padrão: semana atual), `concluida` (padrão `false`).
A `semana` é **sempre salva como a segunda-feira** da semana (ex.: 2026-11-18 → 2026-11-16).
