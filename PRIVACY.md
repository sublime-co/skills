# Privacidade — Sublime

## O que esta Skill faz com dados

A Skill é **instrução**, não serviço. Ela não coleta, não armazena e não transmite nada por conta própria.

O que ela faz é orientar um assistente a operar a plataforma Sublime através do servidor MCP que o usuário conectou. Todo dado que sai da máquina do usuário sai por essa conexão autorizada, sob o consentimento OAuth que ele concedeu, e nunca por qualquer outro caminho.

## O que sai da máquina do usuário

Somente o que o usuário ou o assistente dele envia como argumento de uma operação da plataforma: nomes de agente, documentos de conhecimento, procedimentos, tabelas de decisão, cenários de avaliação e as declarações de negócio que ele mesmo escreveu.

Esses dados pertencem à organização do usuário e ficam sujeitos aos termos e à política de privacidade da plataforma Sublime.

## O que a Skill nunca faz

- **Nunca busca conteúdo de URL em tempo de execução.** As conferências que acompanham a Skill rodam inteiramente offline; a validação estrutural reprova qualquer script que contenha URL ou chamada de rede.
- **Nunca pede credencial, token ou segredo pela conversa.** A borda da plataforma devolve o nome e a identidade de um segredo, jamais o valor.
- **Nunca envia telemetria.** A Skill não tem canal próprio de saída.
- **Nunca escreve em produção.** Toda escrita cai no ambiente de preview, e a publicação exige confirmação humana colhida em superfície da própria plataforma.

## Registro

Toda chamada feita à plataforma é registrada pela própria plataforma na trilha de auditoria da organização, nomeando o usuário responsável, o assistente que agiu em nome dele, a operação e o desfecho. Esse registro pertence ao usuário e é acessível a ele; a Skill não o alcança, não o altera e não o lê.
