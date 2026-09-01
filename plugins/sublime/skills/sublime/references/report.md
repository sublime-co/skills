# O relatório

O relatório é o que o usuário recebe — e, no caso de uma agência, o que ela entrega ao cliente dela. Ele precisa responder, sem ambiguidade, uma pergunta só:

> **Por que podemos confiar que este agente está pronto para produção?**

A plataforma entrega o insumo confiável. Você escreve o documento. **Todo número vem do dossiê; nenhum vem da sua memória da sessão.**

Markdown, com estas seções, nestes nomes. O `check-report.mjs` confere que existem e que os números batem.

| # | Seção | Responde | Fonte |
|---|---|---|---|
| 1 | Responsabilidade e fronteira | O que faz, e o que **não** faz | `brief.md`, `process.md` |
| 2 | O processo | Qual processo o agente executa, o que mudou do atual, que heurística motivou, **quem decidiu** | `process.md` |
| 3 | Alocação de função | O que é do agente, o que é do humano, e por quê | `process.md` |
| 4 | Como funciona | Bases, tabelas, procedimentos | dossiê |
| 5 | Decisões formalizadas | As tabelas, e a prova de que estão completas | tabelas + portão 1 |
| 6 | O que "correto" significa | As cláusulas numeradas | `contract.md` |
| 7 | Premissas | Toda inferência que o usuário não vetou | `decisions.md` |
| 8 | Decisões do projeto | Quem decidiu o quê, quando | `decisions.md` |
| 9 | O que foi medido | Cláusula ou regra · k · expectativas · orçamento · resultado | dossiê |
| 10 | Competência | Atendidas/total, com **pass^k nomeado** | dossiê |
| 11 | Confiabilidade | Dispersão entre as k repetições, por medida | amostras da prova |
| 12 | Custo | Trabalho — inferências e voltas, observado contra o orçamento declarado, com dispersão — e o custo real em micro-USD ao lado | dossiê |
| 13 | Latência | Observada — **evidência, não critério, medida sob paralelismo** | dossiê |
| 14 | Falhas e correções | Iterações, o que excedeu o ruído e o que não | `calibration.md` |
| 15 | Limites e riscos | Não atendidas, não medidos, cobertura magra, e **o que a medida não enxerga** | dossiê + Submissão |
| 16 | Veredito | Portão + Submissão, versão, data | dossiê |

## As seções que fazem o documento ser crível

**12 · Custo.** O orçamento declarado é julgado em inferências e voltas — é isso que o portão aprova ou reprova. O micro-USD entra ao lado, sempre nomeado como o que a medição gastou na conta do time, no provedor dele — **evidência, nunca critério de aprovação**.

**13 · Latência.** Diga que foi medida sob execução paralela e que por isso ela mede a carga da plataforma, não o desenho do agente. Apresente como evidência, jamais como critério aprovado.

**15 · Limites e riscos.** Duas limitações são permanentes e **têm de estar escritas**:

- **Um cenário é um turno.** Comportamento que só emerge ao longo de uma conversa está coberto apenas onde um cenário cita um turno real de origem.
- **A qualidade do processo não foi medida.** A evidência prova conformidade com o processo declarado; ela não prova que esse é o melhor processo. A mudança de processo aparece como decisão registrada, nunca como ganho medido.

Acrescente o que for específico deste agente: cláusula com um cenário só, área do negócio que ninguém citou, conhecimento que envelhece.

## Regras de redação

- **Nenhum número sem fonte no dossiê.** Se você quer afirmar custo por conversa, precisa de uma premissa de turnos por conversa — declare-a como premissa na seção 7, porque a plataforma mede turno, não conversa.
- **`k` nomeado por cenário.** Uma medida a `k=1` apresentada como se qualificasse frequência é evidência falsa.
- **Diferença dentro do ruído se declara como ruído**, na seção 14, e nunca como melhoria.
- Sem adjetivo de venda. O documento é inspecionado por quem não participou; entusiasmo lido por essa pessoa vira suspeita.
