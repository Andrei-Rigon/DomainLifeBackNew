# Categorias financeiras — `/categorias-financeiras`

CRUD das categorias de gasto/receita usadas pelos lançamentos.

| Rota | Descrição |
| --- | --- |
| `GET /categorias-financeiras?tipo=&limit=&offset=` | Lista (ordem alfabética) |
| `GET /categorias-financeiras/:id` | Uma categoria (404 se não existe) |
| `POST /categorias-financeiras` | Cria |
| `PATCH /categorias-financeiras/:id` | Atualiza |
| `DELETE /categorias-financeiras/:id` | Apaga (409 se ainda tem lançamentos) |

Campos: `nome`* (até 100), `tipo` (`despesa` | `receita` | `ambos`; padrão `despesa`), `cor`, `icone`.

- **Nome único sem diferenciar maiúsculas/acentos:** "SALARIO" conflita com "Salário" (409). Internamente guarda `nome_normalizado` (coluna única).
- **Seed:** na subida da API cria as que faltam: Mercado, Combustível, Alimentação fora, Contas da casa, Saúde, Lazer, Transporte, Assinaturas, Outros (despesa) e Salário, Extra (receita). É idempotente.
- Sem soft delete (o nome fica livre para recriar).

Arquivos: `@core/domain/categorias-financeiras`, model em `@core/infraestructure/categorias-financeiras`.
