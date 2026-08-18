# Teoria do Calendário — ProPath Futebol (v2: ANO REAL POR GAMEWEEK)

## 0. DECISÃO DE MODELO
O calendário do jogo espelha um ANO DE FUTEBOL (gameweeks ~48, Fev–Dez), NÃO uma
fila esticada de 1-evento-por-semana. Cada GAMEWEEK pode conter 1 OU 2 jogos do
jogador (final de semana + meio de semana). Assim TODAS as competições paralelas
cabem sem criar "semanas extras" artificiais.

Por que não 1-evento-por-semana:
  • Com 5 competições, 1-por-semana estica o ano para 60+ wk's (ano fake).
  • No futebol real, copa no meio de semana + liga no final de semana = MESMA semana.
  • Manter 1-por-semana também separa as 2 pernas de um mata-mata ida/volta com
    treino no meio (quebra a coerência — G1).

## 1. UNIDADE: entrada wk + agrupamento por gameweek
`S.calendar` continua sendo um ARRAY LINEAR de entradas (mantém advanceWeek/QTE
processando 1 partida por vez). Cada entrada:
  { type:'match'|'train', week, slot:'weekend'|'midweek', opp, home,
    comp, round, stage, phase, leg, legs }
Novidade vs v1:
  • `week` → número da gameweek (1..N). VÁRIAS entradas podem compartilhar o mesmo
    `week` (ex.: week:12 slot midweek = Copa; week:12 slot weekend = Liga).
  • `slot` → 'weekend' (todo final de semana) | 'midweek' (copa/continental/mata).
advanceWeek avança 1 entrada por vez (1 QTE por partida). O contador de "semana"
só sobe quando o `week` da próxima entrada muda.

## 2. O ANO (janelas das competições)
Cada competição tem uma JANELA de gameweeks e um PADRÃO de ocupação. Exemplo para
um clube da Série A com Libertadores:

  Estadual (pontos)      : gameweeks  1–12  (grupo 1–11 + mata-mata)
  Liga / Série A (pontos): gameweeks  8–46  (38 rodadas, 1/sem no weekend)
  Copa do Brasil (mata)  : fases em  6,12,18,24,30,36,42,46 (slot midweek)
  Libertadores (grupo)   : gameweeks 10–28  (6 rodadas, midweek)
  Libertadores (mata)    : gameweeks 30–44  (midweek)
  Mundial / Supercopa     : gameweek 48

Com 1 jogo de liga/estadual no weekend + copa/continental no midweek, as ~48
gameweeks cobrem todas as competições sem estourar o ano (resolve G4).

## 3. SLOTTING (alocação por data — o novo coração)
Em vez de "pega 1 de cada fila ativa por passada" (v1, que esticava), o gerador
ALOCA os jogos nos SLOTS LIVRES do ano:
  1. Reservar slots 'weekend' para competições de pontos (liga/estadual/regional):
     1 jogo por gameweek na janela, round-robin respeitando mandos.
  2. Encaixar competições de copa/mata nos slots 'midweek' das gameweeks-alvo.
  3. Se 2 competições caem no MESMO slot → regra de prioridade (seção 4).
  4. Gameweeks sem nenhum jogo → 1 entrada 'train' (descanso/evolução passiva).
  5. Mata-mata ida/volta → 2 gameweeks CONSECUTIVAS (perna 1 na gw X, perna 2 na
     gw X+1), NUNCA separadas por treino (resolve G1).

## 4. PRIORIDADE EM CONFLITO (resolve G3)
Quando 2 competições querem o mesmo slot, a regra EXPLÍCITA decide quem joga:
  • Slot weekend: Liga da divisão atual tem prioridade sobre estadual/regional.
  • Slot midweek: Continental (Lib/Sul) > Copa do Brasil > Supercopa/Mundial.
  • Se ainda houver choque no midweek (ex.: Lib e Copa do Brasil na mesma gw):
    a copa de MENOR peso cede a gameweek (vai para a midweek livre anterior/próxima).
  (Na v1 não havia peso — o round-robin cego só pegava 1 de cada e ignorava isso.)

## 5. RITMO / TREINO / QTE
  • Treino não é mais "a cada 3 jogos" fixo (v1). Vira a GAMEWEEK LIVRE (sem jogos).
    Ano real não tem treino toda semana — só nas folgas.
  • QTE ao vivo: se a gameweek tem 2 jogos, o advanceWeek roda 2 QTEs (1 por
    entrada). O jogador vê 2 telas ao vivo na mesma "Gameweek 12" (Copa quarta +
    Liga domingo) — realista. attrDeltas aplicados em cada partida.
  • Estatísticas (seasonStats) e tabelas (applyCompResult) continuam por entrada,
    independente de quantas entradas a gameweek tem.

## 6. ACESSO / PROMOÇÃO / REBAIXAMENTO (inalterado)
Fim de temporada (E.endSeason -> resolveLeagueOutcome), posição na tabela da LIGA
decide o destino na pirâmide:
  Várzea(t0) -> Série D(t1) -> Série C(t2) -> Série B(t3) -> Série A(t4)
  • Série A: rebaixa 4 últimos. Série B: sobe 2 + 4 playoff (6).
  • Série C: quadrangulares, 4 sobem + 2 caem. Série D: grupos + mata, 6 sobem.
Promoção/rebaixamento troca S.leagueId (ADJ_LEAGUE, tier±1, mesma federação).
Estrangeiro = joinTeam outra federação (regera calendário com novo ano).

## 7. JANELA DE TRANSFERÊNCIA (inalterado + marco)
  • Ofertas geradas SÓ em endSeason (E.genOffers). Aceitar = E.acceptOffer ->
    E.joinTeam (regera calendário). Não há botão "ficar".
  • Proposta: marco wk type:'window' entre temporadas (feedback de "mercado aberto").

## 8. VIrada de Temporada / PERSISTÊNCIA
  • E.endSeason zera seasonStats, S.comps=null, regera S.calendar (com week 1..N),
    initLeague, gera ofertas.
  • normalizeSave migra saves antigos (COMP_RULES_VERSION). O calendário é
    DETERMINÍSTICO por save; só muda se S.comps/S.leagueId mudam.
  • O campo `week` zera na virada (nova temporada = novo ano 1..N).

## 9. GAPS DA v1 RESOLVIDOS
  G1 (treino separando pernas de mata-mata) → RESOLVIDO: pernas em gw's consecutivas.
  G3 (sem prioridade em conflito)            → RESOLVIDO: regra explícita (seção 4).
  G4 (ano esticado com 5 competições)        → RESOLVIDO: ano real ~48 gw's, multi-evento.
  G2 (liga = copa, Série D grupos_mata)      → mantém: isCup detecta por TYPE (pitfall 28).
  G5 (stale state ao rebuildar comps)        → mantém: zerar S.comps + S.leagueTeams antes
                                               de ensureComps ao trocar leagueId.
NOVO GAP (da v2):
  G6. advanceWeek com 2 jogos na mesma gameweek: o fluxo ao vivo precisa processar
      N entradas do mesmo `week` antes de virar a semana. UI mostra "Gameweek X" e
      lista os jogos. Verificar no livematch.js que o overlay fecha e reabre por entrada.

## 10. PRÓXIMOS PASSOS (implementação)
  genCompCalendar vira genGameweekCalendar: em vez de round-robin de filas, faz
  SLOTTING por janela (seções 2–3). Campos novos em cada wk: `week`, `slot`.
  Fluxo de entrega (padrão do usuário): implementar -> GitHub -> harness jsdom
  (test_competitions.js / verify-*) -> RELATÓRIO de bugs -> só depois corrigir.
  Harness deve checar: (a) soma de weeks == N; (b) nenhuma gameweek com 2 jogos no
  MESMO slot; (c) pernas de mata-mata em gw's consecutivas; (d) ano não passa de ~52.
