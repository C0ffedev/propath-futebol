# Segurança do ProPath Futebol

Este é um projeto pessoal e não comercial, mas registro aqui os pontos que
precisam de cuidado antes de qualquer exposição pública ou deploy.

## O que NÃO vai para o git

- `carreira.db` e quaisquer `*.db` / `*.sqlite` — banco local com saves reais,
  contas e leaderboard. Está no `.gitignore`. Nunca force o commit desse arquivo.
- `node_modules/` — dependências (reinstaláveis via `npm install`).
- `.env` — não existe hoje, mas está ignorado por precaução.

## Senhas (hash scrypt + salt)

As senhas de conta NÃO são mais gravadas em texto puro. O cadastro
(`POST /api/account`) aplica `crypto.scryptSync(pass, salt, 64)` com salt de 16
bytes e armazena `salt:hash` hexadecimal. A autenticação (`POST /api/login`)
recomputa o hash e compara com `crypto.timingSafeEqual` (resistente a timing
attack). Nunca há comparação de plaintext nem retorno da senha na resposta.

Antes de liberar acesso de rede:
1. Exigir re-auth do dono para operações sensíveis.
2. Nunca expor o `carreira.db` — ele contém os hashes (mesmo hasheados, trate
   como dado sensível).

## Credenciais

O projeto não usa API keys, tokens de terceiros nem segredos de nuvem. O único
"segredo" é o `PORT` (opcional, via env). Nada sensível é hardcodado.
