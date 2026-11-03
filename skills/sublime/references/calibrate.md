# CALIBRATE — o laço

Objetivo: o portão de qualidade aprova e a conversa alcança o status de qualidade acordado, ou o limite declarado se esgota com um relato honesto do que ficou.

```
medir → ler a prova e a transcrição → classificar a falha → UMA hipótese
  → UMA mudança → medir → comparar contra o ruído → registrar
```

A primeira implementação não é presumida correta. O agente é um sistema que precisa ser medido, corrigido e validado empiricamente.

## Dois instrumentos

| | Portão (plataforma) | Bateria (esta Skill) |
|---|---|---|
| Unidade | um turno, a partir de um ponto | a conversa inteira, roteirizada |
| Julga | estado: procedimento, coleta, `forbidden`, `grounding`, handoff, custo | o texto e a conversa, pelos critérios de [quality.md](quality.md) |
| Decide | a publicação, sem dispensa | o status de qualidade, que o usuário aceita ou não |

Os dois rodam. Um agente com portão aprovado ainda pode perguntar o que já sabe, ignorar a dúvida para pedir o campo da etapa ou repetir a mesma abertura: só a bateria vê isso. Um defeito de estado achado na bateria (perguntou de novo um campo já coletado, abriu o procedimento errado) vira cenário do portão, para ser vigiado a cada publicação; defeito só de texto continua na bateria.

## Antes de abrir a primeira rodada

Diga ao usuário quantos cenários, quantos roteiros e quantas repetições vão rodar, e que cada um gasta inferência real na conta do próprio time, no provedor dele — a medição não abre execução cobrável e não conta contra as Runs do time. Rodada seguinte do mesmo tamanho não precisa de aviso novo; mudança de tamanho precisa.

Na primeira versão, rode portão e bateria **duas vezes** (A/A). Sem isso não existe DMD, e nenhuma comparação posterior vale.

## As operações

`run-gate` abre a rodada contra os cenários obsoletos que compõem o portão e devolve o identificador na hora, sem esperar medida; a rodada pula toda prova que ainda vale e mede exatamente o que mudou. `read-gate-round` acompanha, com espera opcional: devolve o desfecho quando a rodada termina dentro da janela, senão o estado corrente mais o intervalo até valer a pena perguntar de novo, e traz a prova de cada cenário com as amostras, o bastante para comparar duas rodadas. `run-scenario` mede **um** cenário contra a versão nomeada e devolve o desfecho na hora: é o instrumento da iteração direcionada. `list-scenarios` devolve, por cenário, a declaração e a prova mais recente.

A bateria roda por `chat-with-agent`, `read-conversation`, `list-turns` e `read-turn`, como descreve [quality.md](quality.md#8-conduzir-e-pontuar), e se pontua por `node scripts/score-battery.mjs`.

A única parada possível é cancelar a **publicação**; não existe cancelar uma rodada em curso.

## Classificar antes de mudar

Sem classificação, a mudança é palpite. As classes abaixo são **semente**, não lista fixa: agrupe as reprovações observadas do mesmo jeito que no DISCOVER, e categoria nova que aparecer duas vezes entra na lista. As classes da conversa — **Recepção**, **Medida**, **Forma** e **Fadiga** — estão em [quality.md](quality.md#classes-conversacionais), com a tabela de sintoma, causa, teste e lugar da correção.

| Classe | Sintoma na prova | Onde a correção cai |
|---|---|---|
| **Fundamento ausente** | `grounding` não atendida; afirmação sem fonte | documento / caminho na árvore |
| **Fundamento inalcançável** | A fonte existe, a navegação não chegou nela | descrição do nó, forma da árvore |
| **Regra faltante ou ambígua** | Duas repetições decidem diferente com a mesma entrada | **tabela de decisão** |
| **Ordem errada** | `procedure` em status errado; `collected` vazio | etapas e arestas |
| **Captura errada** | `collected` com valor ou tipo errado | tipo do campo, instrução da etapa |
| **Excesso** | `forbidden` violada; procedimento aberto sem motivo | instrução, portão da etapa |
| **Falta** | `reply: false`; handoff onde devia resolver | escopo das bases, entrada do procedimento |
| **Custo** | Expectativas atendidas, orçamento estourado | profundidade da árvore, tamanho da instrução, número de etapas |
| **Não é o agente** | `unmeasured` — falha do fornecedor de inferência, ou credencial ausente | nada. Remedir; se a causa for credencial, nomeie o provedor e peça para conectá-lo |
| **A régua é que está errada** | O agente agiu certo e o cenário reprovou | **a cláusula — e só pelo usuário** |

**Duas repetições que decidem diferente com a mesma entrada é quase sempre regra faltante**, não instabilidade do modelo. É a primeira hipótese a testar, porque tem correção determinística.

A última linha é a válvula de integridade. O cenário muda **exclusivamente** quando a cláusula que ele compila muda, e cláusula muda só por decisão explícita do usuário, registrada. Reescrever o cenário por `update-scenario`, ou trocá-lo por `delete-scenario` + `create-scenario`, invalida toda medida anterior daquele cenário — a Skill nunca faz isso só para uma rodada passar. A bateria segue a mesma regra: congelada antes da primeira medida, muda só com a cláusula ou o alvo.

**Prioridade:** crítica → portão reprovado → grave de Competente e Eficiente → grave de Agradável → menores por frequência.

## Onde a correção cai

```
conhecimento > tabela de decisão > procedimento > configuração (enums · modelo e esforço) > instrução
                                              + plataforma: registrar e escalar, nunca contornar
```

Conhecimento e tabela são fundamentáveis e citáveis; procedimento é determinístico; a configuração é versionada e cada enum tem critério; instrução é o lugar menos verificável em que se pode pôr qualquer coisa.

**Falha factual nunca se corrige com instrução** — troca um erro medível por um erro invisível.

**Plataforma:** quando o mesmo critério falha em agentes de domínios diferentes, ou a causa está num texto fixo da plataforma, a correção não é do agente. Corrigir por instrução agente a agente é proibido: registre o defeito com a evidência, meça quanto ele custa na nota e relate-o como limite.

**Configuração:** trocar modelo ou esforço invalida toda medida anterior, e subir de tier é custo: decisão do usuário.

**Instrução:** só depois que o teste descartou as causas estruturais, como texto positivo e condicional, pela receita de [quality.md](quality.md#6-escrever-a-voz). "Acrescentar regra contra X" nunca é a primeira hipótese.

## Comparar, não impressionar

No portão, compare as amostras das duas provas que `read-gate-round` traz: uma diferença só conta quando excede a dispersão das k repetições que a sustentam. Na bateria, `score-battery.mjs --previous` aplica a mesma regra a cada dimensão: além da DMD do A/A, com intervalo pareado que exclui zero. Crítica nova é regressão mesmo com nota maior.

Toda mudança declara de antemão a dimensão que deve subir e as que não devem mudar; a comparação confere as duas.

Diferença dentro da dispersão **não é melhora**. Registre "indistinguível de ruído", descarte a hipótese, e não a apresente ao usuário como ganho.

## Ler a transcrição, não o resumo

Quando uma reprovação não for óbvia, leia a **transcrição** da repetição que a fundamenta. É ler transcrição que separa falha real de régua mal-feita; o agregado esconde exatamente a informação de que você precisa.

## Parada

- Portão aprova e a qualidade alcança o status acordado → PROVE.
- Limite de rodadas ou iterações esgota → pare e relate o que melhorou, o que não melhorou e o que falta.
- O provedor de inferência falha no meio da rodada → a repetição afetada fica `unmeasured`, as demais seguem. Relate, nomeando o provedor quando a causa for credencial, e **não** converta `unmeasured` em reprovação.
- Duas iterações sem diferença conclusiva → **pare de mudar** e diagnostique. Nunca uma terceira mudança cega.
- Todo resíduo é de plataforma ou de modelo → pare de mudar o agente e relate o limite com a evidência.

## Rodadas longas

Uma rodada não deve prender o turno. Depois de abri-la: se couber numa ou duas janelas, espere por `read-gate-round` com o prazo e siga; senão intercale trabalho que não dependa da medida (o esqueleto do relatório, a próxima hipótese, conduzir a bateria); senão agende o próprio despertar pelo intervalo que a plataforma devolveu e **encerre o turno**. Nunca encadeie esperas, nunca mantenha o turno aberto só esperando, e nunca encerre sem o próximo despertar garantido. Se o cliente não suporta agendamento, intercale; se nem isso, peça ao usuário para retomar.

## Saída

`calibration.md` — uma linha por iteração: hipótese, a mudança única, as dimensões que deviam mudar e as que não, medida antes, medida depois, veredito de ruído. `battery.json` de cada rodada da bateria. São os únicos registros da calibração que a plataforma não deriva sozinha.
