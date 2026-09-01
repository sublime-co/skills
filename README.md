# sublime

Marketplace de plugins da [Sublime](https://sublime.am).

| Plugin | Versão | O que faz |
|---|---|---|
| [`sublime-agent-development`](https://sublime.am/skill) | 1.1.0 | Sublime Agent Development |

Exige o servidor MCP da Sublime conectado: `https://api.sublime.am/mcp`.

## Instalar

**Claude Code**

```bash
/plugin marketplace add sublime-co/skills
/plugin install sublime-agent-development
```

**Cursor** — abra **Customize** na barra lateral, procure `sublime-agent-development` e escolha **Install**.
Em time ou empresa, um admin adiciona este repositório em **Dashboard → Plugins → Team
Marketplaces → Add Marketplace → Import from Repo**.

## Contribuindo

**Este repositório é gerado e não aceita pull request.** Ele espelha o artefato de build a
cada release, e tudo que não vem da build é apagado na próxima — inclusive um merge feito
aqui. Um PR aberto aqui é fechado sem merge: não por desinteresse, mas porque não existe
onde ele pouse.

O canal é a **[issue](../../issues/new/choose)**, e para esta Skill ela vale mais que um
diff. A Skill é instrução, não código: o relato do que ela te fez fazer de errado — o que
você pediu, o que ela mandou, o que deveria ter acontecido — carrega o que um patch não
carrega.

A fonte vive no monorepo da Sublime, ao lado da borda MCP que a Skill opera.
É o que permite a build reprovar uma instrução que nomeia uma operação que a plataforma não
atende — um portão que não existiria se a prosa morasse longe do que ela ensina. Toda issue
aplicada chega na release seguinte, com crédito a quem relatou.
