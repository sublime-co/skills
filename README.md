# Sublime Agent Development

[![npm version](https://img.shields.io/npm/v/@sublime.am/skill.svg)](https://www.npmjs.com/package/@sublime.am/skill)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Descreva o processo do seu negócio. Receba um agente que o executa — medido, calibrado e com evidência auditável.**

Uma Agent Skill para Claude Code, Cursor, Codex, Copilot, Gemini CLI, Windsurf, OpenCode e dezenas de outros agentes de código. Ela não escreve prompts avulsos: conduz um método para **descobrir, redesenhar, modelar, construir, calibrar e provar** um agente procedural — julgando o processo antes de automatizá-lo e definindo o que significa “correto” antes de medir seu comportamento.

## Instalar

```bash
npx @sublime.am/skill
```

Detecta os agentes instalados na máquina e **pergunta em quais instalar** — nada é escrito num harness que você não escolheu. Enter aceita todos. **Reinicie o agente depois**, porque Skills são carregadas na inicialização.

Para pular a pergunta:

```bash
npx @sublime.am/skill --all                 todos os encontrados
npx @sublime.am/skill --agent claude-code   só os que você nomear
```

O padrão instala **para o seu usuário**, valendo em todos os projetos:

| Agente | Onde fica |
| --- | --- |
| Claude Code | `~/.claude/skills/sublime` |
| Cursor | `~/.cursor/skills/sublime` |
| Codex | `~/.agents/skills/sublime` |
| Copilot · Gemini CLI · Windsurf · Antigravity · OpenCode | o diretório de skills de cada um |

### No projeto, para o time inteiro

```bash
npx @sublime.am/skill --project
```

Escreve a Skill **dentro do repositório atual**, na convenção que cada agente lê em projeto — `.claude/skills/sublime` para o Claude Code, `.github/skills/sublime` para o Copilot, `.windsurf/skills/sublime` para o Windsurf.

Commite o diretório. A partir daí, todo mundo que clonar o repositório recebe a Skill junto, sem instalar nada — e ela fica versionada com o código a que serve.

**Atenção ao escopo no Claude Code:** quando a mesma Skill existe nos dois lugares, **a do usuário vence a do projeto**. Quem já instalou no `~` continua rodando a versão dele mesmo depois de clonar o repositório. Para o time inteiro rodar a mesma versão, cada um remove a pessoal:

```bash
npx @sublime.am/skill --uninstall
```

Em monorepo, um `.claude/skills/` dentro de um pacote também é carregado quando o Claude toca arquivos daquele pacote — dá para deixar a Skill perto do código a que ela serve, em vez de na raiz.

### Marketplace — Skill e MCP no mesmo ato

O caminho recomendado para quem ainda não tem a borda configurada, porque instala a Skill **e** conecta o servidor MCP de uma vez.

**Claude Code:**

```bash
/plugin marketplace add sublime-co/skills
/plugin install sublime
```

O instalador pergunta o escopo — **user** para todos os seus projetos, **project** para todos os colaboradores deste repositório, **local** só para você aqui. Se a saída pedir, rode `/reload-plugins`.

**Cursor:** abra **Customize** na barra lateral e procure `sublime`. Em equipe, um administrador importa este repositório em **Dashboard → Plugins → Team Marketplaces → Import from Repo**.

### Outras formas

Pelo CLI do ecossistema, se você já usa:

```bash
npx skills add sublime-co/skills
```

Vários agentes de uma vez, ou removendo:

```bash
npx @sublime.am/skill --agent cursor,codex
npx @sublime.am/skill --uninstall
```

> **Requer o servidor MCP da Sublime conectado:** `https://api.sublime.am/mcp`. A Skill não trabalha sem uma borda alcançável e informa o que está faltando. Crie sua conta em [Sublime](https://sublime.am).

## O que ela faz

Um agente não é um prompt. Ele é a **composição de um processo**.

Automatizar um processo ruim apenas torna seus erros sistemáticos. Por isso, a Skill julga o processo antes de codificá-lo, declara o contrato de correção antes de observar o comportamento e só publica quando há evidência suficiente para passar pelo portão de qualidade.

```text
DISCOVER → REDESIGN → MODEL → BUILD → CALIBRATE → PROVE
```

| Fase          | O que acontece                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Discover**  | Descobre como o trabalho acontece de verdade, a partir de casos concretos — não da versão idealizada.                               |
| **Redesign**  | Define como o processo deveria funcionar. **Você decide**, com as consequências em dinheiro, risco e tempo.                         |
| **Model**     | Transforma o processo em conhecimento, procedimentos e tabelas de decisão. Regras decididas viram consultas, não apostas do modelo. |
| **Build**     | Constrói os artefatos em preview e compila a régua antes de qualquer medição.                                                       |
| **Calibrate** | Mede iterativamente: uma mudança por rodada. Diferença dentro da dispersão não é ganho.                                             |
| **Prove**     | Reúne evidência, reconcilia o relatório, passa pelo portão e publica.                                                               |

Tudo que a Skill escreve é feito em **preview** e permanece reversível. **Publicação é um ato separado** e só ocorre depois da aprovação do portão de qualidade.

## Mantendo atualizada

O Claude Code atualiza plugins automaticamente, mas **marketplaces de terceiros vêm com a atualização automática desativada**. Para habilitá-la:

```text
/plugin → Marketplaces → sublime → Enable auto-update
```

Sem isso, você permanece na versão instalada. Para atualizar imediatamente:

```bash
claude plugin update sublime@sublime
```

Se instalou via `npx`, execute novamente:

```bash
npx @sublime.am/skill
```

## Reportar um defeito

**Este repositório é gerado e não aceita pull requests.**

Use uma **[issue](../../issues/new)**. Para uma Skill, o relato comportamental é mais útil que um diff: descreva **o que você pediu, o que a Skill fez, o que deveria ter feito e, quando possível, qual evidência demonstrou o desvio**.

Issues incorporadas à Skill chegam às releases seguintes, com crédito ao autor do relato.

---

`sublime` v2.0.2 · [Sublime](https://sublime.am) · [privacidade](PRIVACY.md) · licença [MIT](LICENSE)
