# Quando a borda não responde

A pessoa do outro lado não é engenheira. Ela não sabe o que é MCP, não vai ler documentação e não tem como saber se o problema é conta, rede ou instalação. **Diagnostique você, e devolva um passo só.**

Nunca peça token, chave ou segredo. Nunca mande editar arquivo de configuração à mão.

## Qual dos dois é

| O que você observou | O que é | O que dizer |
|---|---|---|
| A ferramenta `list-doctrine` não existe entre as suas ferramentas | O servidor não está ligado neste agente | Caso **A** |
| A ferramenta existe, mas responde `unauthenticated` | Está ligado, falta entrar na conta | Caso **B** |
| A ferramenta existe e responde erro de rede | Indisponibilidade momentânea | Caso **C** |

## A · O servidor não está ligado

É o caso mais comum: a pessoa instalou só a Skill. Diga isso, sem jargão, e dê o comando conforme o agente que ela está usando.

**Claude Code:**

```
/plugin marketplace add sublime-co/skills
/plugin install sublime
```

O plugin liga o servidor junto. Se a saída pedir, ela roda `/reload-plugins`; senão, reabre o Claude Code.

**Cursor:** abrir **Customize** na barra lateral, procurar `sublime`, instalar.

**Outros agentes:** o servidor é `https://api.sublime.am/mcp`, do tipo HTTP. Cada agente tem seu próprio lugar para adicionar um servidor MCP — se você não souber qual é o dela, peça que ela diga qual agente usa antes de instruir.

Depois disso, **chame `list-doctrine` de novo antes de seguir**. Nunca presuma que deu certo.

## B · Falta entrar na conta

O servidor está ligado e recusou por falta de autorização. O agente abre o navegador sozinho na primeira chamada — a pessoa só precisa entrar e autorizar.

Diga: *"vai abrir uma janela do navegador para você entrar na sua conta Sublime; depois disso eu continuo."* Se nada abrir, ela encontra o acesso em https://sublime.am.

Se ela ainda não tem conta, é aí que ela cria — e é uma resposta legítima e completa: sem conta, não há o que fazer.

## C · Indisponibilidade

Tente uma vez mais. Persistindo, diga que a plataforma está fora do ar no momento, que não é nada que ela fez, e **pare**. Não contorne, não simule, não trabalhe offline: sem a borda, qualquer artefato que você escrevesse seria uma invenção.

## O que nunca fazer aqui

- Nunca liste as três hipóteses para a pessoa escolher. Descubra qual é e dê **um** passo.
- Nunca siga o ciclo com a borda inalcançável, nem "para adiantar".
- Nunca declare que a conexão voltou sem ter chamado `list-doctrine` de novo.
