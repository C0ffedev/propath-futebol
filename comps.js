// ===== comps.js — ProPath Futebol =====
// Reforma de competições (modelo do Guia): várias competições EM PARALELO.
// Estende o objeto E (engine) e UI. Incluído APÓS engine.js e ui.js no index.html.
// Princípio: NÃO altera E.simMatch (já validado). Apenas organiza o calendário
// do save em múltiplas competições e aplica resultados na comp correta.
(function(){
  if (typeof E === 'undefined') { console.error('comps.js precisa vir após engine.js'); return; }

  // garante que S.comps exista (idempotente)
  E.ensureComps = function(S){
    if (S.comps && S.comps.length) return S.comps;
    return E.buildComps(S);
  };

  // elenco sintético determinístico (estaduais/regionais/etc sem elenco real)
  const SYNTH_NAMES = {
    'bra-paulista':['Corinthians','Palmeiras','São Paulo','Santos','Red Bull Bragantino','Guarani','Ponte Preta','Ituano','Mirassol','Novorizontino','São Bernardo','Água Santa'],
    'bra-carioca':['Flamengo','Vasco','Fluminense','Botafogo','Madureira','Volta Redonda','Bangu','Boavista','Audax Rio','Portuguesa','Nova Iguaçu','Bangu'],
    'bra-mineiro':['Atlético-MG','Cruzeiro','América-MG','Tombense','Pouso Alegre','Villa Nova','Caldense','Uberlândia','Patrocinense','Aymorés','Democrata','Coimbra'],
    'bra-gaucho':['Grêmio','Internacional','Juventude','Caxias','Ypiranga','Brasil de Pelotas','São José','São Luiz','Novo Hamburgo','Avenida','Santa Cruz','Pelotas'],
    'bra-nordeste':['Bahia','Sport','Ceará','Fortaleza','Vitória','Náutico','CRB','CSA','ABC','Treze','Sampaio Corrêa','Ferroviário','Confiança','Altos','Botafogo-PB','Moto Club'],
    'bra-verde':['Paysandu','Remo','Vila Nova','Brasiliense','Cuiabá','Luverdense','Operário','Aparecidense','Anápolis','Real Noroeste','Independente','Rio Branco','Galvez','Porto Velho','São Raimundo','Costa Rica'],
    'bra-sulse':['Athletico-PR','Coritiba','Paraná','Londrina','Ponte Preta','Guarani','Brusque','Figueirense','Chapecoense','Criciúma','Joinville','Avaí','Marcílio Dias','Toledo','Maringá','Operário-PR'],
    'bra-sc':['ABC','Botafogo-PB','Confiança','Ferroviário','Manaus','Paysandu','Volta Redonda','Aparecidense','Amazonas','Remo','Sampaio Corrêa','Figueirense','Criciúma','Atlético-GO','Brusque','Ypiranga','Londrina','Botafogo-SP','Vitória','CSA'],
    'bra-sd':['Maringá','São Bernardo','Ferroviária','Caxias','São Jose','Brasil de Pelotas','Tocantinópolis','Treze','Sousa','Humaitá','River','Altos','CPA','Porto Velho','Real Noroeste','Inter de Limeira','Costa Rica','Novo Hamburgo','Santa Cruz','Penedense','Cianorte','Avenida','São Luiz','Aimoré','FC Cascavel','Iguatu','Maracanã','Água Santa','Portuguesa','Nova Iguaçu']
  };
  function synthTeams(compId, baseOvr){
    const names = SYNTH_NAMES[compId] || ['Time A','Time B','Time C','Time D'];
    return names.map((n,i)=>({ n, o: Math.max(50, Math.min(92, baseOvr + (i%5)-2 + (Math.random()*3-1.5)|0)), c:'BR', stars:[] }));
  }

  // elenco "real" quando a competição casa com TIERS/CUPS
  function compTeams(S, comp){
    const lgId = COMP_LEAGUE_ID(comp);
    if (lgId === S.leagueId) return E.leagueTeams(S); // sua liga atual (elenco evoluível)
    if (lgId && LEAGUE_BY_ID(lgId)) return _copyLeagueTeams(lgId);
    if (comp.id === 'bra-copa'){
      // Copa do Brasil: times de todas as ligas BR (amostra)
      const all = TIERS.filter(t=>t.code==='BR').flatMap(t=>t.teams).slice(0, 20);
      return all;
    }
    if (comp.id === 'sam-lib'){
      const all = TIERS.filter(t=>t.continent==='SAM').flatMap(t=>t.teams).slice(0,16);
      return all;
    }
    // sintético
    const base = (LEAGUE_BY_ID(S.leagueId)||{o:70}).o || 70;
    return synthTeams(comp.id, base);
  }

  // ---------- enrollment: em quais competições o clube entra nesta temporada ----------
  E.enrollComps = function(S){
    const lg = LEAGUE_BY_ID(S.leagueId);
    const comps = [];
    if (!lg) return comps;
    const isBR = lg.code === 'BR';
    // 1) LIGA PRINCIPAL (sempre a do save) — tratada separadamente (S.leagueId),
    //    mas também entra como "comp" para o calendário paralelo.
    comps.push({ compId: lg.id, type: lg.cup? 'mata':'pontos', level:'nacional', isLeague:true });
    if (isBR){
      // 2) ESTADUAL — escolhe pelo estado do clube (default SP). pontos corridos curto.
      const stateMap = { 'CRB':'AL', 'CSA':'AL', 'Santos':'SP', 'Palmeiras':'SP', 'Corinthians':'SP', 'Flamengo':'RJ', 'Vasco':'RJ', 'Fluminense':'RJ', 'Botafogo':'RJ', 'Cruzeiro':'MG', 'Atlético-MG':'MG', 'Grêmio':'RS', 'Internacional':'RS' };
      const st = stateMap[S.teamName] || 'SP';
      const estMap = { SP:'bra-paulista', RJ:'bra-carioca', MG:'bra-mineiro', RS:'bra-gaucho' };
      const estId = estMap[st] || 'bra-paulista';
      comps.push({ compId: estId, type:'pontos', level:'estadual' });
      // 3) COPA DO BRASIL — mata-mata nacional
      comps.push({ compId:'bra-copa', type:'mata', level:'nacional' });
      // 4) REGIONAL — pela região (ex.: Sul-Sudeste se estiver no eixo)
      const regMap = { SP:'bra-sulse', RJ:'bra-sulse', MG:'bra-sulse', RS:'bra-sulse', AL:'bra-nordeste', CE:'bra-nordeste' };
      const regId = regMap[st] || 'bra-sulse';
      comps.push({ compId: regId, type:'mata', level:'regional' });
      // 5) CONTINENTAIS — por desempenho (vagas). Na 1ª temporada, só se já estiver na Série A.
      if (lg.id === 'bra-sa'){
        comps.push({ compId:'sam-lib', type:'mata', level:'continental' });
      }
    }
    return comps;
  };

  // ---------- monta o estado de cada competição (fase/tabela/bracket) ----------
  E.buildComps = function(S){
    const enrolled = E.enrollComps(S);
    const comps = enrolled.map(en => {
      const def = COMP_BY_ID(en.compId) || { id:en.compId, name:en.compId, short:en.compId, level:en.level||'nacional', type:en.type||'pontos' };
      const c = { compId:def.id, name:def.name, short:def.short, level:def.level, type:def.type, status:'active', round:1, myTeam:S.teamName };
      if (def.type === 'pontos'){
        const teams = compTeams(S, def).slice(0, Math.min(def.teams||12, 12));
        if (!teams.find(t=>t.n===S.teamName)) teams.push({ n:S.teamName, o:S.teamOvr||70, c:'BR', stars:[] });
        c.teams = teams;
        c.table = {};
        teams.forEach(t=> c.table[t.n] = { n:t.n, p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 });
      } else if (def.type === 'mata'){
        // chave simples: sorteia adversários sintéticos das oitavas/quartas etc.
        const opp = compTeams(S, def).filter(t=>t.n!==S.teamName);
        c.phase = 1; c.maxPhase = 4; // oitavas->final (4 fases)
        c.opponents = opp;
      } else if (def.type === 'decisao'){
        c.phase = 1; c.maxPhase = 1; c.opponents = compTeams(S, def).filter(t=>t.n!==S.teamName).slice(0,1);
      }
      return c;
    });
    S.comps = comps;
    return comps;
  };

  // ---------- gera calendário MESCLADO (Modelo A): 1 jogo/semana, intercalando comps ----------
  E.genCompCalendar = function(S){
    if (!S.comps || !S.comps.length) return E.genCalendar(S); // fallback saves antigos
    // para cada comp, gera sua lista de "jogos" (rodadas de liga ou fases de copa)
    const queues = S.comps.map(c => {
      if (c.type === 'pontos'){
        const rounds = E._roundPairs(c.teams);
        return rounds.map((rp, ri) => {
          const myPair = rp.find(p => p[0].n===S.teamName || p[1].n===S.teamName);
          if (!myPair) return null;
          const home = myPair[0].n === S.teamName;
          const rival = home ? myPair[1] : myPair[0];
          return { type:'match', comp:c.compId, round: ri+1, opp: rival, home };
        }).filter(Boolean);
      } else if (c.type === 'mata' || c.type === 'decisao'){
        // cada fase = 1 jogo (ida simples). gera maxPhase jogos.
        const out = [];
        for (let ph=1; ph<=(c.maxPhase||1); ph++){
          const pool = c.opponents && c.opponents.length ? c.opponents : [ {n:'Adversário', o:70} ];
          const opp = pool[(ph-1) % pool.length];
          out.push({ type:'match', comp:c.compId, round: ph, opp: { n: opp.n, o: opp.o }, home: (ph%2===1) });
        }
        return out;
      }
      return [];
    });
    // mescla intercalando (round-robin das filas) — evita 2 jogos da mesma comp seguidos quando possível
    const cal = [];
    let added = true;
    while (added){
      added = false;
      for (let qi=0; qi<queues.length; qi++){
        const q = queues[qi];
        if (q.length){
          cal.push(q.shift());
          added = true;
        }
      }
    }
    // semanas de treino a cada 3 jogos (mantém progressão de atributos)
    const cal2 = [];
    cal.forEach((wk, i) => {
      cal2.push(wk);
      if ((i+1) % 3 === 0 && i < cal.length-1) cal2.push({ type:'train' });
    });
    return cal2;
  };

  // aplicar resultado na competição correta
  E.applyCompResult = function(S, compId, aName, bName, gf, ga){
    const c = (S.comps||[]).find(x=>x.compId===compId);
    if (!c || c.type!=='pontos' || !c.table) return;
    const A=c.table[aName], B=c.table[bName];
    if (!A||!B) return;
    A.p++;B.p++;A.gf+=gf;A.ga+=ga;B.gf+=ga;B.ga+=gf;
    if (gf>ga){A.w++;B.l++;A.pts+=3;} else if (gf<ga){B.w++;A.l++;B.pts+=3;} else {A.d++;B.d++;A.pts++;B.pts++;}
  };
  E.getCompTable = function(S, compId){
    const c = (S.comps||[]).find(x=>x.compId===compId);
    if (!c || !c.table) return [];
    return Object.values(c.table).map(r=>({n:r.n,p:r.p,w:r.w,d:r.d,l:r.l,gf:r.gf,ga:r.ga,sg:r.gf-r.ga,pts:r.pts,me:r.n===S.teamName})).sort((a,b)=>b.pts-a.pts||(b.sg-a.sg)||(b.gf-a.gf));
  };
  // avança fase de copa (mata): marca se o jogador passou
  E.advanceCompPhase = function(S, compId, won){
    const c = (S.comps||[]).find(x=>x.compId===compId);
    if (!c) return;
    if (c.type==='mata' || c.type==='decisao'){
      if (won && c.phase < (c.maxPhase||1)) c.phase++;
      else if (!won) c.status='eliminado';
      else if (won && c.phase >= (c.maxPhase||1)) c.status='campeao';
    }
  };

  // expõe para UI
  E.COMP_LEVEL = COMP_LEVEL;
  E.COMP_BY_ID = COMP_BY_ID;
})();
