# REDESIGN — o processo que deveria existir

Objetivo: um processo to-be que o usuário decidiu, e uma alocação de função que não despeja resíduo num humano.

Esta fase existe porque a medição não a enxerga. O portão de qualidade prova que o agente está conforme o que foi declarado; nada prova que o declarado está certo. Se um processo ruim for codificado, todo cenário passa e o negócio continua perdendo.

O trabalho descritivo acabou no DISCOVER. Esta fase é normativa — e a decisão é do usuário, não sua.

## A varredura de heurísticas

Passe o processo as-is por cada pergunta. Todo acerto vira proposta que **nomeia a heurística** e **nomeia o que paga**.

| Heurística | A pergunta |
|---|---|
| **Eliminar** | Esta etapa existe só porque um humano estava fazendo? |
| **Triagem** | Uma tarefa geral deveria virar duas alternativas — ou duas colapsar em uma? |
| **Reordenar** | Alguma decisão é tomada antes da informação que ela exige? |
| **Compor** | Três perguntas separadas que poderiam ser uma? Uma tarefa grande demais para ser confiável? |
| **Paralelizar** | O que está em série sem precisar estar? |
| **Isolar exceções** | O caminho normal está entrelaçado com o excepcional? |
| **Reduzir contato** | Estamos pedindo dado que o agente conseguiria consultar? |
| **Tecnologia integral** | Existe algo que só foi deixado de lado porque era inviável para uma pessoa? |

**Nada é grátis nas quatro dimensões.** Custo, tempo, qualidade e flexibilidade se puxam: melhorar tempo normalmente custa qualidade ou flexibilidade. Toda recomendação nomeia qual dimensão paga.

Apresente cada uma como: o problema, as alternativas, **sua recomendação**, o trade-off, e o pedido. Nunca um "o que você prefere?" em aberto.

## Alocação de função

A pior resposta possível para *"quando um humano assume?"* é **"quando o agente não conseguir"**. Isso deixa para a pessoa só os casos raros, difíceis e sem contexto — o pior desenho de trabalho que existe, e o que corrói a competência dela exatamente onde ela é mais necessária. E esconde a pergunta real, que é **que trabalho pertence a gente**.

Quatro regras:

1. Transfira **classes de trabalho**, nunca sobras.
2. Nenhuma classe transferida pode ser feita só de casos raros.
3. Mantenha a pessoa em fluxo suficiente do rotineiro para continuar calibrada nele.
4. Todo handoff carrega o contexto que o contato já deu. O humano nunca recomeça a conversa.

Isto é decisão de negócio e se fecha **aqui**, não no MODEL.

## Três saídas

**A fronteira** — do que o agente é responsável, e o que ele explicitamente não faz.

**O contrato de comportamento** — cláusulas numeradas, em linguagem de negócio, cada uma verificável por quem não estava lá. Uma cláusula boa passa no teste de dois julgadores: duas pessoas que conhecem o domínio chegariam ao mesmo veredito sobre se ela foi cumprida. Cláusula que não passa nesse teste volta para o DISCOVER.

**As tabelas de decisão** — toda escolha que o negócio já sabe fazer, escrita como tabela. Rascunhe aqui; a verificação é no MODEL. Forma canônica:

```markdown
# Decision: taxa de entrega

- input: regiao = capital | interior
- input: peso = ate-5kg | acima-5kg
- output: taxa

| regiao   | peso      | taxa |
| ---      | ---       | ---  |
| capital  | ate-5kg   | 15   |
| capital  | acima-5kg | 25   |
| interior | *         | 40   |
```

`*` casa com qualquer valor daquela entrada. Toda entrada declara um domínio fechado. O `check-rules.mjs` verifica a tabela; ver model.md.

## Encene antes de escrever

Quando a mudança de processo for relevante, **encene**. Você faz o papel do agente, o usuário faz o papel do contato, e vocês rodam o processo to-be para um ou dois casos realistas ali na conversa.

Custa alguns turnos e é a única resposta honesta a *"como você sabe que o processo novo funciona?"*. Falhar aqui é de graça; falhar depois de construído, não.

## Termina quando

O usuário decidiu o processo e a alocação, toda mudança está registrada com a heurística que a motivou e a dimensão que pagou, e as cláusulas passam no teste dos dois julgadores.

## Saída

`process.md` — o processo to-be, a alocação de função, e por mudança: a heurística, o trade-off, e **quem decidiu**.
`contract.md` — as cláusulas numeradas.
Rascunho das tabelas de decisão.
