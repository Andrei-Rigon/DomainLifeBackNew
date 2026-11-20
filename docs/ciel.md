# Rotas do Ciel (`/ciel/*`)

Camada pensada para um modelo pequeno que chama a API por HTTP a partir de uma frase falada.

## Regras comuns

- **Autenticação:** header `X-API-Key: <API_KEY do .env>` em toda chamada.
- **Nomes, não ids:** categoria, conta e lista vão pelo nome, sem diferenciar maiúsculas/acentos (`mercado` = `Mercado`, `alimentacao fora` = `Alimentação fora`).
- **Datas:** opcionais (padrão hoje). Aceita `"hoje"`, `"amanha"`, `"ontem"`, `AAAA-MM-DD` e `DD/MM[/AAAA]`. "Hoje" é sempre o dia em São Paulo.
- **Valores:** `50`, `50.5`, `"50,50"` e `"R$ 1.234,56"`.
- **Resposta de sucesso:** `{ "ok": true, "mensagem": "<frase pronta para falar>", "dados": {...} }`
- **Resposta de erro (400/404):** `{ "ok": false, "mensagem": "<o que faltou ou deu errado>" }`. Nunca vem stack trace; erro inesperado vira 500 com mensagem genérica.
- **Listas:** no máximo 10 itens na resposta.
- **Origem:** toda escrita que tem campo `origem` grava `"ciel"` (lançamentos).
- Rotas que mexem com dinheiro (`gasto`, `receita`, `pagar-conta`): o Ciel deve **confirmar com o usuário antes** de chamar.

Os exemplos usam `http://<IP>:3000`. `X-API-Key` é omitido nos corpos abaixo.

---

## `POST /ciel/gasto`
**Quando usar:** "gastei 50 no mercado", "lança 30 de combustível", "paguei 25 na padaria no pix", "despesa de 12 com lazer ontem".

```json
{ "valor": "50,50", "categoria": "Mercado", "descricao": "compras da semana", "data": "hoje", "forma_pagamento": "pix" }
```
- `valor` obrigatório. `categoria` (padrão `Outros`); **se não existir, é criada**. `forma_pagamento`: pix, débito, crédito/cartão, dinheiro (outro vira `outro`).

```json
{ "ok": true, "mensagem": "Lancei R$ 50,50 em Mercado hoje.",
  "dados": { "id": 12, "tipo": "despesa", "valor": 50.5, "categoria": "Mercado", "data": "2026-11-18" } }
```
**Erros:** sem valor / valor inválido → 400 "Não entendi o valor. Diga algo como 50 ou 50,50."; data inválida → 400 "Não entendi a data ...".

## `POST /ciel/receita`
**Quando usar:** "recebi o salário de 3000", "entrou 200 de extra", "registra uma receita de 150".

```json
{ "valor": 3000, "categoria": "Salário", "descricao": "novembro", "data": "2026-11-05" }
```
`categoria` padrão `Extra`; se não existir, é criada como receita.
```json
{ "ok": true, "mensagem": "Registrei R$ 3.000,00 de Salário.", "dados": { "id": 13, "tipo": "receita", "valor": 3000, "categoria": "Salário", "data": "2026-11-05" } }
```
**Erros:** mesmos de `gasto`.

## `GET /ciel/quanto-gastei?categoria=&periodo=`
**Quando usar:** "quanto gastei esse mês?", "quanto gastei no mercado?", "quanto gastei hoje / essa semana?".
`periodo`: `hoje` | `semana` | `mes` (padrão `mes`). Sem `categoria`, soma tudo (despesas + parcelas de contas pagas).

```json
{ "ok": true, "mensagem": "Este mês você gastou R$ 820,00 em Mercado.",
  "dados": { "periodo": "mes", "start": "2026-11-01", "end": "2026-11-30", "categoria": "Mercado", "total": 820, "por_categoria": [ ... ] } }
```
**Erros:** categoria que não existe → 404 "Não achei a categoria Viagem. Categorias que tenho: Mercado, ...". Período inválido → 400.

## `POST /ciel/pagar-conta`
**Quando usar:** "paguei a Netflix", "marca a luz como paga", "paguei 95 da internet".

```json
{ "conta": "Netflix", "valor": "39,90", "data": "hoje" }
```
Paga a **parcela em aberto mais antiga** da conta (atrasadas primeiro). `valor` padrão = valor da parcela. Valor menor que a parcela = pagamento parcial (continua em aberto).
```json
{ "ok": true, "mensagem": "Marquei a parcela de novembro da conta Netflix como paga.",
  "dados": { "id_parcela": 7, "conta": "Netflix", "vencimento": "2026-11-19", "valor_pago": 39.9, "status": "Paga" } }
```
Parcial: "Registrei R$ 10,00 na parcela de novembro da conta Netflix. Ainda faltam R$ 30,00."
**Erros:** conta não achada → 404 "Não achei a conta Spotify. Contas que tenho: Netflix, Luz."; várias parecidas → 400 "Qual conta? Achei: ..."; conta sem parcelas em aberto → 404.

## `GET /ciel/contas-a-pagar?periodo=`
**Quando usar:** "o que eu tenho pra pagar essa semana?", "quais contas vencem esse mês?". `periodo`: `semana` (padrão) | `mes`.

```json
{ "ok": true, "mensagem": "Você tem 3 contas para pagar esta semana: Luz R$ 110,00 (dia 19), ... Atenção: 1 atrasada, somando R$ 40,00.",
  "dados": { "periodo": "semana", "total_a_pagar": 250, "itens": [ { "id_parcela": 7, "conta": "Luz", "valor": 110, "vencimento": "2026-11-19" } ], "atrasadas": 1 } }
```

## `POST /ciel/agendar`
**Quando usar:** "marca dentista quinta às 8h", "agenda reunião amanhã 15h no escritório e me avisa no dia".

```json
{ "titulo": "Dentista", "data": "2026-11-19", "hora": "08:00", "local": "Clínica Sorriso", "avisar": "no dia" }
```
`hora` aceita `08:00`, `8h`, `8h30`. `avisar`: `no_dia_8h` ("no dia") ou `dia_anterior_20h` ("dia anterior"/"véspera").
```json
{ "ok": true, "mensagem": "Agendei Dentista para quinta, 19/11, às 08:00. Aviso no dia às 8h.", "dados": { "titulo": "Dentista", "data": "2026-11-19", "hora": "08:00", "aviso": "no_dia_8h" } }
```
**Erros:** sem título/data → 400 "Faltou a data do compromisso."; hora inválida → 400.

## `POST /ciel/lembrete`
**Quando usar:** "me lembra amanhã às 9 de pagar o IPVA", "me lembra todo dia às 8h de tomar o remédio".

```json
{ "texto": "Pagar o IPVA", "quando": "amanha 09:00", "repetir": "nao" }
```
`quando`: `AAAA-MM-DDTHH:mm` ou `<dia> <hora>` (`amanha 09:00`, `hoje 18h`). `repetir`: nao | diario | semanal | mensal ("todo dia", "toda semana", "todo mês").
```json
{ "ok": true, "mensagem": "Vou te lembrar amanhã às 09:00.", "dados": { "texto": "Pagar o IPVA", "quando": "2026-11-19T09:00", "repetir": "nao" } }
```
**Erros:** sem hora → 400 "Diga também a hora do lembrete..."; horário no passado → 400 "Esse horário já passou...".

## `POST /ciel/nota`
**Quando usar:** "anota aí: ideia de app", "guarda essa nota".
```json
{ "titulo": "Ideia", "texto": "App de receitas" }
```
Sem `titulo`, usa o começo do texto.
```json
{ "ok": true, "mensagem": "Anotei.", "dados": { "id": 5, "titulo": "Ideia" } }
```

## `POST /ciel/compras`
**Quando usar:** "coloca leite na lista do mercado", "adiciona 2 pacotes de café", "põe um tênis na lista online".
```json
{ "item": "leite", "lista": "mercado", "quantidade": "2" }
```
`lista`: mercado (padrão) | online. Item já na lista não é duplicado.
```json
{ "ok": true, "mensagem": "Coloquei leite (2) na lista do mercado.", "dados": { "item": "leite", "lista": "mercado", "quantidade": "2" } }
```
**Erros:** sem item → 400; lista inválida → 400 "Lista inválida. Use mercado ou online.".

## `GET /ciel/compras?lista=`
**Quando usar:** "o que falta comprar?", "o que tem na lista do mercado?".
```json
{ "ok": true, "mensagem": "Na lista do mercado: leite, pão e café.", "dados": { "mercado": ["leite", "pão", "café"] } }
```
Sem `lista`, devolve as duas.

## `POST /ciel/tarefa`
**Quando usar:** "cria uma tarefa renovar a CNH até sexta, urgente", "preciso lembrar de revisar o carro".
```json
{ "titulo": "Renovar CNH", "prazo": "2026-11-21", "prioridade": "alta" }
```
`prioridade`: baixa | média | alta (urgente = alta). Padrão média.
```json
{ "ok": true, "mensagem": "Criei a tarefa Renovar CNH para sábado, 21/11, com prioridade alta.", "dados": { "id": 3, "titulo": "Renovar CNH", "prazo": "2026-11-21", "prioridade": "alta" } }
```

## `POST /ciel/peso`
**Quando usar:** "me pesei, 78,4", "registra meu peso de hoje, 78 e meio".
```json
{ "peso_kg": "78,4", "data": "hoje" }
```
Um registro por dia (repetir no mesmo dia atualiza). Compara com o registro de 7 dias antes (ou o mais recente anterior).
```json
{ "ok": true, "mensagem": "Registrei 78,4 kg. 0,6 kg a menos que semana passada.", "dados": { "data": "2026-11-18", "peso_kg": 78.4, "variacao_kg": -0.6 } }
```
**Erros:** peso fora de 20–500 kg ou ilegível → 400.

## `GET /ciel/hoje`
**Quando usar:** "como tá meu dia?", "o que eu tenho hoje?", "bom dia".
```json
{ "ok": true, "mensagem": "Hoje é quarta, 18/11. Compromissos: Reunião às 15:00. Contas vencendo hoje: Luz R$ 110,00. Tarefas: Renovar CNH.", "dados": { "compromissos": [...], "lembretes": [...], "contas_vencendo_hoje": 1, "contas_atrasadas": 0, "tarefas": [...] } }
```
Sem nada: "Hoje é quarta, 18/11. Seu dia está livre."

## `GET /ciel/resumo-mes?mes=`
**Quando usar:** "como foi meu mês?", "resumo financeiro de outubro". `mes` = `AAAA-MM` (padrão o mês atual).
```json
{ "ok": true, "mensagem": "Em novembro você recebeu R$ 3.000,00, gastou R$ 240,00 e o saldo é R$ 2.760,00. O maior gasto foi Mercado, R$ 100,00. Você gastou 200% a mais que em outubro.", "dados": { "mes": "2026-11", "entradas": 3000, "saidas": 240, "saldo": 2760, "por_categoria": [...], "parcelas": {...}, "variacao_saidas_pct": 200 } }
```
**Erros:** `mes` fora do formato → 400.

## `GET /ciel/custo-horas?valor=`
**Quando usar:** "quantas horas de trabalho custa um celular de 1500?", "isso vale quantos dias de trabalho?".
Usa o salário líquido, dias por mês e horas por dia de `PUT /perfil-financeiro`.
```json
{ "ok": true, "mensagem": "Isso custa 12 horas de trabalho, umas 1,5 dias.", "dados": { "valor": 300, "horas": 12, "dias": 1.5, "valor_hora": 25 } }
```
**Erros:** perfil sem salário → 400 "Ainda não tenho seu salário líquido cadastrado..."; sem valor → 400.
