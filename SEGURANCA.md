# Segurança do ProPath Futebol

Este é um projeto pessoal e não comercial, mas registro aqui os pontos que
precisam de cuidado antes de qualquer exposição pública ou deploy.

## O que NÃO vai para o git

- `carreira.db` e quaisquer `*.db` / `*.sqlite` — banco local com saves reais,
  contas e leaderboard. Está no `.gitignore`. Nunca force o commit desse arquivo.
- `node_modules/` — dependências (reinstaláveis via `npm install`).
- `.env` — não existe hoje, mas está ignorado por precaução.

## Ponto em aberto: senhas em texto puro

`server.js` cria a tabela `accounts (id, name, pass)` e grava `pass` em texto
puro no SQLite local. Isso é aceitável **apenas** para uso em localhost por uma
pessoa só. Antes de qualquer deploy ou de liberar acesso de rede:

1. Hashear a senha (ex.: `crypto.scrypt` + salt) no cadastro e na autenticação.
2. Exigir re-auth do dono para operações sensíveis.
3. Nunca expor o `carreira.db` — ele contém as senhas hasheadas.

## Credenciais

O projeto não usa API keys, tokens de terceiros nem segredos de nuvem. O único
"segredo" é o `PORT` (opcional, via env). Nada sensível é hardcodado.
