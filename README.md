# ProPath Futebol

Modo carreira de jogador estilo FIFA, jogado no navegador. Times reais, ligas
brasileiras (Séries A, B, C e D, além da Várzea) e partidas **simuladas** (não é um jogo
arcade de controle — a simulação roda no backend e vira crônica/jogos).

## Competições e acesso

- Série A e B: 20 clubes e 38 rodadas. A tem quatro rebaixados; a B tem G2 direto, playoffs entre 3º–6º e 4º–5º, e quatro rebaixados.
- Série C: 20 clubes, turno único, oito classificados aos quadrangulares, quatro acessos e dois rebaixamentos.
- Série D: os 96 clubes e 16 grupos de 2026; o save simula o grupo regional e o caminho do clube no mata-mata, incluindo os dois acessos por playoff.
- Copa do Brasil: entrada da Série A na quinta fase, confrontos de ida e volta até a semifinal, final única e pênaltis sem gol qualificado.
- Libertadores e Sul-Americana: fase de grupos e mata-mata; vagas da temporada seguinte são conquistadas por liga, Copa do Brasil ou título continental.
- Supercopa, Recopa, Intercontinental e Mundial só aparecem quando o clube conquista a vaga correspondente. O Mundial ocorre no ciclo de quatro temporadas.

O formato usa os regulamentos-base de 2026. Competições com centenas de jogos são reduzidas ao grupo e aos confrontos que envolvem o clube do jogador, mantendo critérios de classificação, acesso e eliminação.

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
