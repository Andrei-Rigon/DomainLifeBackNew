# Notificações — `/notificacoes`

Só **informa** o que precisa ser avisado; o envio (WhatsApp) é de outra peça, que consome estas rotas.

## `GET /notificacoes/pendentes?limit=&offset=`
Tudo que já devia ter sido avisado e não foi:

| `tipo` | De onde vem |
| --- | --- |
| `aviso_agendamento` | avisos da agenda com `avisar_em` <= agora e sem `enviado_em` |
| `lembrete` | lembretes ativos vencidos e não avisados |
| `parcela` | parcelas não pagas que vencem **hoje ou amanhã** e ainda não avisadas |
| `aniversario` | aniversariantes de hoje que ainda não foram avisados neste ano |

Resposta: `{ gerado_em, total, itens: [{ tipo, id, mensagem, quando, dados }] }`. `mensagem` já vem em português (ex.: "Dentista hoje às 08:00."); `dados` traz o que o envio precisa (ex.: telefone e texto do parabéns).

## `POST /notificacoes/:tipo/:id/enviado`
Confirma o envio; o item sai de `/pendentes`. `:tipo` = um dos tipos acima, `:id` = o `id` que veio no item. Para lembrete que repete, agenda o próximo.
Tipo inválido → 400.

Parcelas usam a coluna `pagar.notificado_em` (**precisa da migration 002**).
