# O relatório

O que o usuário recebe — e, no caso de uma agência, o que ela entrega ao cliente dela. Responde uma pergunta:

> **Por que podemos confiar que este agente está pronto para produção?**

**Todo número vem do dossiê; nenhum vem da sua memória da sessão.** A plataforma entrega o insumo; você
preenche o molde abaixo. Não é um roteiro a interpretar: é um documento a copiar e completar.

Dois scripts fecham o ciclo. O primeiro recusa o que não obedecer ao molde; o segundo transforma o molde
no painel que o cliente abre. **O painel nunca se escreve à mão** — página escrita à mão desvia, e duas
entregas deixam de parecer a mesma prática.

```
node scripts/check-report.mjs <report.md> <dossier.json>
node scripts/build-panel.mjs  <report.md> > panel.html
```

Nesta ordem, sempre. O gerador renderiza o que recebe e não confere nada: relatório reprovado vira painel
bonito e errado.

---

## O molde

Copie daqui até o fim do bloco. Substitua tudo entre `{}`. Não renomeie cabeçalho, não reordene seção, não
apague linha — uma medida que não se aplica se escreve `não medido`, nunca se omite.

````markdown
# {Agente} — prova

{Cliente} · {o que o agente faz, em quatro ou cinco palavras}

{Uma ou duas frases: o que foi conduzido, e a garantia de que tudo abaixo foi medido.}

| Medição | Modelo | Agente | Versão |
|---|---|---|---|
| {data} | {modelo} | {agenteId} | {versão} |

## Painel

| Medida | Absoluto | Percentual |
|---|---|---|
| Verificações aprovadas | {atendidas}/{declaradas} | {p}% |
| Conversas concluídas | {concluídas}/{conduzidas} | {p}% |
| Respostas com desfecho | {comDesfecho}/{turnos} | {p}% |
| Repetições idênticas | {idênticas}/{repetições} | {p}% |
| Aproveitamento de cache | {cacheRead}/{inputTokens} | {p}% |

| Medida | Valor |
|---|---|
| Custo total | US$ {usd} |
| Custo por conversa | US$ {mediana} mediana · US$ {média} média |
| Custo por resposta | US$ {porTurno} |
| Latência por conversa | {s} s |
| Latência por resposta | {s} s |
| Economia por conversa | {p}% · US$ {antes} → US$ {depois} |
| Verificações por dólar | {razão} |
| Volume | {conversas} conversas · {turnos} respostas · {inferências} consultas |

**Desfechos.** {resolvidos} resolvidos pelo agente · {entregues} entregues a uma pessoa, por desenho ·
{falhas} falhas.

**Tokens.** servido do cache {cacheRead} · lido do zero {entradaFresca} · saída {saída} · raciocínio {raciocínio}.

**Premissas do painel.** {Cada entrada não medida que produziu um número acima — cotação de moeda, turnos
por conversa. Uma linha cada, com a palavra premissa.}

## 1. Responsabilidade e fronteira

{O que faz. O que não faz. Onde termina e quem assume.}

## 2. O processo

{O processo que o agente executa. O que mudou sobre o atual, que heurística motivou, quem decidiu.}

## 3. Alocação de função

| Etapa | Quem | Por quê |
|---|---|---|
| {etapa} | {agente ou humano} | {razão} |

## 4. Como funciona

{Bases, tabelas de decisão e procedimentos. A árvore da base e o que cada nó responde.}

## 5. Decisões formalizadas

{As tabelas de decisão, e por que estão completas: quantas combinações existem, quantas regras as
particionam, e que nenhuma tem duas respostas nem fica sem resposta.}

## 6. O que "correto" significa

| # | Cláusula |
|---|---|
| C{n} | {a cláusula, compilável em cenário} |

## 7. Premissas

{Toda inferência que o usuário não vetou, uma por linha. Inclui as premissas do painel.}

## 8. Decisões do projeto

| Decisão | Quem | Quando |
|---|---|---|
| {decisão} | {usuário ou Assistant} | {data} |

## 9. O que foi medido

| Cenário | Cláusula | k | Verificações | Acerto | Inferências obs./teto | Voltas obs./teto | Estado |
|---|---|---|---|---|---|---|---|
| {nome} | C{n} | {k} | {atendidas}/{declaradas} | {p}% | {obs}/{teto} | {obs}/{teto} | {passou ou falhou} |

{As cláusulas sem cenário, nomeadas uma a uma. Se todas tiverem, escreva que todas têm.}

## 10. Competência

{Atendidas sobre declaradas, absoluto e percentual. `pass^k` nomeado para cada cenário que qualifica
frequência, e dito explicitamente quais rodaram a k=1 e portanto não qualificam nenhuma.}

## 11. Confiabilidade

| Medida | Mediana | Amplitude | % da mediana |
|---|---|---|---|
| {medida} | {valor} | {valor} | {p}% |

{A régua de ruído que esta dispersão estabelece: diferença menor que ela é ruído, não ganho.}

## 12. Custo

{Trabalho observado contra o orçamento declarado, em inferências e voltas — é isso que o portão julga. O
micro-USD entra ao lado, nomeado como o que a medição gastou na conta do time, no provedor dele: evidência,
nunca critério de aprovação.}

## 13. Latência

{Observada. Diga sob que condução foi medida e o que ela mede por causa disso. Evidência, jamais critério.}

## 14. Falhas e correções

| Defeito observado | Correção | Veredito |
|---|---|---|
| {defeito} | {correção} | {ganho real, corrigido, rejeitado ou ruído} |

{Diferença dentro da dispersão da seção 11 entra aqui como ruído, e em nenhum outro lugar como melhoria.}

## 15. Limites e riscos

- **Um cenário é um turno.** Comportamento que só emerge ao longo de uma conversa está coberto apenas onde
  um cenário cita um turno real de origem.
- **A qualidade do processo não foi medida.** A evidência prova conformidade com o processo declarado; não
  prova que esse é o melhor processo. A mudança de processo aparece como decisão registrada, nunca como
  ganho medido.
- {O que for específico deste agente: cláusula com um cenário só, cenário a k=1, área do negócio que ninguém
  citou, conhecimento que envelhece, defeito conhecido ainda aberto.}

## 16. Veredito

| Item | Estado |
|---|---|
| Portão de qualidade | {PASS, SKIPPED ou BLOCKED} |
| Submissão | {PASS, SKIPPED ou BLOCKED} |
| Versão publicada | {versão ou nenhuma} |

**Provado.**

- {O que a medição sustenta, uma linha cada.}

**Falta.**

- {O que ainda não tem evidência, e o que impede soltar sem observação.}

{A recomendação, em uma linha, com o estado do portão dentro dela.}
````

---

## As sete leis

O que o script não consegue conferir sozinho.

**1 · Absoluto e percentual andam juntos.** `78/78` convence, `100%` informa. Sozinho, um esconde a escala e
o outro esconde a completude.

**2 · A unidade é nomeada com exatidão, e nunca é promovida.** Seis conversas que produziram 25 respostas e
78 verificações são três números com três nomes. Chamar 78 de "conversas" multiplica o volume por treze — e é
o número que o cliente repete numa reunião e perde. Número pequeno demais se resolve medindo mais, jamais
renomeando a unidade.

**3 · Desfecho projetado não é falha.** Uma transferência que o processo prevê é o processo funcionando, e se
apresenta assim. Contá-la como erro ensina o cliente a desconfiar do que deu certo.

**4 · Premissa aparece ao lado do número que ela produz.** Cotação, turnos por conversa, qualquer entrada não
medida. Sem isso o número parece medido.

**5 · A seção 15 tem o mesmo peso das outras.** Relatório que esconde o que falta vende bem uma vez e queima
a relação na primeira conversa que der errado.

**6 · `PASS`, `SKIPPED` e `BLOCKED` são três resultados.** Aprovado, sem o que julgar, recusado. Nenhum se
veste do outro. Sem prova no portão, a recomendação é piloto observado, nunca "pronto para produção".

**7 · Sem adjetivo de venda.** O documento é inspecionado por quem não participou; entusiasmo lido por essa
pessoa vira suspeita.

## O que o script recusa

- seção do molde ausente, ou medida obrigatória ausente do painel;
- veredito sem as duas listas, `Provado` e `Falta` — a segunda tem o mesmo peso da primeira;
- linha do painel com absoluto sem percentual, ou percentual sem absoluto;
- número afirmado nas seções 9 a 13 ou 16 que o dossiê não contém;
- cenário do dossiê ausente da seção 9, ou presente sem nomear seu `k`;
- veredito que não seja `PASS`, `SKIPPED` ou `BLOCKED`;
- valor em moeda local sem a premissa de cotação declarada.
