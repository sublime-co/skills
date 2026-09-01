# MODEL — o agente

Objetivo: o processo to-be expresso em artefatos que a plataforma entende, com os dois portões de desenho passando.

## Antes da primeira decisão de modelagem

Chame `list-doctrine` e `read-doctrine`. **Toda sessão.** Esta Skill envelhece na máquina do usuário; a doutrina da plataforma não. Nunca cacheie doutrina entre sessões.

## Quatro testes

Aplique a cada cláusula do contrato e a cada passo do processo to-be.

1. **É fato?** *"Se o agente afirmasse isso sem fonte, seria mentira?"* → **documento de conhecimento**, num caminho.
2. **É ordem?** *"Fazer em outra ordem estaria errado, ou algo precisa ser capturado antes de outra coisa acontecer?"* → **procedimento**, com etapas e arestas.
3. **É decisão?** *"O negócio já sabe a resposta para toda combinação de entradas?"* → **tabela de decisão**, documento em forma canônica, dentro da base que o agente consulta.
4. **É postura?** *"Vale em todo turno, independente do que o contato disse?"* → **instrução**.

Cláusula que falha nos quatro **ainda não é requisito**. Volte para o DISCOVER.

## Três leis negativas

- **Fato nunca vira instrução.** Instrução não é citável, e o que não é citável não é medível por `grounding` — some da régua e volta como invenção.
- **Política nunca vira procedimento.** Um trilho para o que não tem sequência faz todo turno pagar por um trilho de que não precisava.
- **Decisão nunca vira julgamento.** Se o negócio tem regra, o agente **lê** a regra.

Tabelas de decisão moram na base **vinculada** ao agente, não no registro de desenvolvimento. Elas são conhecimento que o agente fundamenta: citáveis por `grounding`, e cada linha é testável.

## A forma do conhecimento

A forma da árvore é a principal alavanca de custo. Profundidade e descrição de nó decidem quantas voltas o agente queima antes de achar o que precisa.

- Escreva a descrição de um nó como **instrução de roteamento**, não como título. É tudo que uma descida pela árvore tem para se guiar.
- **Nó sem descrição é nó que ninguém encontra.**
- Prefira árvore rasa com ramos bem nomeados a árvore funda com ramos genéricos.
- Caminhos precisam ser adivinháveis. Se um modelo não adivinharia o caminho, o agente sob carga também não.

## Portão 1 — completude das regras

Determinístico. Rode; não reproduza lendo.

```bash
node scripts/check-rules.mjs <arquivo.md>
```

Para cada tabela de decisão:

- toda combinação de valores de entrada declarados é coberta por **exatamente uma** regra;
- nenhuma dupla de regras se sobrepõe;
- nenhuma regra cita valor fora de um domínio declarado.

**Regra faltante é reprovação de desenho, não achado de calibração.** Combinação sem cobertura é uma pergunta que o negócio nunca respondeu, e o agente vai respondê-la inventando. Achar aqui custa uma pergunta. Achar depois custa uma rodada e uma conversa perdida.

## Portão 2 — desenho

Seis conferências. Reprovar devolve você para dentro desta fase.

1. Toda cláusula do contrato mapeia para ao menos um artefato.
2. Toda decisão do processo to-be tem tabela.
3. Todo documento é alcançável por um caminho que um modelo adivinharia.
4. Todo procedimento tem uma entrada e nenhuma etapa órfã.
5. Todo campo coletado tem tipo declarado e um lugar onde é usado.
6. A fronteira de handoff bate com a alocação decidida no REDESIGN, e nada secreto está onde a borda consiga ler de volta.

## Termina quando

Os dois portões passam.

## Saída

`blueprint.md` — bases e árvore, tabelas de decisão, procedimentos e etapas, instruções, vínculos, fronteira de handoff, orçamento-alvo. Denso, sem justificativa; justificativa mora em `decisions.md`.
