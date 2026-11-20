# Agenda: avisos — `/appointments`

As rotas de `/appointments` continuam iguais; a criação/edição aceita avisos e `GET` devolve `avisos` em cada compromisso.

Tabela `avisos_agendamento`: `id_appointment`, `avisar_em` (data/hora), `enviado_em`.

Na criação (`POST`) ou edição (`PATCH`):
- `avisos`: `["2026-11-19T08:00", ...]` — horário de São Paulo (aceita também com `Z`/offset);
- `avisar`: atalho `"no_dia_8h"` (dia do evento às 8h) ou `"dia_anterior_20h"` (véspera às 20h).

No `PATCH`, avisos informados **substituem** os ainda não enviados. `data_hora_evento` agora é preenchido com **data + hora** (São Paulo) quando há `hora_evento` e é recalculado ao mudar a data ou a hora.
Apagar o compromisso apaga seus avisos. Os avisos vencidos aparecem em `/notificacoes/pendentes`.
