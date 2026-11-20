# Compras — `/compras`

| Rota | Descrição |
| --- | --- |
| `GET /compras?lista=&comprado=&limit=&offset=` | Lista (não comprados primeiro) |
| `POST /compras` | Adiciona item |
| `PATCH /compras/:id` | Atualiza (`comprado: true` grava `comprado_em`; `false` limpa) |
| `DELETE /compras/comprados?lista=` | Limpa os itens já comprados (todos, ou só de uma lista) |
| `GET /compras/:id`, `DELETE /compras/:id` | Um item / apaga |

Campos: `item`*, `quantidade` (texto livre: "2", "1 caixa"), `lista` (`mercado` | `online`; padrão `mercado`), `link`, `preco_estimado`, `comprado`, `comprado_em`.
`DELETE /compras/comprados` devolve `{ removidos: N }`.
