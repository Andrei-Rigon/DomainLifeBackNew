# Peso — `/peso`

| Rota | Descrição |
| --- | --- |
| `GET /peso?start=&end=&limit=&offset=` | Lista (mais recentes primeiro) |
| `POST /peso` | Registra. **Um por dia:** se a data já existe, atualiza |
| `GET /peso/resumo?mes=YYYY-MM` | Resumo do mês |
| `GET /peso/:id`, `PATCH /:id`, `DELETE /:id` | CRUD |

Campos: `data` (padrão hoje), `peso_kg`* (1–500, até 2 casas). `data` é única.
Resumo: `{ mes, registros, inicial: {data, peso_kg}, final, variacao_kg, media_kg, minimo_kg, maximo_kg }` (campos vazios se não há registros no mês).
