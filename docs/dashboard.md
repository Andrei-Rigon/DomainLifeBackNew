# Dashboard — `GET /dashboard`

Tudo da tela inicial num só JSON (cada bloco com no máximo 10 itens):

- `agenda_proximos_7_dias`
- `tarefas_em_andamento`
- `lembretes_hoje`
- `financeiro_mes` (o mesmo de `/financeiro/resumo`, com `por_categoria` limitado a 10)
- `parcelas_vencendo_7_dias` (não pagas)
- `metas_da_semana`
- `ultimo_peso` (`{ data, peso_kg }` ou `null`)
