# Aniversários — `/aniversarios`

| Rota | Descrição |
| --- | --- |
| `GET /aniversarios?mes=&limit=&offset=` | Lista por nome; `mes` (1–12) filtra |
| `GET /aniversarios/:id`, `POST`, `PATCH /:id`, `DELETE /:id` | CRUD |

Campos: `nome`*, `data_nascimento`* (`YYYY-MM-DD`, ou só `MM-DD` quando o ano é desconhecido), `telefone`, `mensagem` (texto do parabéns), `ultimo_aviso_ano` (controle interno: evita avisar duas vezes no mesmo ano).
Entram em `GET /notificacoes/pendentes` no dia do aniversário.
