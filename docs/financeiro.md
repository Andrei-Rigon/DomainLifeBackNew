# Financeiro — `/financeiro`

## `GET /financeiro/resumo?mes=YYYY-MM`
Padrão: mês atual. Devolve:
- `entradas`, `saidas`, `saldo` do mês;
- `detalhe_entradas`: `{ lancamentos, recebimentos }` e `detalhe_saidas`: `{ lancamentos, parcelas_pagas }`;
- `por_categoria`: `[{ id_categoria, categoria, tipo, total }]` (maior primeiro; `tipo` separa despesa de receita);
- `parcelas`: `{ Paga, Pendente, Atrasada }` e `a_receber`: `{ Recebida, Pendente, Atrasada }`, cada uma com `{ qtd, total }` (módulos [`pagar`](objetivos-contas-pagar.md) e [`receber`](receber.md) com **vencimento** no mês);
- `comparacao`: mês anterior (`entradas`, `saidas`, `saldo`) e `variacao_saidas_pct` (positivo = gastou mais).

**Regra do caixa (o que de fato entrou/saiu):**
- ENTRADAS = receitas lançadas + cobranças de `/receber` **recebidas no mês** (pela data de recebimento);
- SAÍDAS = despesas lançadas + parcelas de `/pagar` **pagas no mês** (pela data de pagamento).

Assim dar baixa numa parcela/cobrança já aparece no saldo, sem lançar duas vezes. Entram em `por_categoria` como "Contas (parcelas pagas)" e "Contas a receber" (ou a categoria da cobrança).

## `GET /financeiro/saldo?ate=YYYY-MM-DD`
Saldo acumulado até a data (padrão hoje): `{ ate, saldo_inicial, entradas, saidas, saldo }`, onde `saldo = saldo_inicial + entradas - saidas` desde o começo. O `saldo_inicial` vem de `PUT /perfil-financeiro`. Lançamentos com data depois de `ate` ficam de fora.

## `GET /financeiro/evolucao?meses=6`
Entradas, saídas e saldo dos últimos `meses` meses (1–24, padrão 6), do mais antigo ao atual: `[{ mes, entradas, saidas, saldo }]`. Alimenta o gráfico da tela Financeiro.

## `GET /financeiro/exportar?start=&end=&formato=csv`
CSV com lançamentos + parcelas pagas + cobranças recebidas do período. `;` como separador, UTF-8 **com BOM**, valores com vírgula (`50,50`) — abre direto no Excel.
Colunas: `Data;Tipo;Descrição;Categoria;Valor;Forma de pagamento;Origem`. Textos que começam com `= + - @` ganham um apóstrofo na frente (evita injeção de fórmula no Excel).
`start` e `end` obrigatórios (YYYY-MM-DD); só `formato=csv` existe.
