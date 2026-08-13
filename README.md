# ProPath Futebol

Modo carreira de jogador estilo FIFA, jogado no navegador. Times reais, ligas
brasileiras (Série A, Série B, Varzea) e partidas **simuladas** (não é um jogo
arcade de controle — a simulação roda no backend e vira crônica/jogos).

Projeto **pessoal / não comercial**.

## Como rodar

```bash
npm install
PORT=4321 node server.js
```

Abra `http://localhost:4321` no navegador.

## Estrutura

- `index.html` / `styles.css` — front-end
- `data.js` — times, ligas e dados reais
- `engine.js` — simulação de partidas e progressão
- `ui.js` / `main.js` — render e fluxo de carreira
- `server.js` — backend Node + Express + SQLite (node:sqlite) que persiste saves

## Segurança

Veja `SEGURANCA.md`. Em resumo: o banco local (`carreira.db`) **não** é
versionado. O servidor local armazena senhas de conta em texto puro no SQLite
— só rode em localhost; antes de qualquer deploy, troque por hash + re-auth.

## Verificar publicação

O repositório NÃO deve conter `carreira.db`, `node_modules/` ou `.env`.
Use `git check-ignore carreira.db node_modules` para confirmar.
