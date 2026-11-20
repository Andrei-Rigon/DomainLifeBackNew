# Lembretes — `/lembretes`

| Rota | Descrição |
| --- | --- |
| `GET /lembretes?ativo=&limit=&offset=` | Lista por horário |
| `POST /lembretes` | Cria |
| `PATCH /lembretes/:id` | Atualiza (mudar `lembrar_em` faz voltar a ser avisado) |
| `POST /lembretes/:id/enviado` | Marca como enviado; se repete, agenda o próximo |
| `DELETE /lembretes/:id` | Apaga |

Campos: `texto`*, `lembrar_em`* (data/hora no horário de São Paulo, ex.: `2026-11-19T09:00`), `repetir` (`nao` | `diario` | `semanal` | `mensal`), `ativo`, `enviado_em`.

Ao marcar como enviado: `enviado_em` = agora e, se repete, `lembrar_em` avança para a primeira ocorrência **depois de agora** (mensal mantém o dia: 31/01 → 28/02). Quem envia é outra peça, via `/notificacoes`.
