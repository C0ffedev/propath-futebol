// ===== engine.js — ProPath Futebol (lógica da carreira) =====
const E = {};

E.calcOvr = function(pos, attrs){
  const ks = POSITIONS[pos].attrs;
  let s = 0; for (const k of ks) s += (attrs[k]||50);
  return Math.round(s / ks.length);
};

// potencial define teto de crescimento por idade
E.potential = function(age, startOvr){
  if (age <= 21) return Math.min(99, startOvr + 30);
  if (age <= 24) return Math.min(99, startOvr + 22);
  if (age <= 27) return Math.min(99, startOvr + 14);
  if (age <= 30) return Math.min(99, startOvr + 6);
  return Math.min(99, startOvr + 2);
};

// escolhe a liga inicial com base no potencial do jogador (o usuário não seleciona)
E.leagueForPotential = function(pot){
  if (pot >= 82) return 'bra-sa';
  if (pot >= 74) return 'bra-sb';
  if (pot >= 68) return 'bra-sc';
  if (pot >= 62) return 'bra-sd';
  return 'bra-varzea';
};

// ---- Elencos, estrelas com OVR próprio e evolução da liga (funcional) ----
function _hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function _clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
// estrela aceita string (OVR derivado/determinístico) ou objeto {n,o}
function starInfo(star, teamO){
  if (typeof star === 'string') return { n:star, o:_clamp((teamO||70) + ((_hash(star)%9)-4), 55, 95) };
  return { n:star.n, o:_clamp(star.o||teamO||70, 55, 95) };
}
// elenco de 11 titulares (determinístico por nome do time), estrelas como destaques
// formação 4-3-3 padrão do futebol brasileiro
E.genSquad = function(teamName, teamO, stars){
  const layout = [
    { pos:'GOL', setor:'Goleiro' },
    { pos:'ZAG', setor:'Defesa' }, { pos:'ZAG', setor:'Defesa' },
    { pos:'LAT', setor:'Defesa' }, { pos:'LAT', setor:'Defesa' },
    { pos:'VOL', setor:'Meio' }, { pos:'MEI', setor:'Meio' }, { pos:'MEI', setor:'Meio' },
    { pos:'ATA', setor:'Ataque' }, { pos:'ATA', setor:'Ataque' }, { pos:'ATA', setor:'Ataque' }
  ];
  const posBias = { GOL:3, ZAG:-2, LAT:-1, VOL:0, MEI:0, ATA:2 };
  const used = (stars||[]).map(s=>starInfo(s, teamO));
  const pool = ['Júnior','Rafinha','Dudu','Léo','Caio','Thiago','Pedro','Lucas','Marcelo','Bruno','Wallace','Rômulo','Henrique','Vinícius','Gabriel','Felipe','Rodrigo','Anderson','Patrick','Yuri'];
  const squad = [];
  for (let i=0;i<11;i++){
    const { pos, setor } = layout[i];
    let n, o;
    if (i < used.length){ n = used[i].n; o = used[i].o; }
    else {
      const seed = _hash((teamName||'x')+'#'+(i-used.length));
      n = pool[seed % pool.length] + ' ' + String.fromCharCode(65 + (seed>>3)%26) + '.';
      o = _clamp((teamO||70) + (posBias[pos]||0) + ((seed%7)-3), 55, 95);
    }
    squad.push({ pos, setor, n, o });
  }
  return squad;
};
// times da liga: usa elenco evoluído (S.leagueTeams) se houver, senão o catálogo base
E.leagueTeams = function(S){ return (S && S.leagueTeams && S.leagueTeams.length) ? S.leagueTeams : LEAGUE_BY_ID(S.leagueId).teams; };
// faz uma cópia profunda dos times da liga para o save (base da evolução)
function _copyLeagueTeams(leagueId, teamName){
  const lg = LEAGUE_BY_ID(leagueId); if (!lg) return [];
  let teams = lg.teams;
  if (lg.id === 'bra-sd' && lg.groups){
    const group = lg.groups.find(g=>g.includes(teamName)) || lg.groups[0];
    teams = group.map(n=>lg.teams.find(t=>t.n===n)).filter(Boolean);
  }
  return teams.map(t=>({ n:t.n, o:t.o, c:t.c, code:t.code, stars:(t.stars||[]).map(s=> (typeof s==='string'? s : {n:s.n,o:s.o})), honours:t.honours||{} }));
}

// atributos iniciais a partir de archetype (ou distribuição personalizada)
E.attrStart = function(o){
  const pos = o.pos;
  const ks = POSITIONS[pos].attrs;
  const a = {};
  for (const k of ks) a[k] = 48 + Math.floor(Math.random()*8);
  // personalizada: aplica pontos do draft
  if (o.arch === 'personalizada' && o.skillPts){
    const pts = o.skillPts;
    for (const k of ks) a[k] = Math.min(95, Math.max(40, (a[k]||50) + (pts[k]||0)));
  }
  // aplica boost de pé (ambidestro)
  const footBoost = (o.foot==='amb') ? (FOOT_INFO.amb.boost||0) : 0;
  const archBoost = (o.arch && ARCHETYPES.find(x=>x.k===o.arch)) ? 0 : 0;
  for (const k of ks) a[k] = Math.min(95, (a[k]||50) + footBoost);
  // skills concedem atributos
  const skills = o.skills || [];
  for (const sk of skills){
    const def = SKILLS.find(s=>s.k===sk);
    if (!def) continue;
    if (def.attrAll) for (const k of ks) a[k] = Math.min(95, (a[k]||50)+def.attrAll);
    if (def.attr) for (const k in def.attr) if (a[k]!==undefined) a[k]=Math.min(95,(a[k]||50)+def.attr[k]);
  }
  // aplica OVR alvo do archetype (escala os atributos)
  if (o.ovrTarget){
    const cur = E.calcOvr(pos, a);
    const f = o.ovrTarget / cur;
    for (const k of ks) a[k] = Math.min(95, Math.round((a[k]||50)*f));
  }
  return a;
};

E.createPlayer = function(o){
  const arch = ARCHETYPES.find(x=>x.k===o.arch) || ARCHETYPES[3];
  const foot = o.foot || 'dir';
  const age = o.age != null ? o.age : (arch.age[0] + Math.floor(Math.random()*(arch.age[1]-arch.age[0]+1)));
  // OVR alvo conforme archetype
  let ovrTarget = null;
  if (arch.k === 'personalizada') ovrTarget = null;
  else ovrTarget = arch.ovr + Math.floor(Math.random()*3)-1;
  const attrs = E.attrStart({pos:o.pos, arch:o.arch, foot, skills:o.skills, skillPts:o.skillPts, ovrTarget});
  const ovr = E.calcOvr(o.pos, attrs);
  let pot;
  if (o.potTarget != null) pot = o.potTarget;
  else if (arch.pot != null) pot = arch.pot + Math.floor(Math.random()*11)-5;
  else pot = Math.min(99, ovr + 20);
  pot = Math.max(50, Math.min(99, pot));
  let tierDef;
  if (o.leagueId && LEAGUE_BY_ID(o.leagueId)) tierDef = LEAGUE_BY_ID(o.leagueId);
  else tierDef = LEAGUE_BY_ID(E.leagueForPotential(pot));
  const team = tierDef.teams[Math.floor(Math.random()*tierDef.teams.length)];
  const me = {
    id: 'save-' + Date.now().toString(36),
    name: o.name, nation: o.nation, pos: o.pos,
    age, attrs, ovr, pot, foot, skills: o.skills||[],
    creationArch: o.arch || 'branco',
    archetype: o.power || null,
    mental: null, mentalAwakened: [],
    leagueId: tierDef.id, tierIndex: TIERS.indexOf(tierDef), teamName: team.n,
    teamOvr: team.o, salary: 1500,
    leagueTeams: _copyLeagueTeams(tierDef.id, team.n),
    week: 1, season: 1, morale: 70, form: 3,
    table: {p:0,w:0,d:0,l:0,gf:0,ga:0},
    seasonMatches: [], calendar: [], calIdx: 0,
    trainPlan: {k:'tecnico', n:'Técnica Obsessiva'},
    sMeEvo: [], trophies: [], offers: [],
    seasonStats: { games:0, wins:0, draws:0, losses:0, goals:0, assists:0, cleanSheets:0,
                   mom:0, goalsConceded:0, bestRating:0, worstRating:10, biggestWin:0, hatTricks:0, cupGames:0 },
    records: { bestSeasonGoals:0, bestStreak:0, curStreak:0, mostGoalsGame:0, mostAssistsGame:0, bestRating:0 },
    careerStats: { games:0, wins:0, draws:0, losses:0, goals:0, assists:0, cleanSheets:0,
                   mom:0, goalsConceded:0, bestRating:0, worstRating:10, biggestWin:0,
                   hatTricks:0, cupGames:0, seasons:1, teamsPlayed:{} },
    seasonSummary: null,
    career: [`Temporada 1: ${o.name} estreia na ${tierDef.name} (${FOOT_LABEL[foot]}).`],
    leaderPushed: false,
    owner: o.owner || ''
  };
  me.calendar = E.genCalendar(me);
  E.initLeague(me);
  return me;
};

E.normalizeSave = function(S){
  if (!S) return S;
  if (typeof S.version !== 'number') S.version = 1;
  // garante que TODOS os atributos da posição existam (evita NaN em saves antigos)
  if (S.attrs && S.pos && POSITIONS[S.pos]){
    for (const k of POSITIONS[S.pos].attrs) if (typeof S.attrs[k] !== 'number') S.attrs[k] = 50;
  }
  if (!S.seasonStats) S.seasonStats = { games:0, wins:0, draws:0, losses:0, goals:0, assists:0, cleanSheets:0,
    mom:0, goalsConceded:0, bestRating:0, worstRating:10, biggestWin:0, hatTricks:0, cupGames:0 };
  if (!S.careerStats) S.careerStats = { games:0, wins:0, draws:0, losses:0, goals:0, assists:0,
    cleanSheets:0, mom:0, goalsConceded:0, bestRating:0, worstRating:10, biggestWin:0,
    hatTricks:0, cupGames:0, seasons:S.season||1, teamsPlayed:{} };
  if (!S.skills) S.skills = [];
  if (!S.foot) S.foot = 'dir';
  if (!S.seasonSummary) S.seasonSummary = null;
  // compatibilidade com saves ANTIGOS (criados antes da refatoração de ligas):
  // eles usavam 'tierIndex' da pirâmide BR antiga (0=Várzea, 1=Série B, 2=Série A, 3=Libe, 4=Panteão).
  // Mapeia para a liga nova correta. Se o time não está na liga armazenada (save já
  // corrompido por mapeamento antigo), re-deriva a partir do tierIndex.
  const _oldTierToLeague = function(ti){
    const M = {0:'bra-varzea', 1:'bra-sb', 2:'bra-sa', 3:'bra-sa', 4:'bra-sa'};
    return (typeof ti === 'number' && M[ti]) ? M[ti] : 'bra-sb';
  };
  const _lgOf = LEAGUE_BY_ID(S.leagueId);
  const _inLeague = _lgOf && _lgOf.teams.some(t => t.n === S.teamName);
  if (!S.leagueId || !_inLeague){
    S.leagueId = _oldTierToLeague(S.tierIndex);
  }
  if (typeof S.tierIndex !== 'number' || !TIERS[S.tierIndex] || TIERS[S.tierIndex].id !== S.leagueId){
    const idx = TIERS.findIndex(t=>t.id===S.leagueId);
    if (idx >= 0) S.tierIndex = idx;
  }
  // elenco evoluível da liga (cópia dos times base); alimenta evolução ano a ano
  if (!S.leagueTeams || !S.leagueTeams.length || (S.leagueId==='bra-sd' && S.leagueTeams.length!==6)) S.leagueTeams = _copyLeagueTeams(S.leagueId, S.teamName);
  if (!S.sMeEvo) S.sMeEvo = [];
  if (!S.trophies) S.trophies = [];
  if (!S.offers) S.offers = [];
  if (!S.records) S.records = { bestSeasonGoals:0, bestStreak:0, curStreak:0, mostGoalsGame:0, mostAssistsGame:0, bestRating:0 };
  if (!S.seasonMatches) S.seasonMatches = [];
  if (!S.table) S.table = {p:0,w:0,d:0,l:0,gf:0,ga:0};
  if (!S.calendar) S.calendar = E.genCalendar(S);
  if (typeof S.calIdx !== 'number') S.calIdx = 0;
  // Migra calendários ainda não iniciados para as regras estaduais/regionais vigentes.
  // Temporadas com partidas já disputadas são preservadas e migram na virada do ano.
  if (typeof E.ensureComps==='function' && S.compRulesVersion!==E.COMP_RULES_VERSION && S.calIdx===0 && !(S.seasonMatches||[]).length){
    S.comps=null;E.ensureComps(S);S.calendar=E.genCompCalendar(S);
  }
  if (!S.trainPlan) S.trainPlan = {k:'tecnico', n:'Técnica Obsessiva'};
  // Liga: garante tabela + sincroniza com os jogos já disputados (corrige saves antigos desbalanceados)
  E.recomputeLeague(S);
  if (!S.nextComps) S.nextComps = [];
  if (!S.compReasons) S.compReasons = {};
  if (!S.worldQualificationHistory) S.worldQualificationHistory = [];
  S.version = 3;
  return S;
};

// ===== LIGA REAL (tabela computada por resultados) =====
// Gera o calendário a partir das rodadas do round-robin (ida e volta). O `round`
// de cada jogo do jogador == índice da rodada em E._roundPairs, para que
// simOtherMatches saiba exatamente quais rivais simular naquela rodada.
E.genCalendar = function(S){
  // Reforma de competições: garante que o save tenha suas competições paralelas.
  if (typeof E.ensureComps === 'function') E.ensureComps(S);
  // Se o save tem competições paralelas, gera calendário mesclado.
  if (S.comps && S.comps.length){ return E.genCompCalendar(S); }
  const fixture = E._roundPairs(E.leagueTeams(S)); // array de rodadas; cada rodada = lista de pares
  const cal = [];
  fixture.forEach((roundPairs, ri) => {
    const round = ri + 1;
    // o jogador joga 1 vez por rodada (se estiver num dos pares)
    const myPair = roundPairs.find(p => p[0].n === S.teamName || p[1].n === S.teamName);
    if (myPair){
      const home = myPair[0].n === S.teamName;
      const rival = home ? myPair[1] : myPair[0];
      cal.push({ type:'match', opp: rival, home, round, cup:false });
    }
    // semana de treino entre rodadas (exceto após a última)
    if (ri < fixture.length-1) cal.push({ type:'train' });
  });
  // Copas (mata-mata) extras na metade e fim da temporada
  const cupOpp = CUP_TEAMS(S);
  if (cupOpp.length){
    cal.splice(Math.floor(cal.length/2), 0, { type:'match', opp: cupOpp[Math.floor(Math.random()*cupOpp.length)], cup:true });
    cal.push({ type:'match', opp: cupOpp[Math.floor(Math.random()*cupOpp.length)], cup:true });
  }
  return cal;
};

// Simula TODOS os jogos de liga de uma rodada EXCETO o do jogador (que é o seu
// match real). Usa a mesma E.simMatch para manter coerência com a simulação validada.
// Atualiza S.leagueTable (tabela real) e S.scorers (artilharia agregada).
// Reconstrói as RODADAS do round-robin (cada rodada = lista de pares [home, away]),
// mesma lógica do genCalendar, para simular só os jogos rivais da rodada atual.
E._roundPairs = function(leagueIdOrTeams){
  const teams = Array.isArray(leagueIdOrTeams) ? leagueIdOrTeams : LEAGUE_BY_ID(leagueIdOrTeams).teams;
  const arr = teams.slice();
  if (arr.length % 2 === 1) arr.push(null); // bye se ímpar
  const single = [];
  for (let r=0; r<arr.length-1; r++){
    const roundPairs = [];
    for (let i=0; i<arr.length/2; i++){
      const h = arr[i], a = arr[arr.length-1-i];
      if (h && a) roundPairs.push([h,a]);
    }
    single.push(roundPairs);
    arr.splice(1,0,arr.pop());
  }
  // volta (mandos invertidos)
  const back = single.map(rp => rp.map(([h,a]) => [a,h]));
  // ATENÇÃO: deve espelhar EXATAMENTE a ordem do genCalendar (ida completa, depois volta completa)
  const fixture = single.concat(back);
  return fixture; // fixture[roundIdx] = array de pares daquela rodada
};

// Simula SÓ os jogos dos RIVAIS da rodada atual (exclui o do jogador, que já foi
// computado em advanceWeek). Mantém a tabela real e a artilharia coerentes.
E.simOtherMatches = function(S, wk){
  if (!S.leagueTable) E.initLeague(S);
  const fixture = E._roundPairs(E.leagueTeams(S));
  const roundPairs = fixture[(wk.round-1) % fixture.length];
  if (!roundPairs) return;
  roundPairs.forEach(function(pair){
    const A = pair[0], B = pair[1];
    if (A.n === S.teamName || B.n === S.teamName) return; // jogo do jogador já tratado em advanceWeek
    const r = E.simMatch({ teamOvr:A.o, ovr:A.o, pos:'MEI', form:3, skills:[] },
                         { n:B.n, o:B.o }, false);
    E.applyLeagueResult(S, A.n, B.n, r.gf, r.ga);
    const aStar = A.stars ? A.stars[Math.floor(Math.random()*A.stars.length)] : A.n;
    const bStar = B.stars ? B.stars[Math.floor(Math.random()*B.stars.length)] : B.n;
    if (r.gf > 0) E.addScorer(S, aStar, 1 + (Math.random()<0.25?1:0), A.n);
    if (r.ga > 0) E.addScorer(S, bStar, 1 + (Math.random()<0.25?1:0), B.n);
  });
};

// Reconstrói a tabela real + artilharia a partir do que o jogador JÁ disputou.
// Garante sincronia com as partidas do usuário (corrige saves antigos desbalanceados):
// para cada rodada de liga já computada (i < calIdx), aplica o resultado do jogador
// (de seasonMatches) e simula os rivais daquela rodada.
E.recomputeLeague = function(S){
  E.initLeague(S);
  const cal = S.calendar || [];
  let mi = 0; // índice em seasonMatches (alinhado à ordem dos jogos)
  for (let i=0; i<cal.length && i<S.calIdx; i++){
    const c = cal[i];
    // só liga: mesma lógica isCup do advanceWeek (c.comp ausente = liga pura)
    const _isCup = !!c.comp && (c.comp !== S.leagueId || ((S.comps||[]).find(x=>x.compId===c.comp)||{}).type !== 'pontos');
    if (c.type !== 'match' || _isCup) continue; // só liga
    const m = S.seasonMatches[mi++];
    if (!m) continue;
    // resultado do jogador nesta rodada
    E.applyLeagueResult(S, S.teamName, c.opp.n, m.gf, m.ga);
    if (m.goals > 0) E.addScorer(S, S.name, m.goals, S.teamName, true);
    // simula os RIVAIS da mesma rodada (mantém a tabela coerente)
    if (m.gf !== undefined){
      E.simOtherMatches(S, { round: c.round });
    }
  }
};

E.initLeague = function(S){
  const teams = E.leagueTeams(S);
  S.leagueTable = {};
  teams.forEach(t => { S.leagueTable[t.n] = { n:t.n, p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,team:true }; });
  S.scorers = [];
  // inclui o jogador na artilharia (zera)
  S.scorers.push({ name: S.name, team: S.teamName, goals: 0, you:true });
};

E.applyLeagueResult = function(S, aName, bName, gf, ga){
  if (!S.leagueTable) E.initLeague(S);
  const A = S.leagueTable[aName], B = S.leagueTable[bName];
  if (!A || !B) return;
  A.p++; B.p++; A.gf+=gf; A.ga+=ga; B.gf+=ga; B.ga+=gf;
  if (gf>ga){ A.w++; B.l++; A.pts+=3; }
  else if (gf<ga){ B.w++; A.l++; B.pts+=3; }
  else { A.d++; B.d++; A.pts++; B.pts++; }
};

E.addScorer = function(S, name, goals, team, you){
  if (!S.scorers) S.scorers = [];
  let e = S.scorers.find(x => x.name === name && x.team === team);
  if (!e){ e = { name, team, goals:0, you: !!you }; S.scorers.push(e); }
  e.goals += goals;
};

// CBF: pontos, vitórias, saldo e gols pró. Disciplina e sorteio ficam fora
// da simulação porque o motor não registra cartões de todos os clubes.
E.getLeagueTable = function(S){
  // Série D é disputada em formato de grupos (grupos_mata); a tabela real é a do grupo na comp.
  if (S.leagueId==='bra-sd'){ const c=(S.comps||[]).find(x=>x.compId==='bra-sd'); if(c&&c.table) return E.getCompTable(S,'bra-sd'); }
  if (!S.leagueTable) E.initLeague(S);
  return Object.values(S.leagueTable).map(r => ({
    n:r.n, p:r.p, w:r.w, d:r.d, l:r.l, gf:r.gf, ga:r.ga,
    sg:r.gf-r.ga, pts:r.pts, me: r.n===S.teamName
  })).sort((a,b) => b.pts-a.pts || (b.w-a.w) || (b.sg-a.sg) || (b.gf-a.gf) || a.n.localeCompare(b.n));
};

E.getTopScorers = function(S){
  if (!S.scorers) return [];
  return S.scorers.slice().sort((a,b)=> b.goals-a.goals).slice(0,10);
};

E.trainGain = function(S, planOverride){
  // resolve o plano sempre a partir do catálogo TRAIN_PLANS (que tem os atributos 'a'),
  // mesmo se planOverride vier sem 'a' (ex.: S.trainPlan inicial do createPlayer)
  const base = planOverride && planOverride.k ? TRAIN_PLANS.find(p=>p.k===planOverride.k) : null;
  const plan = base || (S.trainPlan && S.trainPlan.k ? TRAIN_PLANS.find(p=>p.k===S.trainPlan.k) : null) || TRAIN_PLANS[1];
  const inc = (S.age <= 27) ? 1.1 : 0.35;
  for (const a of plan.a){
    if (!S.attrs[a]) continue;
    if (S.attrs[a] < S.pot) S.attrs[a] = Math.min(S.pot, +(S.attrs[a] + inc*E.archetypeTrainBias(S,a)).toFixed(1));
    else if (S.age > 30) S.attrs[a] = Math.max(40, +(S.attrs[a] - 0.15).toFixed(1));
  }
  for (const k in S.attrs) if (S.attrs[k] < S.pot) S.attrs[k] = Math.min(S.pot, +(S.attrs[k] + 0.18*E.archetypeTrainBias(S,k)).toFixed(1));
  S.ovr = E.calcOvr(S.pos, S.attrs);
  E.maintainGodMode(S); // god mode: mantém atributos/OVR/salário no teto
};

// multiplicador de skill para uma categoria especial
E.skillMul = function(S, catKey){
  let mul = 1;
  for (const sk of (S.skills||[])){
    const def = SKILLS.find(s=>s.k===sk);
    if (def && def.cat && def.cat[catKey]) mul *= def.cat[catKey];
  }
  return mul;
};

// ===== ARQUÉTIPOS (habilidade, Modelo 3 Camadas) =====
// Aplica a assinatura do arquétipo (POSIÇÃO) + MENTAL desperto ao resultado.
// ctx: { goals, assists, rating, specials, gf, ga } -> devolve também ga ajustado
function _applyOne(ctx, k){
  const A = resolveArchetype(k);
  if (!A) return ctx;
  const sig = A.signature || {};
  let { goals, assists, rating, specials, ga } = ctx;
  specials = specials || [];
  ga = (typeof ga === 'number') ? ga : (ctx.ga || 0);
  const scored = goals > 0;
  const doActive = ()=>{
    if (sig.specialChance && scored && Math.random() < sig.specialChance){
      specials.push({ k: k, label: sig.specialLabel || 'Jogada de Classe', verb: sig.specialVerb || 'decide o jogo' });
      rating += 0.3;
    }
    if (sig.guaranteedAssist){
      const need = sig.guaranteedAssist - (ctx.assists || 0);
      if (need > 0){ assists += need; rating += 0.2; }
    }
    if (sig.missPenalty && !scored){ rating -= sig.missPenalty; }
    if (sig.neutralFloor && !scored){ rating += sig.neutralFloor; }
  };
  const doPassive = ()=>{
    if (sig.assistBonus) assists += Math.round(assists * sig.assistBonus + (Math.random()<0.5?1:0));
    if (sig.ratingBonus) rating += sig.ratingBonus;
    if (sig.defAura && ga > 0 && Math.random() < sig.defAura){ ga -= 1; rating += 0.15; }
    if (sig.assists){ assists += Math.round(assists * sig.assists); }
  };
  if (sig.type === 'active') doActive();
  else if (sig.type === 'passive') doPassive();
  else if (sig.type === 'hybrid'){ doActive(); doPassive(); }
  rating = Math.max(5, Math.min(10, rating));
  goals = Math.min(goals, ctx.gf);
  assists = Math.min(assists, Math.max(0, ctx.gf - goals));
  return { goals, assists, rating, specials, ga };
}
E.applyArchetype = function(S, ctx){
  let out = _applyOne(ctx, S.archetype); // camada (B) posição
  if (S.mental){ out = _applyOne(out, S.mental); } // camada (A) mental desperto
  return out;
};

// Viés de treino por arquétipo (POSIÇÃO + MENTAL)
E.archetypeTrainBias = function(S, attr){
  let mul = 1;
  for (const k of [S.archetype, S.mental]){
    if (!k) continue;
    const A = resolveArchetype(k);
    if (A && A.growthBias && A.growthBias[attr]) mul *= A.growthBias[attr];
  }
  return mul;
};

// Verifica marco de mutação da POSIÇÃO (Modelo B)
E.checkMutation = function(S){
  const k = S.archetype;
  if (!k) return false;
  const A = archetypeById(k);
  if (!A || !A.mutate) return false;
  if (A.mutate.k === k) return false;
  const cs = (S.careerStats||{});
  const at = A.mutate.at || {};
  let hit = true;
  if (at.goalsCareer && (cs.goals||0) < at.goalsCareer) hit = false;
  if (at.assistsCareer && (cs.assists||0) < at.assistsCareer) hit = false;
  if (at.gamesCareer && (cs.games||0) < at.gamesCareer) hit = false;
  if (at.cleanSheetsCareer && (cs.cleanSheets||0) < at.cleanSheetsCareer) hit = false;
  if (hit){
    const oldName = A.n;
    S.archetype = A.mutate.k;
    S.career.push(`🔥 ARQUÉTIPO MUTOU: ${oldName} → ${A.mutate.n}! ${A.mutate.note}`);
    return true;
  }
  return false;
};

// Verifica se algum ARQUÉTIPO MENTAL despertou (gating por marco) e auto-ativa
E.checkMentalAwaken = function(S){
  const cs = (S.careerStats||{});
  const awakened = S.mentalAwakened || (S.mentalAwakened = []);
  let changed = false;
  for (const m of MENTAL_ARCHETYPES){
    if (awakened.includes(m.k)) continue;
    const g = m.gate || {};
    let hit = true;
    if (g.goalsCareer && (cs.goals||0) < g.goalsCareer) hit = false;
    if (g.assistsCareer && (cs.assists||0) < g.assistsCareer) hit = false;
    if (g.gamesCareer && (cs.games||0) < g.gamesCareer) hit = false;
    if (hit){
      awakened.push(m.k);
      if (!S.mental) S.mental = m.k; // auto-ativa o primeiro que desperta
      S.career.push(`⚡ ARQUÉTIPO MENTAL DESPERTADO: ${m.n}! ${m.blurb}`);
      changed = true;
    }
  }
  return changed;
};

// ===== GOD MODE (só no save do dono; ligado por S.godMode) =====
// Liga/desliga: maxa atributos/OVR, salário, desperta todos os mentais e dá todas as skills.
E.setGodMode = function(S, on){
  S.godMode = !!on;
  if (S.godMode){
    // atributos da posição no máximo
    if (S.pos && POSITIONS[S.pos]){ for (const k of POSITIONS[S.pos].attrs) S.attrs[k] = 99; }
    S.ovr = 99; S.pot = 99;
    // salário "infinito"
    S.salary = 99999999;
    // desperta todos os arquétipos mentais
    S.mentalAwakened = (MENTAL_ARCHETYPES||[]).map(m=>m.k);
    if (!S.mental && S.mentalAwakened.length) S.mental = S.mentalAwakened[0];
    // dá todas as skills
    if (typeof SKILLS !== 'undefined') S.skills = SKILLS.map(s=>s.k);
    S.career.push('👑 GOD MODE ATIVADO — atributos, OVR, salário, mentais e skills no máximo.');
  } else {
    S.career.push('👑 God Mode desativado.');
  }
  return S.godMode;
};

// Mantém o jogador no teto enquanto o god mode estiver ligado (usado em treino/fim de temporada).
E.maintainGodMode = function(S){
  if (!S.godMode) return;
  if (S.pos && POSITIONS[S.pos]){ for (const k of POSITIONS[S.pos].attrs) S.attrs[k] = 99; }
  S.ovr = 99; S.pot = 99; S.salary = 99999999;
};

// Força vitória e placar favorável no resultado da partida (aplica APÓS os QTEs/liveMods).
E.applyGodMode = function(S, r){
  if (!S.godMode || !r) return r;
  r.gf = Math.max(r.gf, 3);   // garante ao menos 3 gols
  r.ga = 0;                   // nenhum gol sofrido
  r.res = 'V';
  if (typeof r.goals === 'number') r.goals = Math.max(r.goals, 1); // cracha ao menos 1 gol
  return r;
};

E.simMatch = function(S, opp, cup){
  const myStr = S.teamOvr + (S.ovr - 65)*0.25 + (S.form-3)*1.2;
  const opStr = opp.o + 2;
  const exp = myStr/(myStr+opStr);
  const gf = E.poisson(exp*2.4 + 0.4);
  let ga = E.poisson((1-exp)*2.4 + 0.3);
  const rating0 = Math.max(5, Math.min(10, S.ovr/10 + (S.form-3)*0.4 + (Math.random()*3-1.2) + (gf>ga?0.5:gf<ga?-0.4:0)));
  let rating = rating0;
  const isAtt = (S.pos==='ATA'||S.pos==='MEI');
  let goals = 0, assists = 0;
  const skillGoalMul = (S.skills||[]).includes('finalizador') ? 1.25 : 1;
  const skillAstMul = (S.skills||[]).includes('armador') ? 1.3 : 1;
  if (isAtt){ goals = Math.round(E.poisson((rating-6)*0.7)*skillGoalMul); assists = Math.round(E.poisson((rating-6)*0.4)*skillAstMul); }
  else if (S.pos==='MEI'){ assists = Math.round(E.poisson((rating-6)*0.5)*skillAstMul); }
  // coerência: gols+assists <= gols do próprio time
  goals = Math.min(goals, gf);
  if (S.pos==='GOL') goals = 0;
  assists = Math.min(assists, Math.max(0, gf - goals));
  const mom = rating >= 7.6;

  // ----- estatísticas de jogo -----
  const mySkill = (S.ovr + S.teamOvr)/2;
  const oppSkill = (opp.o + opp.o)/2;
  const posse = Math.round(Math.min(78, Math.max(22, 50 + (mySkill-oppSkill)*0.9 + (Math.random()*8-4))));
  const totShots = gf + ga + E.poisson(6);
  const myShots = Math.min(totShots, Math.round(totShots * (posse/100) + (gf?1:0) + Math.random()*2));
  const oppShots = totShots - myShots;
  const myOnTarget = Math.max(0, myShots - E.poisson(Math.max(0, myShots*0.4)));
  const oppOnTarget = Math.max(0, oppShots - E.poisson(Math.max(0, oppShots*0.4)));
  const myPasses = 35 + Math.round(posse*1.1) + Math.floor(Math.random()*22);
  const oppPasses = 35 + Math.round((100-posse)*1.1) + Math.floor(Math.random()*22);
  const myAcc = Math.max(45, Math.min(94, Math.round(62 + (mySkill-oppSkill)*0.35 + Math.random()*7)));
  const oppAcc = Math.max(45, Math.min(94, Math.round(62 + (oppSkill-mySkill)*0.35 + Math.random()*7)));
  const myCorners = E.poisson(5*(posse/55));
  const oppCorners = E.poisson(5*((100-posse)/55));
  const myFouls = E.poisson(11);
  const oppFouls = E.poisson(11);
  // cartões (amarelos comuns, vermelhos raros) — coerentes com faltas
  const myYellow = Math.min(myFouls, E.poisson(1.7));
  const oppYellow = Math.min(oppFouls, E.poisson(1.7));
  const myRed = E.poisson(0.10), oppRed = E.poisson(0.10);
  // impedimentos
  const myOffsides = E.poisson(2.2);
  const oppOffsides = E.poisson(2.2);
  // defesas do goleiro = chutes no gol do outro lado menos os gols sofridos (coerente c/ placar)
  const mySaves = Math.max(0, oppOnTarget - gf);
  const oppSaves = Math.max(0, myOnTarget - ga);
  // chutes de dentro/fora da área (split dos chutes totais)
  const myInside = Math.round(myShots*0.45); const myOutside = myShots - myInside;
  const oppInside = Math.round(oppShots*0.45); const oppOutside = oppShots - oppInside;
  let pShots = 0, pPasses = 0, pTackles = 0, pDribbles = 0;
  const infl = Math.max(0.2, (rating-5)/5);
  if (S.pos==='ATA'){ pShots = 2 + Math.round(goals + infl*3); pPasses = 8 + Math.round(infl*14); pDribbles = 2 + Math.round(infl*4); }
  else if (S.pos==='MEI'){ pShots = 1 + Math.round(infl*2); pPasses = 25 + Math.round(infl*30); pDribbles = 2 + Math.round(infl*4); pTackles = Math.round(infl*3); }
  else if (S.pos==='GOL'){ pShots = 0; pPasses = 10 + Math.round(infl*10); pTackles = 0; pDribbles = 0; }
  else { pShots = Math.round(infl); pPasses = 15 + Math.round(infl*20); pTackles = 2 + Math.round(infl*4); pDribbles = 1 + Math.round(infl*3); }
  const pDribblesWon = Math.max(0, Math.round(pDribbles * (0.5 + infl*0.12)));
  const pOnTarget = Math.max(0, Math.round(pShots * (0.4 + infl*0.12)));
  const pPassAcc = Math.min(97, Math.round(78 + infl*14 + (Math.random()*6-3)));

  // ----- jogadas especiais (gols raros) -----
  const specials = [];
  if (isAtt || S.pos==='MEI'){
    for (const sg of SPECIAL_GOALS){
      let chance = sg.base * E.skillMul(S, sg.k);
      if (sg.k==='cabeca' && (S.skills||[]).includes('cabeceador')) chance *= 3;
      if (goals>0 && Math.random() < chance){
        specials.push(sg);
      }
    }
  }
  // ----- ARQUÉTIPO: aplica assinatura (altera goals/assists/rating/specials) -----
  const _ar = E.applyArchetype(S, { goals, assists, rating, specials, gf, ga });
  goals = _ar.goals; assists = _ar.assists; rating = _ar.rating; if (typeof _ar.ga==='number') ga = _ar.ga; specials.length = 0; _ar.specials.forEach(s=>specials.push(s));

  const stats = {
    posse, myShots, oppShots, myOnTarget, oppOnTarget,
    myPasses, oppPasses, myAcc, oppAcc,
    myCorners, oppCorners, myFouls, oppFouls,
    myYellow, oppYellow, myRed, oppRed, myOffsides, oppOffsides,
    mySaves, oppSaves, myInside, myOutside, oppInside, oppOutside,
    player:{ shots:pShots, onTarget:pOnTarget, passes:pPasses, passAcc:pPassAcc,
      tackles:pTackles, dribbles:Math.max(0,pDribbles), dribblesWon:pDribblesWon, goals, assists, specials }
  };

  const feed = E.buildFeed(S, opp, gf, ga, goals, assists, rating, mom, specials);
  const res = gf>ga?'V':gf<ga?'D':'E';
  return {gf,ga,feed,rating:+rating.toFixed(1),goals,assists,mom,res,stats,specials};
};

E.poisson = function(lambda){
  lambda = Math.max(0, lambda); let L = Math.exp(-lambda), k=0, p=1;
  do { k++; p *= Math.random(); } while (p > L);
  return k-1;
};

E.buildFeed = function(S, opp, gf, ga, goals, assists, rating, mom, specials){
  const feed = [];
  const total = gf+ga;
  const flags = [];
  for (let i=0;i<gf;i++) flags.push(true);
  for (let i=0;i<ga;i++) flags.push(false);
  for (let i=flags.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [flags[i],flags[j]]=[flags[j],flags[i]]; }
  const mins = [];
  for (let i=0;i<total;i++) mins.push(Math.floor(Math.random()*90)+1);
  mins.sort((a,b)=>a-b);
  const myGoalIdx = new Set();
  while (myGoalIdx.size < Math.min(goals, gf)) myGoalIdx.add(Math.floor(Math.random()*gf));
  let gi=0;
  for (let k=0;k<total;k++){
    const m = mins[k];
    if (flags[k]){
      const isMyGoal = myGoalIdx.has(gi); gi++;
      if (isMyGoal){
        // destaque: gol do jogador (classe 'me')
        let verb = (S.pos==='ATA'||S.pos==='MEI') ? (Math.random()<0.5?'finaliza':'manda pro fundo') : 'desvia pra rede';
        feed.push({min:m, t:`GOL do ${S.teamName}! ${S.name} ${verb} aos ${m}'.`, c:'me'});
      } else {
        feed.push({min:m, t:`GOL do ${S.teamName}! Lance coletivo (sem o ${S.name}).`, c:''});
      }
    } else {
      feed.push({min:m, t:`GOL do ${opp.n}. A defesa vacila.`, c:''});
    }
  }
  // jogadas especiais em destaque
  for (const sg of (specials||[])){
    const m = Math.floor(Math.random()*90)+1;
    feed.push({min:m, t:`🌟 ${sg.label.toUpperCase()}: ${S.name} ${sg.verb} aos ${m}'!`, c:'special'});
  }
  if (S.pos==='GOL' && ga>0) feed.push({min:Math.floor(Math.random()*90)+1, t:`${S.name} faz DEFESAÇA de dar arrepios.`, c:'a'});
  if (assists>0) feed.push({min:Math.floor(Math.random()*90)+1, t:`${S.name} dá linda assistência (${assists}x).`, c:'me'});
  if (mom) feed.push({min:90, t:`FIM: ${S.name} é o HOMEM DO JOGO (nota ${rating.toFixed(1)}).`, c:'me'});
  else feed.push({min:90, t:`FIM: nota de ${S.name}: ${rating.toFixed(1)}.`, c:''});
  feed.sort((a,b)=>a.min-b.min);
  return feed;
};

E.advanceWeek = function(S, liveMods){
  const wk = S.calendar[S.calIdx];
  let matchRes = null;
  if (wk && wk.type==='match'){
    const r = E.simMatch(S, wk.opp, !!wk.comp);
    // ----- APLICAÇÃO DOS QTEs AO VIVO (se vieram da tela ao vivo) -----
    if (liveMods){
      const simGoals = r.goals||0, simAssists = r.assists||0, simGa = r.ga||0;
      // QTEs treinam atributos (acerto sobe, erro desce) — aplica ANTES de acumular
      if (liveMods.attrDeltas){
        S.attrs = S.attrs || {};
        const validKs = (S.pos && POSITIONS[S.pos]) ? POSITIONS[S.pos].attrs : null;
        for (const k in liveMods.attrDeltas){
          if (validKs && validKs.indexOf(k) < 0) continue; // só atributos reconhecidos da posição
          const cur = S.attrs[k] || 50;
          S.attrs[k] = Math.max(1, Math.min(99, +(cur + liveMods.attrDeltas[k]).toFixed(1)));
        }
      }
      if (typeof liveMods.goals==='number') r.goals = Math.max(0, liveMods.goals);
      if (typeof liveMods.assists==='number') r.assists = Math.max(0, liveMods.assists);
      if (typeof liveMods.rating==='number') r.rating = Math.max(5, Math.min(10, (r.rating||7) + liveMods.rating));
      if (typeof liveMods.gaSaved==='number') r.ga = Math.max(0, simGa - liveMods.gaSaved);
      // gf do TIME: mantém os gols dos companheiros da simulação E acomoda os gols
      // que o jogador marcou/armou via QTE (cada assistência vira gol de companheiro).
      const companionGoals = Math.max(0, (r.gf||0) - simGoals);
      r.gf = Math.max(r.gf, companionGoals + (r.goals||0) + (r.assists||0));
      // coerência: não dá pra ter mais assistências que gols do time menos os gols do jogador
      r.assists = Math.min(r.assists || 0, Math.max(0, r.gf - (r.goals||0)));
      // recalcula placar/res
      r.res = r.gf>r.ga ? 'V' : r.gf<r.ga ? 'D' : 'E';
      // special do arquétipo se houve gol/assist e QTE pediu
      if (liveMods.special && r.goals>0){
        const A = resolveArchetype(S.archetype);
        if (A && A.signature && A.signature.specialChance){
          r.specials = r.specials||[];
          r.specials.push({ k:S.archetype, label: A.signature.specialLabel||'Jogada de Classe', verb: A.signature.specialVerb||'decide' });
        }
      }
    }
    E.applyGodMode(S, r); // god mode: força vitória/placar (após QTEs)
    matchRes = r;
    const isCup = !!wk.comp && (wk.comp !== S.leagueId || ((S.comps||[]).find(c=>c.compId===wk.comp)||{}).type !== 'pontos');
    if (!isCup){
      S.table.gf += r.gf; S.table.ga += r.ga;
      if (r.res==='V'){S.table.w++;S.table.p+=3;} else if (r.res==='E'){S.table.d++;S.table.p+=1;} else S.table.l++;
      // ----- LIGA REAL: aplica o SEU jogo na tabela da liga -----
      E.applyLeagueResult(S, S.teamName, wk.opp.n, r.gf, r.ga);
      // simula os DEMAIS jogos da rodada (rivais) e atualiza tabela + artilharia
      E.simOtherMatches(S, wk);
      // ----- ARTILHARIA: seus gols entram na lista -----
      if (r.goals > 0) E.addScorer(S, S.name, r.goals, S.teamName, true);
    } else {
      // COMPETIÇÃO PARALELA (estadual/copa/continental/etc): aplica na tabela/fase da comp
      E.applyCompResult(S, wk.comp, S.teamName, wk.opp.n, r.gf, r.ga, wk);
      E.advanceCompPhase(S, wk.comp, wk, r);
      if (r.goals > 0) E.addScorer(S, S.name, r.goals, S.teamName, true);
    }
    const sm = {opp:wk.opp.n, ovr:wk.opp.o, gf:r.gf, ga:r.ga, res:r.res, rating:r.rating, goals:r.goals, assists:r.assists, mom:r.mom, cup:isCup, comp:wk.comp||null, penalties:r.penalties||null, specials:r.specials?r.specials.map(s=>s.label):[]};
    S.seasonMatches.push(sm);
    // acumula TEMPORADA
    const ss = S.seasonStats;
    ss.games++; if(isCup) ss.cupGames++;
    if(r.res==='V'){ss.wins++; const diff=r.gf-r.ga; if(diff>ss.biggestWin)ss.biggestWin=diff;}
    else if(r.res==='E')ss.draws++; else ss.losses++;
    ss.goals += r.goals; ss.assists += r.assists; ss.goalsConceded += r.ga;
    if((S.pos==='GOL') && r.ga===0) ss.cleanSheets++;
    if(r.mom) ss.mom++; if(r.goals>=3) ss.hatTricks++;
    if(r.rating>ss.bestRating) ss.bestRating=+r.rating.toFixed(1);
    if(r.rating<ss.worstRating) ss.worstRating=+r.rating.toFixed(1);
    // acumula CARREIRA
    const cs = S.careerStats;
    cs.games++; if(isCup) cs.cupGames++;
    if(r.res==='V'){cs.wins++; const diff=r.gf-r.ga; if(diff>cs.biggestWin)cs.biggestWin=diff;}
    else if(r.res==='E')cs.draws++; else cs.losses++;
    cs.goals += r.goals; cs.assists += r.assists; cs.goalsConceded += r.ga;
    if((S.pos==='GOL') && r.ga===0) cs.cleanSheets++;
    if(r.mom) cs.mom++; if(r.goals>=3) cs.hatTricks++;
    if(r.rating>cs.bestRating) cs.bestRating=+r.rating.toFixed(1);
    if(r.rating<cs.worstRating) cs.worstRating=+r.rating.toFixed(1);
    cs.teamsPlayed[S.teamName] = true;
    // ----- RECORDES (Seus Recordes) -----
    const rec = S.records;
    if(r.res==='V'||r.res==='E'){ rec.curStreak++; if(rec.curStreak>rec.bestStreak) rec.bestStreak=rec.curStreak; }
    else rec.curStreak=0;
    if(r.goals>rec.mostGoalsGame) rec.mostGoalsGame=r.goals;
    if(r.assists>rec.mostAssistsGame) rec.mostAssistsGame=r.assists;
    if(r.rating>rec.bestRating) rec.bestRating=+r.rating.toFixed(1);
    S.form = Math.max(1, Math.min(5, S.form + (r.res==='V'?1:r.res==='D'?-1:0)));
    S.morale = Math.max(20, Math.min(100, S.morale + (r.res==='V'?8:r.res==='D'?-6:2)));
    S.career.push(`Sem ${S.calIdx+1}: ${S.teamName} ${r.gf}x${r.ga} ${wk.opp.n} — nota ${r.rating}${r.goals?' · G'+r.goals:''}${r.assists?' A'+r.assists:''}${r.specials&&r.specials.length?' · '+r.specials.map(s=>s.label).join(', '):''}.`);
    // ARQUÉTIPO: verifica marco de mutação (posição) + despertar mental (gating)
    E.checkMutation(S);
    E.checkMentalAwaken(S);
  } else {
    const plan = S.pendingTrain || S.trainPlan;
    E.trainGain(S, plan);
    S.career.push(`Sem ${S.calIdx+1}: treino (${plan.n}).`);
    S.pendingTrain = null;
  }
  S.sMeEvo.push({s:S.season, o:S.ovr, r: matchRes?matchRes.rating:S.ovr/10});
  S.calIdx++;
  // S.week reflete a GAMEWEEK da próxima entrada (não incrementa 1 por entrada):
  // gameweeks podem ter 2 jogos (weekend+midweek) na mesma semana.
  const _nxt = S.calendar[S.calIdx];
  S.week = _nxt ? (_nxt.week || (S.week+1)) : (wk.week || S.week);
  // janela de transferências na METADE da temporada (uma vez por temporada)
  if (S._midWin !== S.season && S.calIdx >= Math.floor(S.calendar.length/2)){
    S.offers = E.genOffers(S); S.pendingTransfer = true; S._midWin = S.season;
  }
  if (S.calIdx >= S.calendar.length) E.endSeason(S);
  return matchRes;
};

E.evolveLeague = function(S){
  if (!S.leagueTeams || !S.leagueTeams.length) S.leagueTeams = _copyLeagueTeams(S.leagueId);
  const table = E.getLeagueTable(S); if (!table || !table.length) return;
  const n = table.length;
  const posOf = {}; table.forEach((r,i)=> posOf[r.n] = i+1);
  const topN = Math.max(2, Math.ceil(n/3)), botN = n - Math.max(2, Math.ceil(n/3));
  S.leagueTeams.forEach(t=>{
    const p = posOf[t.n] || (n+1);
    let delta = 0;
    if (p <= 2) delta = 2;
    else if (p <= topN) delta = 1;
    else if (p >= n-1) delta = -2;
    else if (p > botN) delta = -1;
    delta += (Math.random()<0.5?-1:1) * Math.floor(Math.random()*2); // ruído de mercado
    t.o = _clamp(t.o + delta, 55, 92);
  });
  const myTeam = S.leagueTeams.find(t=>t.n===S.teamName);
  if (myTeam) S.teamOvr = myTeam.o;
};

function _leagueTieWin(S, opponentOvr){
  return Math.random() < _clamp(.5 + ((S.teamOvr||70)-(opponentOvr||70))*.018, .22, .78);
}

E.resolveLeagueOutcome = function(S, league, table, pos){
  const n=table.length, out={champion:false,promoted:false,relegated:false,decision:''};
  if(league.id==='bra-sa'){
    out.champion=pos===1;out.relegated=pos>n-4;
  }else if(league.id==='bra-sb'){
    out.champion=pos===1;out.relegated=pos>n-4;
    if(pos<=2){out.promoted=true;out.decision='acesso direto pelo G2';}
    else if(pos>=3&&pos<=6){
      const rivalPos=pos===3?6:pos===4?5:pos===5?4:3;
      out.promoted=_leagueTieWin(S,(table[rivalPos-1]||{}).o||S.teamOvr);
      out.decision=`playoff ${pos}º x ${rivalPos}º em ida e volta: ${out.promoted?'classificado':'eliminado'}`;
    }
  }else if(league.id==='bra-sc'){
    out.relegated=pos>n-2;
    if(pos<=8){
      const chance=_clamp(.72-(pos-1)*.055+((S.teamOvr||68)-68)*.015,.25,.82);
      out.promoted=Math.random()<chance;out.decision=`quadrangular final: ${out.promoted?'terminou no G2 e subiu':'ficou fora do G2'}`;
      out.champion=out.promoted&&Math.random()<.25;
    }
  }else if(league.id==='bra-sd'){
    // Série D real: fase de grupos (6 times, ida/volta) + mata-mata (idas/voltas). 6 sobem.
    const comp=(S.comps||[]).find(c=>c.compId==='bra-sd');
    const tbl=comp?E.getCompTable(S,'bra-sd'):[];
    const groupPos=tbl.findIndex(r=>r.me)+1;
    const passedGroup=groupPos>0&&groupPos<=4;
    out.champion=!!(comp&&comp.status==='campeao');
    if(out.champion){out.promoted=true;out.decision='campeão da Série D: acesso direto à Série C';}
    else if(comp&&comp.phase>=3){out.promoted=true;out.decision='semifinalista da Série D: acesso à Série C';}
    else if(comp&&comp.phase===2){out.promoted=_leagueTieWin(S,70);out.decision=out.promoted?'venceu o playoff de acesso à Série C (eliminado nas quartas)':'perdeu o playoff de acesso à Série C';}
    else if(passedGroup){out.decision='classificado ao mata-mata (oitavas de final)';}
    else{out.decision='eliminado na fase de grupos da Série D';}
  }else if(league.id==='bra-varzea'){
    out.champion=pos===1;out.promoted=out.champion;out.decision=out.promoted?'classificado à Série D':'';
  }else{
    out.champion=pos===1;out.relegated=pos>n-2;
  }
  return out;
};

E.moveClubDivision = function(S, targetLeague){
  const current=(S.leagueTeams||[]).find(t=>t.n===S.teamName)||{n:S.teamName,o:S.teamOvr,c:targetLeague.code,stars:[],honours:{}};
  let target=_copyLeagueTeams(targetLeague.id,S.teamName), expected=target.length;
  const alreadyListed=target.some(t=>t.n===S.teamName);
  target=target.filter(t=>t.n!==S.teamName);
  if(target.length){if(!alreadyListed&&target.length>=expected)target.pop();target.push({n:current.n,o:current.o,c:targetLeague.code,stars:current.stars||[],honours:current.honours||{}});}
  else target=[current];
  S.leagueId=targetLeague.id;S.tierIndex=TIERS.indexOf(targetLeague);S.leagueTeams=target;S.teamOvr=current.o;
};

E.endSeason = function(S){
  E.maintainGodMode(S);
  const league=LEAGUE_BY_ID(S.leagueId),table=E.getLeagueTable(S),pos=table.findIndex(r=>r.me)+1;
  const outcome=E.resolveLeagueOutcome(S,league,table,pos);
  const leagueComp=(S.comps||[]).find(c=>c.compId===league.id);
  if(leagueComp&&outcome.champion)leagueComp.status='campeao';
  if(typeof E.finishCompetitions==='function')E.finishCompetitions(S,pos);
  const ss=S.seasonStats;
  const summary={season:S.season,league:league.name,team:S.teamName,w:S.table.w,d:S.table.d,l:S.table.l,pts:S.table.p,gf:S.table.gf,ga:S.table.ga,
    games:ss.games,goals:ss.goals,assists:ss.assists,mom:ss.mom,best:+(ss.bestRating||0).toFixed(1),worst:+(ss.worstRating||10).toFixed(1),
    champ:outcome.champion,pos,ovrEnd:S.ovr,pot:S.pot,promoted:outcome.promoted,relegated:outcome.relegated,accessDecision:outcome.decision,qualifiedNext:(S.nextComps||[]).slice()};
  S.seasonSummary=summary;
  // histórico da liga principal: campeão/vice/posição/pontos/acesso/rebaixamento por temporada
  const tb=table; const champName=tb[0]?tb[0].n:null; const viceName=tb[1]?tb[1].n:null; const meRow=tb.find(r=>r.me);
  S.history=S.history||[]; S.history.push({season:S.season,comp:league.id,name:league.name,champion:champName,runnerUp:viceName,position:pos,pts:meRow?meRow.pts:0,isLeague:true,promoted:outcome.promoted,relegated:outcome.relegated});
  S.career.push(`FIM DA TEMP ${S.season}: ${S.table.w}V ${S.table.d}E ${S.table.l}D (${S.table.p} pts) — ${pos}º na ${league.name} — gols ${ss.goals}, assist ${ss.assists}.`);
  if(outcome.decision)S.career.push(outcome.decision+'.');
  (S.comps||[]).forEach(c=>{
    if(c.status==='campeao'){
      const def=COMP_BY_ID(c.compId)||LEAGUE_BY_ID(c.compId)||{name:c.compId};const t=`🏆 ${def.name} (Temp ${S.season})`;
      if(!S.trophies.includes(t))S.trophies.push(t);S.career.push(`CAMPEÃO da ${def.name}!`);
    }
  });
  E.evolveLeague(S);
  if(outcome.promoted){const adj=ADJ_LEAGUE(league,+1);if(adj){E.moveClubDivision(S,adj);S.salary=Math.round(S.salary*1.5);S.career.push(`ACESSO! O ${S.teamName} disputará a ${adj.name}.`);}}
  else if(outcome.relegated){const adj=ADJ_LEAGUE(league,-1);if(adj){E.moveClubDivision(S,adj);S.salary=Math.round(S.salary*.75);S.career.push(`REBAIXADO! O ${S.teamName} disputará a ${adj.name}.`);}}
  S.season++; S.week=1; S.calIdx=0; S.table={p:0,w:0,d:0,l:0,gf:0,ga:0};
  // recorde de gols em uma temporada
  if (S.seasonStats.goals > (S.records.bestSeasonGoals||0)) S.records.bestSeasonGoals = S.seasonStats.goals;
  S.seasonStats = { games:0, wins:0, draws:0, losses:0, goals:0, assists:0, cleanSheets:0,
    mom:0, goalsConceded:0, bestRating:0, worstRating:10, biggestWin:0, hatTricks:0, cupGames:0 };
  S.seasonMatches=[]; S.sMeEvo=[]; S.comps = null; // recria competições frescas na próxima temporada
  S.calendar = E.genCalendar(S);
  E.initLeague(S); // nova tabela real para a próxima temporada
  S.offers = E.genOffers(S); S.pendingTransfer = true; S._midWin = null;
  S.careerStats.seasons = S.season;
  if (S.age < 40) S.age++;
};

E.genOffers = function(S){
  const cur = LEAGUE_BY_ID(S.leagueId);
  const offers = [];
  const candidates = [];
  const seen = new Set();
  const push = (lg)=>{ if (lg && !seen.has(lg.id)){ seen.add(lg.id); candidates.push(lg); } };
  push(ADJ_LEAGUE(cur, +1)); push(ADJ_LEAGUE(cur, -1));
  // garante ao menos 2 ligas de OUTROS países (transferências internacionais)
  const others = TIERS.filter(t => t.id !== cur.id);
  let guard=0;
  while (candidates.filter(c=>c.code!==cur.code).length < 2 && guard++ < 50 && others.length){
    const r = others[Math.floor(Math.random()*others.length)];
    push(r);
  }
  for (const lg of candidates){
    for (const tm of lg.teams){
      if (tm.n===S.teamName) continue;
      if (tm.o > S.ovr - 2 || Math.random()<0.5){
        const sal = Math.round((tm.o*55) * (1 + (S.ovr-tm.o)/200));
        offers.push({team:tm.n, tier:lg.id, ovr:tm.o, salary:sal, cond:(tm.o>S.ovr?'Clube te quer!':'Aceita o desafio')});
      }
      if (offers.length>=5) break;
    }
    if (offers.length>=5) break;
  }
  return offers.slice(0,5);
};

// Transição coerente de clube (usada por promoção, rebaixamento e transferência):
// troca time/tier/ovr E regera calendário + liga, reiniciando a temporada no novo clube.
// Evita o bug "CRB contra o próprio CRB" (calendário antigo com o time velho como rival).
E.joinTeam = function(S, tier, team, ovr, reason){
  S.leagueId = tier; S.tierIndex = TIERS.findIndex(t=>t.id===tier); S.teamName = team; S.teamOvr = ovr;
  // As vagas pertencem ao clube que as conquistou, não ao jogador transferido.
  if (S.qualificationClub && S.qualificationClub!==team){S.nextComps=[];S.compReasons={};S.qualificationClub=team;}
  S.leagueTeams = _copyLeagueTeams(tier, team); // novo elenco evoluível da liga destino
  S.comps = null;
  S.calendar = E.genCalendar(S);
  E.initLeague(S);
  S.seasonMatches = [];
  S.calIdx = 0; S.week = 1;
  S.table = {p:0,w:0,d:0,l:0,gf:0,ga:0};
  S.sMeEvo = [];
  S.seasonStats = { games:0, wins:0, draws:0, losses:0, goals:0, assists:0, cleanSheets:0,
    mom:0, goalsConceded:0, bestRating:0, worstRating:10, biggestWin:0, hatTricks:0, cupGames:0 };
  S._summaryShown = undefined;
  if (reason) S.career.push(reason);
};

// aceita APENAS 1 oferta; as demais somem
E.acceptOffer = function(S, i){
  const o = S.offers[i]; if (!o) return;
  const reason = `TRANSFERÊNCIA: ${S.name} vai pro ${o.team} (${LEAGUE_BY_ID(o.tier).name}).`;
  S.salary = o.salary; S.offers = []; S.pendingTransfer = false; // contrato assinado: fecha a janela
  E.joinTeam(S, o.tier, o.team, o.ovr, reason);
};

// recusa TODAS as ofertas e segue no clube atual (botão "Ficar no clube")
E.rejectOffers = function(S){
  S.offers = []; S.pendingTransfer = false;
  S.career.push(`TRANSFERÊNCIA: ${S.name} ficou no ${S.teamName}.`);
};

window.E = E;
