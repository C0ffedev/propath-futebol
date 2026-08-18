// ===== comps.js — competições paralelas e classificação esportiva =====
(function(){
  if (typeof E === 'undefined') { console.error('comps.js precisa vir após engine.js'); return; }

  const STATE_TEAMS = {
    'bra-paulista':['Corinthians','Palmeiras','São Paulo','Santos','Bragantino','Guarani','Ponte Preta','Mirassol','Novorizontino','São Bernardo','Portuguesa-SP','Botafogo-SP','Noroeste','Velo Clube','Capivariano','Primavera-SP'],
    'bra-carioca':['Flamengo','Vasco','Fluminense','Botafogo','Madureira','Volta Redonda','Boavista','Portuguesa-RJ','Nova Iguaçu','Sampaio Corrêa-RJ','Maricá','Bangu'],
    'bra-mineiro':['Atlético-MG','Cruzeiro','América-MG','Tombense','Pouso Alegre','Villa Nova','Uberlândia','Aymorés','Democrata-GV','Betim','Athletic','Itabirito'],
    'bra-paranaense':['Athletico-PR','FC Cascavel','Foz do Iguaçu','Londrina','Maringá','São Joseense','Andraus','Azuriz','Cianorte','Coritiba','Galo Maringá','Operário-PR'],
    'bra-gaucho':['Grêmio','Internacional','Juventude','Caxias','Ypiranga','São José-RS','São Luiz-RS','Novo Hamburgo','Avenida','Guarany de Bagé','Inter-SM','Monsoon']
  };
  const REGIONAL_GROUPS_2026 = {
    'bra-nordeste':[
      ['Vitória','ASA','Sousa','Itabaiana','Fluminense-PI'],
      ['Juazeirense','CRB','Botafogo-PB','Confiança','Piauí'],
      ['Ceará','Sport Recife','América-RN','Imperatriz','Ferroviário'],
      ['Fortaleza','Retrô','ABC','Maranhão','Jacuipense']
    ],
    'bra-verde':[
      ['Nacional-AM','Paysandu','Independência-AC','Guaporé','Trem','GAS-RR'],
      ['Amazonas','Remo','Galvez','Porto Velho','Águia de Marabá','Monte Roraima'],
      ['Primavera-MT','Vila Nova','Capital-DF','Rio Branco-ES','Araguaína','Operário-MS'],
      ['Cuiabá','Atlético-GO','Gama','Porto Vitória','Tocantinópolis','Anápolis']
    ],
    'bra-sulse':[
      ['Sampaio Corrêa-RJ','Novorizontino','Caxias','Tombense','Cianorte','Chapecoense'],
      ['Volta Redonda','São Bernardo','Juventude','América-MG','Operário-PR','Avaí']
    ]
  };
  const REGIONAL_TEAMS = Object.fromEntries(Object.entries(REGIONAL_GROUPS_2026).map(([id,groups])=>[id,groups.flat()]));
  const SOUTH_AMERICAN_TEAMS = [
    ['River Plate','AR',84],['Boca Juniors','AR',84],['Racing','AR',81],['Estudiantes','AR',80],['Rosario Central','AR',78],['Lanús','AR',79],
    ['Nacional','UY',79],['Peñarol','UY',80],['Liverpool-URU','UY',74],['Defensor Sporting','UY',74],
    ['Atlético Nacional','CO',79],['Millonarios','CO',78],['Junior','CO',77],['Santa Fe','CO',77],
    ['Colo-Colo','CL',78],['Universidad de Chile','CL',76],['Universidad Católica','CL',76],['Coquimbo Unido','CL',74],
    ['Cerro Porteño','PY',77],['Olimpia','PY',78],['Libertad','PY',78],['Guaraní-PY','PY',74],
    ['Alianza Lima','PE',76],['Universitario','PE',77],['Sporting Cristal','PE',76],['Cusco FC','PE',72],
    ['LDU Quito','EC',80],['Independiente del Valle','EC',81],['Barcelona SC','EC',78],['Emelec','EC',76],
    ['Bolívar','BO',76],['The Strongest','BO',75],['Always Ready','BO',73],
    ['Deportivo Táchira','VE',72],['Caracas','VE',72],['Deportivo La Guaira','VE',71]
  ].map(x=>({n:x[0],c:x[1],o:x[2],stars:[]}));
  const WORLD_TEAMS = ['Real Madrid','Manchester City','Bayern München','Paris Saint-Germain','Inter de Milão','Al Ahly','Monterrey','Seattle Sounders','Urawa Reds','Al Hilal','Wydad','Auckland City'].map((n,i)=>({n,o:88-(i%6),c:'INT',stars:[]}));
  const INITIAL_2026 = {
    'sam-lib':['Flamengo','Palmeiras','Cruzeiro','Mirassol','Fluminense','Botafogo','Bahia'],
    'sam-sula':['Atlético-MG','São Paulo','Grêmio','Vasco','Santos','Bragantino'],
    'bra-super':['Flamengo','Corinthians'],'sam-recopa':['Flamengo'],'world-inter':['Flamengo']
  };

  function team(n,base,code){
    const known=TIERS.flatMap(t=>t.teams).find(t=>t.n===n);
    const state=(known&&(known.state||known.uf))||(typeof UF_BY_TEAM!=='undefined'&&UF_BY_TEAM[n])||stateOf(n)||null;
    return known?{n:known.n,o:known.o,c:known.c,state,region:known.region||null,stars:known.stars||[]}:{n,o:base||70,c:code||'BR',state,region:state&&REGION_BY_UF[state],stars:[]};
  }
  function uniqueTeams(list){const seen=new Set();return list.filter(t=>t&&!seen.has(t.n)&&seen.add(t.n));}
  function stateOf(name){
    const known=TIERS.flatMap(t=>t.teams).find(t=>t.n===name);
    if(known&&(known.state||known.uf))return known.state||known.uf;
    if(typeof UF_BY_TEAM!=='undefined'&&UF_BY_TEAM[name])return UF_BY_TEAM[name];
    for(const id in STATE_TEAMS)if(STATE_TEAMS[id].includes(name))return COMP_BY_ID(id).state;
    return null;
  }
  function stateComp(state){const def=(typeof STATE_CHAMPIONSHIPS_2026!=='undefined'?STATE_CHAMPIONSHIPS_2026:[]).find(c=>c.state===state);return def&&def.id;}
  function regionalForTeam(name){return Object.keys(REGIONAL_TEAMS).find(id=>REGIONAL_TEAMS[id].includes(name))||null;}
  function regionalForState(state){if(['AL','BA','CE','MA','PB','PE','PI','RN','SE'].includes(state))return'bra-nordeste';if(['AC','AM','AP','DF','ES','GO','MT','MS','PA','RO','RR','TO'].includes(state))return'bra-verde';if(['MG','PR','RJ','RS','SC','SP'].includes(state))return'bra-sulse';return null;}
  function statePool(def){
    const fixed=STATE_TEAMS[def.id]||[];
    const catalog=TIERS.filter(l=>l.code==='BR').flatMap(l=>l.teams).filter(t=>(t.state||t.uf||stateOf(t.n))===def.state).map(t=>t.n);
    const mapped=typeof UF_BY_TEAM==='undefined'?[]:Object.keys(UF_BY_TEAM).filter(n=>UF_BY_TEAM[n]===def.state);
    return uniqueTeams(fixed.concat(catalog,mapped).map(n=>team(n,66))).slice(0,def.teams||12);
  }
  function hasInitial(id,name){return(INITIAL_2026[id]||[]).includes(name);}
  function qualificationReason(S,id){if(S.compReasons&&S.compReasons[id])return S.compReasons[id];if(S.season===1&&hasInitial(id,S.teamName))return'vaga oficial da temporada inicial de 2026';return'';}
  function isQualified(S,id){return(S.nextComps||[]).includes(id)||(S.season===1&&hasInitial(id,S.teamName));}
  function compTeams(S,def){
    if(def.id===S.leagueId)return E.leagueTeams(S);
    if(def.level==='estadual')return statePool(def);
    if(REGIONAL_TEAMS[def.id])return REGIONAL_TEAMS[def.id].map(n=>team(n,69));
    if(def.id==='bra-copa'){
      // Copa do Brasil: exatamente 126 clubes (Séries A/B/C + complemento da Série D por classificação)
      const abc=[]; ['bra-sa','bra-sb','bra-sc'].forEach(id=>{ const lg=LEAGUE_BY_ID(id); if(lg) abc.push(...lg.teams); });
      const d=LEAGUE_BY_ID('bra-sd').teams.slice().sort((a,b)=>b.o-a.o);
      const seen=new Set(abc.map(t=>t.n)); const extras=[];
      for(const t of d){ if(seen.has(t.n))continue; if(abc.length+extras.length>=126)break; extras.push(t); seen.add(t.n); }
      return abc.concat(extras).slice(0,126);
    }
    const catalogCup=CUPS.find(x=>x.id===def.id);
    if(catalogCup&&catalogCup.type==='national')return uniqueTeams(TIERS.filter(t=>catalogCup.scope.includes(t.code)).flatMap(t=>t.teams));
    if(['sam-lib','sam-sula','sam-recopa'].includes(def.id))return uniqueTeams(TIERS.filter(t=>t.continent==='SAM').flatMap(t=>t.teams).concat(SOUTH_AMERICAN_TEAMS));
    if(def.level==='mundial')return WORLD_TEAMS;
    return[];
  }
  function chooseOpponents(S,def,count){return compTeams(S,def).filter(t=>t.n!==S.teamName).sort(()=>Math.random()-.5).slice(0,count);}

  const COMP_RULES_VERSION=4;
  E.ensureComps=function(S){
    if(S.compRulesVersion===COMP_RULES_VERSION&&S.comps&&S.comps.length&&S.comps.every(c=>!['pontos','pontos_mata'].includes(c.type)||(c.table&&Object.keys(c.table).length)))return S.comps;
    const comps=E.buildComps(S);S.compRulesVersion=COMP_RULES_VERSION;return comps;
  };
  E.enrollComps=function(S){
    const lg=LEAGUE_BY_ID(S.leagueId),out=[];if(!lg)return out;
    out.push({compId:lg.id,isLeague:true,reason:'divisão atual do clube'});
    if(lg.code!=='BR'){
      if(lg.cup)out.push({compId:lg.cup,reason:'participante da divisão nacional'});
      return out;
    }
    if(lg.id==='bra-varzea')return out;
    const st=stateOf(S.teamName),est=stateComp(st),reg=regionalForTeam(S.teamName)||['bra-nordeste','bra-verde','bra-sulse'].find(id=>isQualified(S,id));
    if(est)out.push({compId:est,reason:'clube filiado à federação estadual'});
    const continental=isQualified(S,'sam-lib')||isQualified(S,'sam-sula');
    if(reg&&!continental&&(S.season===1||isQualified(S,reg)))out.push({compId:reg,reason:S.season===1?'classificação oficial para a edição de 2026':'vaga conquistada no estadual anterior'});
    if(lg.id==='bra-sa'||isQualified(S,'bra-copa')||S.season===1)out.push({compId:'bra-copa',reason:lg.id==='bra-sa'?'Série A: entrada na 5ª fase':'vaga estadual ou nacional'});
    ['bra-super','sam-lib','sam-sula','sam-recopa','world-inter','world-club'].forEach(id=>{if(isQualified(S,id))out.push({compId:id,reason:qualificationReason(S,id)});});
    return out;
  };
  E.buildComps=function(S){
    S.comps=E.enrollComps(S).map(en=>{
      const cupDef=CUPS.find(x=>x.id===en.compId);
      const def=COMP_BY_ID(en.compId)||(cupDef?Object.assign({},cupDef,{level:cupDef.type==='national'?'nacional':'continental',type:'mata',phases:5}):null)||Object.assign({id:en.compId,name:en.compId,short:en.compId,level:'nacional',type:'pontos'},LEAGUE_BY_ID(en.compId)||{});
      const c={compId:def.id,name:def.name,short:def.short,level:def.level||'nacional',type:def.type||'pontos',status:'active',round:1,phase:0,myTeam:S.teamName,isLeague:!!en.isLeague,reason:en.reason||''};
      const fmt=(LEAGUE_BY_ID(en.compId)||{}).format;
      if(fmt==='serie-d'){
        // Série D: 16 grupos de 6; fase de grupos (ida/volta) + mata-mata (idas e voltas). 6 sobem.
        const sdLeague=LEAGUE_BY_ID('bra-sd');
        const allGroups=sdLeague.groups||[];
        const myGroupNames=allGroups.find(g=>g.includes(S.teamName))||allGroups[0]||[];
        const group=myGroupNames.map(n=>{ const t=(sdLeague.teams||[]).find(x=>x.n===n); return t||{n,o:62,c:'BR',stars:[]}; });
        c.type='grupos_mata'; c.groupGames=10; c.maxPhase=4; c.groupAdvance=4; c.isLeague=true;
        c.teams=group.map(t=>({n:t.n,o:t.o,c:t.c||'BR',stars:t.stars||[]})).filter((t,i,a)=>a.findIndex(x=>x.n===t.n)===i);
        if(!c.teams.find(t=>t.n===S.teamName)) c.teams.unshift({n:S.teamName,o:S.teamOvr,c:'BR',stars:[]});
        c.table={}; c.teams.forEach(t=>c.table[t.n]={n:t.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
        c.opponents=chooseOpponents(S,def,8); // adversários do mata-mata (times da D fora do grupo)
      } else if(c.type==='pontos'){
        let teams=compTeams(S,def);if(!c.isLeague)teams=teams.slice(0,def.teams||12);
        teams=teams.filter(t=>t.n!==S.teamName);teams.unshift(team(S.teamName,S.teamOvr,'BR'));c.teams=uniqueTeams(teams);
        c.table={};c.teams.forEach(t=>c.table[t.n]={n:t.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
      }else if(c.type==='pontos_mata'){
        let teams=compTeams(S,def).filter(t=>t.n!==S.teamName);teams.unshift(team(S.teamName,S.teamOvr,'BR'));
        c.teams=uniqueTeams(teams);const eligibleRounds=E._roundPairs(c.teams).filter(r=>r.some(p=>p[0].n===S.teamName||p[1].n===S.teamName));
        c.groupGames=Math.min(def.groupGames||8,eligibleRounds.length);c.qualify=Math.min(def.qualify||8,c.teams.length);
        c.maxPhase=def.knockoutPhases||3;c.phaseLegs=def.phaseLegs||[1,1,1];c.rounds=eligibleRounds.slice(0,c.groupGames);
        c.table={};c.teams.forEach(t=>c.table[t.n]={n:t.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});c.opponents=chooseOpponents(S,def,c.maxPhase);
      }else if(c.type==='grupos_mata'){
        c.groupGames=def.groupGames||6;c.maxPhase=def.knockoutPhases||4;
        c.phaseLegs=def.phaseLegs||null;
        const official=REGIONAL_GROUPS_2026[def.id];
        if(official){
          let groupIndex=official.findIndex(g=>g.includes(S.teamName));
          if(groupIndex<0){const st=stateOf(S.teamName);groupIndex=def.id==='bra-verde'&&['DF','ES','GO','MT','MS','TO'].includes(st)?2:0;}
          let own=official[groupIndex]||[];if(!own.includes(S.teamName))own=own.slice(0,Math.max(0,own.length-1)).concat(S.teamName);
          c.groupName=String.fromCharCode(65+groupIndex);
          c.teams=own.map(n=>team(n,69));
          if(def.id==='bra-nordeste'){const pair=groupIndex%2===0?groupIndex+1:groupIndex-1;c.crossOpponents=(official[pair]||[]).map(n=>team(n,69));}
          else if(def.id==='bra-sulse')c.crossOpponents=(official[groupIndex===0?1:0]||[]).map(n=>team(n,69));
          c.groupGames=c.crossOpponents?c.crossOpponents.length:c.teams.length-1;
          c.opponents=official.flat().filter(n=>n!==S.teamName).map(n=>team(n,69)).slice(0,Math.max(c.maxPhase,4));
        }else{
          const groupOpponents=c.groupGames===6?3:c.groupGames;
          c.teams=[team(S.teamName,S.teamOvr,'BR')].concat(chooseOpponents(S,def,groupOpponents));
          c.opponents=chooseOpponents(S,def,Math.max(c.maxPhase,4));
        }
        c.table={};c.teams.forEach(t=>c.table[t.n]={n:t.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
      }else{
        c.maxPhase=def.phases||1;c.legs=def.legs||1;
        c.startPhase=def.id==='bra-copa'?(LEAGUE_BY_ID(S.leagueId).id==='bra-sa'?5:LEAGUE_BY_ID(S.leagueId).id==='bra-sb'?2:1):1;
        c.phase=c.startPhase;c.opponents=chooseOpponents(S,def,Math.max(c.maxPhase,1));
      }
      return c;
    });return S.comps;
  };

  function leagueRounds(c){if(c.rounds)return c.rounds;let rounds=E._roundPairs(c.teams);if(c.isLeague&&c.compId==='bra-sc')rounds=rounds.slice(0,c.teams.length-1);if(!c.isLeague)rounds=rounds.slice(0,c.teams.length-1);return rounds;}
  function matchFromPair(S,c,pair,round,extra){const home=pair[0].n===S.teamName,rival=home?pair[1]:pair[0];return Object.assign({type:'match',comp:c.compId,round,opp:{n:rival.n,o:rival.o},home},extra||{});}
  function knockoutQueue(S,c){
    const def=COMP_BY_ID(c.compId)||{},out=[];
    for(let phase=(c.startPhase||1);phase<=c.maxPhase;phase++){
      const opp=(c.opponents||[])[phase-1]||{n:'Adversário',o:72};let legs=c.legs||1;
      if(c.phaseLegs&&c.phaseLegs[phase-(c.startPhase||1)]!=null)legs=c.phaseLegs[phase-(c.startPhase||1)];
      else if(c.compId==='bra-copa')legs=(phase>=5&&phase<c.maxPhase)?2:1;
      else if(c.type==='mata'&&def.twoLeggedUntilFinal)legs=phase===c.maxPhase?1:2;
      else if(c.type==='grupos_mata'&&c.level==='regional')legs=phase===1?1:2;
      else if(c.type==='grupos_mata'&&c.compId!=='world-club')legs=phase===c.maxPhase?1:2;
      for(let leg=1;leg<=legs;leg++)out.push({type:'match',comp:c.compId,stage:'knockout',phase,round:phase,leg,legs,opp:{n:opp.n,o:opp.o},home:legs===1||leg===2});
    }return out;
  }
  E.genCompCalendar=function(S){
    if(!S.comps||!S.comps.length)return E.genCalendar(S);
    const entries=S.comps.map(c=>{let q;
      if(c.type==='pontos')q=leagueRounds(c).map((rp,i)=>{const p=rp.find(x=>x[0].n===S.teamName||x[1].n===S.teamName);return p?matchFromPair(S,c,p,i+1):null;}).filter(Boolean);
      if(c.type==='pontos_mata'){
        const group=leagueRounds(c).map((rp,i)=>{const p=rp.find(x=>x[0].n===S.teamName||x[1].n===S.teamName);return p?matchFromPair(S,c,p,i+1,{stage:'group'}):null;}).filter(Boolean);
        q=group.concat(knockoutQueue(S,c));
      }else if(c.type==='grupos_mata'){
        const rivals=c.crossOpponents||c.teams.filter(t=>t.n!==S.teamName);
        const group=rivals.map((opp,i)=>({type:'match',comp:c.compId,stage:'group',round:i+1,opp:{n:opp.n,o:opp.o},home:i%2===0}));
        if(!c.crossOpponents&&c.groupGames>rivals.length)rivals.forEach((opp,i)=>group.push({type:'match',comp:c.compId,stage:'group',round:rivals.length+i+1,opp:{n:opp.n,o:opp.o},home:i%2!==0}));
        q=group.slice(0,c.groupGames).concat(knockoutQueue(S,c));
      }else if(!q)q=knockoutQueue(S,c);
      return {c,q};
    });
    const cal=[],league=entries.find(x=>x.c.isLeague),state=entries.find(x=>x.c.level==='estadual');
    const take=x=>{if(x&&x.q.length)cal.push(x.q.shift());};
    if(state){
      for(let i=0;i<3&&state.q.length;i++)take(state);
      if(league&&league.c.compId==='bra-sa')while(state.q.length){take(league);take(state);}
      else while(state.q.length)take(state);
    }
    let active=true;while(active){active=false;for(const entry of entries){if(entry===state)continue;if(entry.q.length){take(entry);active=true;}}}
    const out=[];cal.forEach((wk,i)=>{out.push(wk);if((i+1)%3===0&&i<cal.length-1)out.push({type:'train'});});return out;
  };

  function applyStanding(row,gf,ga){if(!row)return;row.p++;row.gf+=gf;row.ga+=ga;if(gf>ga){row.w++;row.pts+=3;}else if(gf<ga)row.l++;else{row.d++;row.pts++;}}
  function applyTable(table,a,b,gf,ga){const A=table[a],B=table[b];applyStanding(A,gf,ga);applyStanding(B,ga,gf);}
  function rememberResult(c,round,a,b,gf,ga){c.roundResults=c.roundResults||{};(c.roundResults[round]||(c.roundResults[round]=[])).push({home:a,away:b,gf,ga});}
  function simulatePointsRound(S,c,wk,a,b,gf,ga){
    c.roundResults=c.roundResults||{};if(c.roundResults[wk.round])return;
    const pairs=(c.rounds||leagueRounds(c))[wk.round-1]||[];
    for(const pair of pairs){const A=pair[0],B=pair[1];let r;
      if((A.n===a&&B.n===b)||(A.n===b&&B.n===a)){const direct=A.n===a;r={gf:direct?gf:ga,ga:direct?ga:gf};}
      else r=E.simMatch({teamOvr:A.o,ovr:A.o,pos:'MEI',form:3,skills:[]},B,false);
      applyTable(c.table,A.n,B.n,r.gf,r.ga);rememberResult(c,wk.round,A.n,B.n,r.gf,r.ga);
    }
  }
  function simulateCrossRound(S,c,wk,a,b,gf,ga){
    c.roundResults=c.roundResults||{};if(c.roundResults[wk.round])return;
    const rivals=c.crossOpponents||[],myIndex=Math.max(0,c.teams.findIndex(t=>t.n===S.teamName));
    c.teams.forEach((A,i)=>{const B=rivals[(i-myIndex+wk.round-1+rivals.length)%rivals.length];if(!B)return;let r;
      if(A.n===a&&B.n===b)r={gf,ga};else r=E.simMatch({teamOvr:A.o,ovr:A.o,pos:'MEI',form:3,skills:[]},B,false);
      applyTable(c.table,A.n,B.n,r.gf,r.ga);rememberResult(c,wk.round,A.n,B.n,r.gf,r.ga);
    });
  }
  E.applyCompResult=function(S,id,a,b,gf,ga,wk){
    const c=(S.comps||[]).find(x=>x.compId===id);if(!c||!c.table||!(c.type==='pontos'||c.type==='pontos_mata'||(c.type==='grupos_mata'&&wk&&wk.stage==='group')))return;
    if(c.type==='pontos_mata')simulatePointsRound(S,c,wk,a,b,gf,ga);
    else if(c.type==='grupos_mata'&&c.crossOpponents)simulateCrossRound(S,c,wk,a,b,gf,ga);
    else {applyTable(c.table,a,b,gf,ga);rememberResult(c,wk.round,a,b,gf,ga);
      if(c.type==='grupos_mata'){const rest=c.teams.filter(t=>t.n!==a&&t.n!==b).slice().sort(()=>Math.random()-.5);for(let i=0;i+1<rest.length;i+=2){const A=rest[i],B=rest[i+1],r=E.simMatch({teamOvr:A.o,ovr:A.o,pos:'MEI',form:3,skills:[]},B,false);applyTable(c.table,A.n,B.n,r.gf,r.ga);rememberResult(c,wk.round,A.n,B.n,r.gf,r.ga);}}
    }
  };
  E.getCompTable=function(S,id){const c=(S.comps||[]).find(x=>x.compId===id);if(!c||!c.table)return[];return Object.values(c.table).map(r=>({n:r.n,p:r.p,w:r.w,d:r.d,l:r.l,gf:r.gf,ga:r.ga,sg:r.gf-r.ga,pts:r.pts,me:r.n===S.teamName})).sort((a,b)=>b.pts-a.pts||b.w-a.w||b.sg-a.sg||b.gf-a.gf||a.n.localeCompare(b.n));};
  E.getCompRoundFixtures=function(S,id,round){
    const c=(S.comps||[]).find(x=>x.compId===id);if(!c)return[];
    if(c.roundResults&&c.roundResults[round])return c.roundResults[round].map(x=>Object.assign({played:true},x));
    if(c.crossOpponents){const rivals=c.crossOpponents,myIndex=Math.max(0,c.teams.findIndex(t=>t.n===S.teamName));return c.teams.map((A,i)=>({home:A.n,away:rivals[(i-myIndex+round-1+rivals.length)%rivals.length].n,played:false}));}
    const rounds=c.rounds||((c.type==='pontos'||c.type==='pontos_mata')?leagueRounds(c):E._roundPairs(c.teams).slice(0,c.groupGames||99));
    return ((rounds&&rounds[round-1])||[]).map(pair=>({home:pair[0].n,away:pair[1].n,played:false}));
  };
  function dropFuture(S,id){S.calendar=S.calendar.filter((wk,i)=>i<=S.calIdx||wk.comp!==id);}
  E.advanceCompPhase=function(S,id,wk,result){
    const c=(S.comps||[]).find(x=>x.compId===id);if(!c)return null;
    if((c.type==='grupos_mata'||c.type==='pontos_mata')&&wk.stage==='group'){
      c.groupPlayed=(c.groupPlayed||0)+1;
      if(c.groupPlayed>=c.groupGames){const pos=E.getCompTable(S,id).findIndex(r=>r.me)+1;c.groupPosition=pos;c.phase=1;const adv=c.groupAdvance||c.qualify||2;if(pos>adv){c.status='eliminado';dropFuture(S,id);return{qualified:false,group:true};}}
      return null;
    }
    if(wk.stage!=='knockout')return null;
    if(!c.tie||c.tie.phase!==wk.phase)c.tie={phase:wk.phase,gf:0,ga:0};c.tie.gf+=result.gf;c.tie.ga+=result.ga;if(wk.leg<(wk.legs||1))return null;
    let won=c.tie.gf>c.tie.ga,penalties=null;if(c.tie.gf===c.tie.ga){won=Math.random()<Math.max(.25,Math.min(.75,.5+(S.teamOvr-(wk.opp.o||70))*.015));penalties=won?'vitória nos pênaltis':'derrota nos pênaltis';result.penalties=penalties;}
    c.lastDecision=penalties||(`${c.tie.gf}x${c.tie.ga} no agregado`);if(!won){c.status='eliminado';if(wk.phase===c.maxPhase)c.runnerUp=true;dropFuture(S,id);}else if(wk.phase>=c.maxPhase)c.status='campeao';else c.phase=wk.phase+1;c.tie=null;return{qualified:won,penalties};
  };

  E.finishCompetitions=function(S,leaguePos){
    const reasons={},next=new Set(),get=id=>(S.comps||[]).find(c=>c.compId===id);const add=(id,reason)=>{next.add(id);reasons[id]=reason;};
    (S.comps||[]).forEach(c=>{if(['pontos','pontos_mata'].includes(c.type)&&!c.isLeague){const pos=E.getCompTable(S,c.compId).findIndex(r=>r.me)+1;c.finalPosition=pos;if(c.type==='pontos'&&pos===1)c.status='campeao';
      // histórico: campeão/vice/posição/pontos por temporada/comp
      const tb=E.getCompTable(S,c.compId); const me=tb.find(r=>r.me); const champ=tb[0]?tb[0].n:null; const vice=tb[1]?tb[1].n:null;
      S.history=S.history||[]; S.history.push({season:S.season,comp:c.compId,name:c.name,champion:champ,runnerUp:vice,position:pos,pts:me?me.pts:0,isLeague:false});
    }});
    const lg=LEAGUE_BY_ID(S.leagueId);if(lg&&lg.code==='BR'&&lg.id!=='bra-varzea'){
      if(lg.id==='bra-sa'){if(leaguePos<=5)add('sam-lib',leaguePos+'º lugar no Brasileirão Série A');else if(leaguePos<=11)add('sam-sula',leaguePos+'º lugar no Brasileirão Série A');add('bra-copa','clube participante da Série A');}
      const copa=get('bra-copa');if(copa&&copa.status==='campeao')add('sam-lib','campeão da Copa do Brasil');if(copa&&copa.runnerUp)add('sam-lib','vice-campeão da Copa do Brasil (pré-Libertadores)');
      const lib=get('sam-lib'),sula=get('sam-sula');if(lib&&lib.status==='campeao'){add('sam-lib','atual campeão da Libertadores');add('sam-recopa','campeão da Libertadores');add('world-inter','campeão da Libertadores');S.worldQualificationHistory=S.worldQualificationHistory||[];S.worldQualificationHistory.push(S.season);}
      if(sula&&sula.status==='campeao'){add('sam-lib','campeão da Sul-Americana');add('sam-recopa','campeão da Sul-Americana');}
      // Supercopa Rei: campeão do Brasileirão × campeão da Copa do Brasil.
      // Se o MESMO clube vencer os dois, o regulamento define o substituto (vice do Brasileirão).
      const brChamp = leaguePos===1;
      const copaChamp = copa && copa.status==='campeao';
      if(brChamp || copaChamp){
        // vice do Brasileirão (2º na tabela da liga)
        let runnerUp=null;
        const lgComp = get(S.leagueId);
        if(lgComp){ const tb=E.getCompTable(S,S.leagueId); runnerUp = tb[1] ? tb[1].n : null; }
        if(brChamp && copaChamp) add('bra-super','campeão brasileiro também campeão da Copa — substituto: vice do Brasileirão ('+(runnerUp||'definido por regulamento')+')');
        else if(brChamp) add('bra-super','campeão brasileiro');
        else add('bra-super','campeão da Copa do Brasil');
      }
      const estadual=(S.comps||[]).find(c=>c.level==='estadual');
      if(estadual&&estadual.finalPosition&&estadual.finalPosition<=4){add('bra-copa',estadual.finalPosition+'º lugar no campeonato estadual');const regional=regionalForState(stateOf(S.teamName));if(regional)add(regional,estadual.finalPosition+'º lugar no campeonato estadual');}
      for(const id of ['bra-nordeste','bra-verde','bra-sulse','bra-sc','bra-sd']){const c=get(id);if(c&&c.status==='campeao')add('bra-copa','campeão de '+c.name);}
      if(lib){S.worldRankingPoints=(S.worldRankingPoints||0)+(lib.groupPosition?Math.max(0,5-lib.groupPosition):0)+(lib.phase||0)*2;}
      const nextSeason=S.season+1;
      if(nextSeason%4===0&&(S.worldQualificationHistory||[]).some(y=>y>=nextSeason-4))add('world-club','campeão da Libertadores no ciclo de quatro anos');
      else if(nextSeason%4===0&&(S.worldRankingPoints||0)>=16)add('world-club','ranking CONMEBOL do ciclo de quatro anos');
    }
    if(next.has('sam-lib'))next.delete('sam-sula');
    S.nextComps=Array.from(next);S.compReasons=reasons;S.qualificationClub=S.teamName;
  };
  E.COMP_LEVEL=COMP_LEVEL;E.COMP_BY_ID=COMP_BY_ID;E.COMP_RULES_VERSION=COMP_RULES_VERSION;
})();
