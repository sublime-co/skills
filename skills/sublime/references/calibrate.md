# CALIBRATE — o laço

Objetivo: o portão de qualidade aprova, ou o limite declarado se esgota com um relato honesto do que ficou.

```
medir → ler a prova → classificar a falha → UMA hipótese
  → UMA mudança → medir → comparar contra a dispersão → registrar
```

A primeira implementação não é presumida correta. O agente é um sistema que precisa ser medido, corrigido e validado empiricamente.

## Antes de abrir a primeira rodada

Diga ao usuário quantos cenários e quantas repetições vão rodar, e que cada uma gasta inferência real na conta do próprio time, no provedor dele — a medição não abre execução cobrável e não conta contra as Runs do time. Rodada seguinte do mesmo tamanho não precisa de aviso novo; mudança de tamanho precisa.

## As operações

`measure-agent` abre a rodada contra os cenários obsoletos do agente e devolve o identificador na hora, sem esperar medida. **Não existe medir um cenário só** — idempotência é frescor: a rodada pula toda prova que ainda vale e mede exatamente o que mudou. `read-round` acompanha, com espera opcional; devolve o desfecho quando a rodada termina dentro da janela, e senão o estado corrente mais o intervalo até valer a pena perguntar de novo. `compare-scenario` traz a diferença entre as duas provas mais recentes de um cenário, e se ela excede a dispersão. `list-scenarios` devolve, por cenário, a declaração e a prova mais recente.

A única parada possível é cancelar a **publicação**; não existe cancelar uma rodada em curso.

## Classificar antes de mudar

Sem classificação, a mudança é palpite. As classes abaixo são **semente**, não lista fixa: agrupe as reprovações observadas do mesmo jeito que no DISCOVER, e categoria nova que aparecer duas vezes entra na lista.

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

A última linha é a válvula de integridade. O cenário muda **exclusivamente** quando a cláusula que ele compila muda, e cláusula muda só por decisão explícita do usuário, registrada. Reescrever o cenário por `update-scenario`, ou trocá-lo por `delete-scenario` + `create-scenario`, invalida toda medida anterior daquele cenário — a Skill nunca faz isso só para uma rodada passar.

## Onde a correção cai

Ordem de preferência: **conhecimento > tabela de decisão > procedimento > instrução.**

Conhecimento e tabela são fundamentáveis e citáveis; procedimento é determinístico; instrução é o lugar menos verificável em que se pode pôr qualquer coisa.

**Falha factual nunca se corrige com instrução** — troca um erro medível por um erro invisível.

## Comparar, não impressionar

`compare-scenario` devolve, por medida, a diferença **e se ela excede a dispersão das k repetições que a sustentam**. É legível numa rodada só, porque a prova guarda as amostras uma a uma.

Diferença dentro da dispersão **não é melhora**. Registre "indistinguível de ruído", descarte a hipótese, e não a apresente ao usuário como ganho.

## Ler a transcrição, não o resumo

Quando uma reprovação não for óbvia, leia a **transcrição** da repetição que a fundamenta. É ler transcrição que separa falha real de régua mal-feita; o agregado esconde exatamente a informação de que você precisa.

## Parada

- Portão aprova → PROVE.
- Limite de rodadas ou iterações esgota → pare e relate o que melhorou, o que não melhorou e o que falta.
- O provedor de inferência falha no meio da rodada → a repetição afetada fica `unmeasured`, as demais seguem. Relate, nomeando o provedor quando a causa for credencial, e **não** converta `unmeasured` em reprovação.
- Duas iterações sem diferença conclusiva → **pare de mudar** e diagnostique. Nunca uma terceira mudança cega.

## Rodadas longas

Depois de abrir uma rodada: espere com prazo se ela couber; senão intercale trabalho que não dependa da medida; senão agende o despertar pelo `pollIntervalMs` e **encerre o turno**. Nunca encadeie esperas.

## Saída

`calibration.md` — uma linha por iteração: hipótese, a mudança única, medida antes, medida depois, veredito de ruído. É o único registro da calibração que a plataforma não deriva sozinha.
