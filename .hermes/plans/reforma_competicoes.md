# Plano: Reforma de Competições (modelo do Guia, em paralelo)

Objetivo: substituir o modelo monopolar atual (1 liga + 1 copa enfiada)
pelo modelo do doc: competições em PARALELO e em pirâmide
Estadual → Regional → Nacional (Séries A/B/C/D + Copa do Brasil + Supercopa)
→ Continental (Lib/Sul-Am/Recopa) → Mundial, com classificação por VAGAS,
promoção/rebaixamento por temporada e calendário sem choque de datas.

## Princípio de não-quebra
- A simulação de 1 jogo (E.simMatch) JÁ ESTÁ VALIDADA e não muda.
- O save continua tendo 1 time/1 clube titular. O que muda: o clube participa
  de várias competições ao mesmo tempo; cada competição tem seu próprio
  calendário/fase e o jogador joga 1 jogo por "semana" (round) de UMA delas,
  intercaladas.
- Preservar S.table (sua liga principal) e S.trophies (histórico).

## Fase 1 — Modelo de dados: "competições do save" (engine + data)
- data.js: definir COMPETITIONS como catálogo (id, nome, nível, tipo, formato,
  países/escopo, vagas de classificação, regras de promoção/rebaixamento).
  Adicionar Série C e Série D (BR), Estaduais (ex: Paulista/Carioca),
  Regionais (Nordeste/Verde/Sul-Sudeste), Supercopa, Recopa, Intercontinental.
- engine.js: S.comps = array de {compId, fase, grupos/keys, tabela própria,
  mando, status}. Função E.enrollComps(S) decide em quais o clube entra
  (por divisão atual + classificação da temporada anterior = vagas).
- genCalendar vira E.genCalendar(S) que MESCLA rodadas de cada competição
  do clube sem choque de datas (doc §12: calendário evita conflito).
- VERIFICAR: jsdom e2e ainda passa; save antigo (sem S.comps) normaliza.

## Fase 2 — Simulação paralela (engine)
- advanceWeek: em vez de wk.cup booleano, wk.comp = compId. Aplica resultado
  na tabela/fase daquela competição (E.applyCompResult).
- Cada comp tem sua própria tabela/fase (pontos corridos ou mata-mata).
- simOtherMatches expande por competição.
- endSeason: processa TODAS as comps do clube (títulos, vagas conquistadas,
  rebaixamento só da liga nacional). Adiciona título em S.trophies com nome
  da competição.
- VERIFICAR: placar vs desempenho coerente; gols+assist<=gf; goleiro 0/0.

## Fase 3 — UI: tela de Competições (estilo do doc)
- Nova aba "Competições" (ou reformar "Liga"/"Ligas") mostrando as competições
  do clube EM PARALELO, cada uma com sua tabela/fase, nível (estadual→mundial),
  e vagas. Visual em pirâmide/escadinha.
- Calendário (aba Temporada) mostra de qual competição é cada jogo.
- Conquistas mostra títulos por competição.
- VERIFICAR: render sem erro; botões; Hall da Fama filtrado por conta.

## Fase 4 — Classificação por vagas + promoção/rebaixamento configurável
- VAGAS não fixas no código (doc §12): tabela de regras por temporada.
- Supercopa (campeões nacionais), Recopa (campeões continentais),
  Intercontinental (campeão continental vs campeões) entram no fluxo.
- VERIFICAR: fluxo Estadual→...→Mundial funciona; vagas herdadas repassadas.

## Fase 5 — Deploy
- commit, push GitHub, fly deploy, smoke test no fly.dev.

## Notas
- Cada fase é independente e verificada antes de seguir.
- Não mexer em E.simMatch (já validado).
- Mantém compatibilidade com saves antigos via E.normalizeSave.
