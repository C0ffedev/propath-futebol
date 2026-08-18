# Plano: Rebuild da Pirâmide Nacional + Competições (ProPath Futebol)

## Objetivo
Reestruturar o núcleo de ligas/competições do jogo para o modelo oficial brasileiro:
- Pirâmide nacional Série A/B/C/D com regras de acesso exatas e por região de origem.
- Copa do Brasil (126 clubes, eliminatórias, Série A entra na 5ª fase).
- Supercopa do Brasil (campões nacionais; substituto se mesmo clube ganhar os dois).
- Continentais: Libertadores, Sul-Americana, Recopa; Mundiais: Intercontinental, Mundial de Clubes (ciclo 4 anos).
- Sistema genérico de classificação/vagas/promoção/rebaixamento versionável por ano.
- Histórico de campeão/vice/posição/pontos/acessos/rebaixamentos.
- Calendário sem conflito entre estadual/nacional/continental/mundial.
- Jogador começa na Várzea (tier 0) e sobe até a Série A.

## Decisões aprovadas
- Série A: 20 clubes, pontos corridos 38 rodadas, rebaixamento dos 4 últimos.
- Início do jogador: Várzea (tier 0) → sobe até Série A.
- Escopo: tudo de uma vez, em camadas verificadas.

## Camadas (cada uma validada com teste jsdom no servidor antes de seguir)

### Camada 1 — Dados: regiões + pirâmide A/B/C/D + Várzea (data.js)
- Adicionar campo `region` (SE/S/NE/CO/N) e `state` (UF) a cada time BR.
- Garantir 4 ligas nacionais: bra-sa (20, A), bra-sb (B), bra-sc (C), bra-sd (D), + bra-varzea (tier 0).
- Elencos das Séries C/D: sintéticos determinísticos por região (SYNTH por região/estado).
- Várzea segue como takeoff.
- Manter outras ligas (ING/ESP/...) intactas para carreiras internacionais.
- Critério: times de SP no Paulista, RJ no Carioca, etc. (já existe estMap; estender p/ todas as UFs).

### Camada 2 — Motor genérico de classificação/vagas (engine.js)
- `REGULAMENTOS[ano]` versionável: por competição, define nº de participantes, formato (pontos/mata/grupos+meta), vagas de acesso, rebaixamento, critérios de desempate.
- `classify(comps, crit)` genérico por posição/título/vice/ranking (sem vagas fixas no código).
- `applyAccess/relegate` por temporada conforme regulamento.
- Tratamento de vaga herdada (mesmo clube por 2 caminhos → repassar por regulamento).

### Camada 3 — Pirâmide A/B/C/D (engine.js endSeason/advance)
- Série B: 1º/2º sobem direto; 3º–6º playoff (4 sobem total).
- Série C: mesmo formato de acesso (4 sobem pra B); 2 últimos caem.
- Série D: 96 clubes, 16 grupos de 6, 4 melhores por grupo avançam, mata-mata; 6 sobem pra C.
- Série A: 4 últimos caem pra B.
- Várzea: acesso simples pra Série D (1 ou 2 sobem).

### Camada 4 — Calendário sem conflito (comps.js / engine genCalendar)
- Slot system: estadual (início), nacional (meio), continental (intercalado), mundial (fim).
- Evitar 2 jogos da mesma comp seguidos; treino a cada 3 jogos.

### Camada 5 — Copa do Brasil + Supercopa (comps.js)
- Copa: 126 clubes, eliminatórias; Série A entra na 5ª fase.
- Supercopa: campeão A × campeão Copa; substituto se mesmo clube.

### Camada 6 — Continentais + Mundiais (comps.js + data CUPS)
- Libertadores (vagas por A/Copa/ranking), Sul-Americana, Recopa, Intercontinental, Mundial (ciclo 4 anos, não anual).

### Camada 7 — Histórico (engine + UI)
- `S.history`: campeão/vice/posição/pontos/acessos/rebaixamentos por temporada/comp.

### Camada 8 — UI (home.js / main.js / ui.js)
- Mostrar pirâmide, fases, tabelas por comp, histórico, vagas.

## Verificação
- Teste ad-hoc jsdom por camada: regiões presentes, acesso B→A correto (2+playoff=4),
  D→C (6), Copa 126/5ª fase, Supercopa substituto, sem conflito de datas, histórico gravado.
- `node -c` em cada arquivo alterado.
- Commit por camada + deploy final.
