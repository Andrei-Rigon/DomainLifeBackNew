# Perfil financeiro — `/perfil-financeiro` e `/custo-horas`

Registro único com os dados para calcular o custo de uma compra em tempo de trabalho.

| Rota | Descrição |
| --- | --- |
| `GET /perfil-financeiro` | Perfil salvo, ou os padrões (22 dias, 8 h/dia, sem salário, saldo inicial 0) |
| `PUT /perfil-financeiro` | Cria na primeira vez e atualiza depois |
| `GET /custo-horas?valor=1500` | Quantas horas/dias de trabalho esse valor custa |

Campos: `salario_liquido`, `saldo_inicial` (quanto já havia ao começar; pode ser negativo; padrão 0; entra em `/financeiro/saldo`), `dias_trabalhados_mes` (1–31, padrão 22), `horas_por_dia` (padrão 8).

Conta: `valor_hora = salario_liquido / (dias_trabalhados_mes * horas_por_dia)`; `horas = valor / valor_hora`; `dias = horas / horas_por_dia`.
Resposta: `{ valor, valor_hora, horas, dias, horas_por_dia }`. Sem salário cadastrado → 400.
