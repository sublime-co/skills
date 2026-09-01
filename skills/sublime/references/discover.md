# DISCOVER — como o trabalho acontece de verdade

Objetivo: casos concretos suficientes para generalizar o processo com segurança, e uma lista contada das formas como ele falha hoje.

Você não está levantando requisitos. Está reconstruindo um processo que vive nas mãos de alguém — e essa pessoa nunca o descreveu em abstrato.

## Três obstáculos, e o movimento contra cada um

| Obstáculo | Como aparece | Seu movimento |
|---|---|---|
| **Conhecimento fragmentado** | O dono, o vendedor e a atendente descrevem processos diferentes | Colha separado. **Reconcilie em voz alta.** Divergência é achado, não ruído — quase sempre marca uma decisão não declarada |
| **Pensar em casos** | *"Cada cliente é diferente"*, *"nunca dá pra fazer exatamente igual"* | **Não lute contra.** Colha 3–5 casos concretos e generalize você. Nunca peça a regra geral direto |
| **Não conhecer notação** | Não lê fluxograma, e vai concordar com um modelo que não entendeu | Devolva **narrativa** e **tabela**. Nunca um grafo |

## Passada 1 — o enquadramento

No máximo seis perguntas, no idioma dele.

1. O que o negócio faz, e quem está do outro lado dessas conversas?
2. Como é uma conversa bem resolvida — o que de fato aconteceu quando ela termina?
3. O que nunca pode acontecer?
4. O que acontece hoje quando quem atende não dá conta?
5. Mais ou menos quantas por dia, e em quanto tempo o outro lado espera resposta?
6. Tem alguma coisa sobre custo ou esforço por conversa que importe para você?

## Passada 2 — a caminhada por casos

**Peça uma transcrição real antes de qualquer outra coisa.** Uma conversa salva de WhatsApp, uma troca de e-mails, uma anotação de ligação. É o insumo de maior rendimento do método inteiro e não custa nada ao usuário.

Depois, percorra 3–5 casos **concretos**, do mais recente para trás. Nunca *"como funciona"*; sempre *"me conta o do João, semana passada"*. Siga ponta a ponta: o que chegou, o que foi conferido, o que foi perguntado, o que foi decidido, o que foi enviado, como terminou.

**Onde um caso revelar uma decisão, sonde — três perguntas, nesta ordem:**

> O que você percebeu ali? · O que um funcionário novo não teria notado? · **O que teria de ser diferente para você decidir o contrário?**

A terceira é a que produz uma tabela de decisão, porque é a única que faz alguém enunciar a **fronteira** em vez do exemplo. Volte à mesma decisão em dois ou três casos; a fronteira afia a cada volta.

## Passada 3 — a caminhada por falhas

> *"Me conta as últimas cinco vezes em que isso deu errado."*

Isto é análise de erro retrospectiva sobre um processo executado por gente, e roda por protocolo:

1. Para cada caso, anote em palavras simples o que deu errado — **só a primeira falha**. Erro a montante causa erro a jusante, e contar os dois conta uma causa só em dobro.
2. Agrupe as anotações em **categorias nomeadas** e **conte** cada uma.
3. Pare na **saturação**: quando casos novos param de abrir categoria nova.

As contagens não são enfeite. São a entrada de **ocorrência** que decide cobertura e `k` no BUILD.

## Conferência de completude

A entrevista é humana; esta conferência é mecânica. O que você generalizou precisa responder as nove, ou carregar uma premissa declarada que o usuário possa vetar.

| Classe | Fica sem resposta se… |
|---|---|
| O que é verdade, e onde vive | Ninguém disse de onde vem a informação que o agente vai afirmar |
| O que tem ordem inegociável | A sequência nunca foi percorrida ponta a ponta |
| O que precisa ser capturado, e de que tipo | O campo foi nomeado mas o tipo não |
| **Que decisões o negócio toma** | Uma escolha apareceu num caso e virou *"depende"* |
| O que nunca pode acontecer | Só há proibição genérica, sem ato nomeado |
| O que precisa ser citado | Uma afirmação sensível não tem fonte declarada |
| Quando um humano assume | A resposta foi *"quando o agente não conseguir"* — isso não é resposta, é trabalho do REDESIGN |
| O que é conversa resolvida | Não há desfecho nomeado |
| Quanto pode custar, e quanta certeza o erro exige | Não há teto nem consequência declarada |

## Termina quando

Há casos concretos suficientes para generalizar com segurança, as nove classes estão cobertas ou cobertas por premissa vetável, e a lista de falhas saturou.

Não *"toda incerteza respondida"* — essa formulação vira questionário e esgota o usuário antes da parte útil.

## Saída

`brief.md` no registro de desenvolvimento: o negócio, o público, os sistemas, as restrições; o **processo as-is narrado**; o registro dos casos; e a **lista de falhas com contagem**.
