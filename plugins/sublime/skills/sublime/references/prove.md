# PROVE — a porta de produção

Objetivo: dois portões aprovados, um relatório que valida, e a versão do agente publicada.

## Dois portões, duas perguntas diferentes

**Você não julga comportamento.** A plataforma emite PASS/FAIL sobre competência (expectativas declaradas) e custo (orçamento declarado). Latência é evidência, nunca critério — sob execução paralela ela mede a carga da plataforma, não o desenho do agente.

O que você acrescenta é outra pergunta: **a pergunta feita ao portão estava completa?** Um PASS sobre uma suíte magra é afirmação verdadeira sobre uma pergunta fraca.

```
Portão      (plataforma)   o agente se comporta como foi declarado?
Submissão   (esta Skill)   o que foi declarado cobre o que o negócio pediu?
```

## Montar o dossiê

`dossier.json` não é um artefato da plataforma — você o monta a partir de `list-scenarios` (a declaração e a prova mais recente de cada cenário: repetições declaradas e medidas, expectativas não atendidas, trabalho e custo real de cada repetição, transcrição da reprovação, e se a prova ainda vale para o rascunho) e do resultado da tentativa de publicação. O campo `fresh` que a Conferência de Submissão exige é `freshness.status === 'fresh'` de `list-scenarios` — mapeie-o ao montar o dossiê.

## A Conferência de Submissão

Determinística. Rode:

```bash
node scripts/check-submission.mjs <dossier.json>
```

As oito primeiras conferências; a nona roda no `check-report.mjs`:

1. Toda cláusula do contrato tem ≥1 cenário.
2. Toda linha de tabela de decisão tem ≥1 cenário.
3. A varredura de desvios está completa — cada ação × cada classe, declarada ou dispensada com razão.
4. Nenhum cenário medido a `k=1`.
5. Nenhum cenário `unmeasured` na rodada que produziu o veredito.
6. Toda prova está fresca para a versão em publicação.
7. Cada classe de trabalho alocada ao humano tem cenário de handoff.
8. Toda cláusula de `forbidden` e de `grounding` aparece em algum cenário.
9. Todo número do relatório existe no dossiê.

Apresente ao usuário em duas linhas:

```
Portão      PASS   47/47 expectativas · orçamento dentro do declarado · k=5..10
Submissão   PASS   19/19 cláusulas · 34/34 regras · varredura 36/36 · 0 não medidos
```

**Publicar exige as duas.**

## Portão reprovado

Se o portão reprova, a plataforma recusa a publicação nomeando o critério e a medida observada, **sem exceção**. Não existe dispensa: quem não quer que um cenário componha o portão o desmarca **antes** de abrir a rodada, nunca depois de reprovar.

## O relatório

Produza-o pelo modelo em [report.md](report.md), e valide:

```bash
node scripts/check-report.mjs <report.md> <dossier.json>
```

Ele confere que as seções obrigatórias existem e que todo número declarado corresponde ao dossiê. Número divergente é reprovação: o relatório é o artefato que um terceiro vai inspecionar, e um número que não bate destrói a credibilidade dos que batem.

## Publicação

**Só publicar a versão do agente é irreversível.** O vínculo pina a versão de cada base e de cada procedimento; publicar uma delas não move nenhum agente já no ar. Publique-as livremente antes de publicar o agente.

Publicar o agente executa na chamada: a plataforma recebe o pedido, conduz o portão de qualidade por conta dela e publica se ele aprovar. A chamada não espera esse desfecho — `list-agent-deployments` é onde você lê como foi.

**Publique só depois que o portão aprovou na calibragem.** O ciclo termina na versão publicada; quem quiser conversar com ela entra na plataforma.

## Termina quando

Portão e Submissão aprovam, o relatório valida, e a versão está publicada.
