// ===== comps.js — competições paralelas e classificação esportiva =====
(function(){
  if (typeof E === 'undefined') { console.error('comps.js precisa vir após engine.js'); return; }

  const STATE_TEAMS = {
    'bra-paulista':['Corinthians','Palmeiras','São Paulo','Santos','Red Bull Bragantino','Guarani','Ponte Preta','Ituano','Mirassol','Novorizontino','São Bernardo','Água Santa'],
    'bra-carioca':['Flamengo','Vasco','Fluminense','Botafogo','Madureira','Volta Redonda','Bangu','Boavista','Portuguesa-RJ','Nova Iguaçu','Sampaio Corrêa-RJ','America-RJ'],
    'bra-mineiro':['Atlético-MG','Cruzeiro','América-MG','Tombense','Pouso Alegre','Villa Nova','Uberlândia','Aymorés','Democrata-GV','Betim','Athletic','Itabirito'],
    'bra-gaucho':['Grêmio','Internacional','Juventude','Caxias','Ypiranga','Brasil-RS','São José-RS','São Luiz-RS','Novo Hamburgo','Avenida','Guarany de Bagé','Pelotas']
  };
  const REGIONAL_TEAMS = {
    'bra-nordeste':['Bahia','Sport Recife','Ceará','Fortaleza','Vitória','Náutico','CRB','CSA','ABC','Treze','Sampaio Corrêa-MA','Ferroviário','Confiança','Altos','Botafogo-PB','Moto Club','América-RN','ASA','Sousa','Retrô'],
    'bra-verde':['Paysandu','Remo','Vila Nova','Brasiliense','Cuiabá','Luverdense','Operário-MT','Aparecidense','Gama','Manaus','Águia de Marabá','Tocantinópolis','Rio Branco-ES','Porto Velho','Nacional-AM','Ceilândia','Trem','Manauara','Mixto','Goiatuba','Capital-DF','Real Noroeste','Guaporé','Inhumas'],
    'bra-sulse':['Athletico-PR','Coritiba','Londrina','Maringá','Ponte Preta','Guarani','Brusque','Figueirense','Chapecoense','Criciúma','Joinville','Avaí']
  };
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
    return known?{n:known.n,o:known.o,c:known.c,stars:known.stars||[]}:{n,o:base||70,c:code||'BR',stars:[]};
  }
  function uniqueTeams(list){const seen=new Set();return list.filter(t=>t&&!seen.has(t.n)&&seen.add(t.n));}
  function stateOf(name){
    for(const id in STATE_TEAMS)if(STATE_TEAMS[id].includes(name))return COMP_BY_ID(id).state;
    if(REGIONAL_TEAMS['bra-nordeste'].includes(name))return'NE';
    if(REGIONAL_TEAMS['bra-verde'].includes(name))return'NC';
    return null;
  }
  function stateComp(state){return({SP:'bra-paulista',RJ:'bra-carioca',MG:'bra-mineiro',RS:'bra-gaucho'})[state]||null;}
  function regionalComp(state){if(state==='NE'||['AL','BA','CE','MA','PB','PE','PI','RN','SE'].includes(state))return'bra-nordeste';if(state==='NC')return'bra-verde';return'bra-sulse';}
  function hasInitial(id,name){return(INITIAL_2026[id]||[]).includes(name);}
  function qualificationReason(S,id){if(S.compReasons&&S.compReasons[id])return S.compReasons[id];if(S.season===1&&hasInitial(id,S.teamName))return'vaga oficial da temporada inicial de 2026';return'';}
  function isQualified(S,id){return(S.nextComps||[]).includes(id)||(S.season===1&&hasInitial(id,S.teamName));}
  function compTeams(S,def){
    if(def.id===S.leagueId)return E.leagueTeams(S);
    if(STATE_TEAMS[def.id])return STATE_TEAMS[def.id].map(n=>team(n,68));
    if(REGIONAL_TEAMS[def.id])return REGIONAL_TEAMS[def.id].map(n=>team(n,69));
    if(def.id==='bra-copa')return uniqueTeams(TIERS.filter(t=>t.code==='BR'&&t.id!=='bra-varzea').flatMap(t=>t.teams));
    const catalogCup=CUPS.find(x=>x.id===def.id);
    if(catalogCup&&catalogCup.type==='national')return uniqueTeams(TIERS.filter(t=>catalogCup.scope.includes(t.code)).flatMap(t=>t.teams));
    if(['sam-lib','sam-sula','sam-recopa'].includes(def.id))return uniqueTeams(TIERS.filter(t=>t.continent==='SAM').flatMap(t=>t.teams).concat(SOUTH_AMERICAN_TEAMS));
    if(def.level==='mundial')return WORLD_TEAMS;
    return[];
  }
  function chooseOpponents(S,def,count){return compTeams(S,def).filter(t=>t.n!==S.teamName).sort(()=>Math.random()-.5).slice(0,count);}

  E.ensureComps=function(S){if(S.comps&&S.comps.length&&S.comps.every(c=>c.type!=='pontos'||(c.table&&Object.keys(c.table).length)))return S.comps;return E.buildComps(S);};
  E.enrollComps=function(S){
    const lg=LEAGUE_BY_ID(S.leagueId),out=[];if(!lg)return out;
    out.push({compId:lg.id,isLeague:true,reason:'divisão atual do clube'});
    if(lg.code!=='BR'){
      if(lg.cup)out.push({compId:lg.cup,reason:'participante da divisão nacional'});
      return out;
    }
    if(lg.id==='bra-varzea')return out;
    const st=stateOf(S.teamName),est=stateComp(st),reg=regionalComp(st);
    if(est)out.push({compId:est,reason:'clube filiado à federação estadual'});
    if(!(reg==='bra-nordeste'&&(isQualified(S,'sam-lib')||isQualified(S,'sam-sula'))))out.push({compId:reg,reason:'classificação regional/estadual'});
    if(lg.id==='bra-sa'||isQualified(S,'bra-copa')||S.season===1)out.push({compId:'bra-copa',reason:lg.id==='bra-sa'?'Série A: entrada na 5ª fase':'vaga estadual ou nacional'});
    ['bra-super','sam-lib','sam-sula','sam-recopa','world-inter','world-club'].forEach(id=>{if(isQualified(S,id))out.push({compId:id,reason:qualificationReason(S,id)});});
    return out;
  };
  E.buildComps=function(S){
    S.comps=E.enrollComps(S).map(en=>{
      const cupDef=CUPS.find(x=>x.id===en.compId);
      const def=COMP_BY_ID(en.compId)||(cupDef?Object.assign({},cupDef,{level:cupDef.type==='national'?'nacional':'continental',type:'mata',phases:5}):null)||Object.assign({id:en.compId,name:en.compId,short:en.compId,level:'nacional',type:'pontos'},LEAGUE_BY_ID(en.compId)||{});
      const c={compId:def.id,name:def.name,short:def.short,level:def.level||'nacional',type:def.type||'pontos',status:'active',round:1,phase:0,myTeam:S.teamName,isLeague:!!en.isLeague,reason:en.reason||''};
      if(c.type==='pontos'){
        let teams=compTeams(S,def);if(!c.isLeague)teams=teams.slice(0,def.teams||12);
        teams=teams.filter(t=>t.n!==S.teamName);teams.unshift(team(S.teamName,S.teamOvr,'BR'));c.teams=uniqueTeams(teams);
        c.table={};c.teams.forEach(t=>c.table[t.n]={n:t.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
      }else if(c.type==='grupos_mata'){
        c.groupGames=def.groupGames||6;c.maxPhase=def.knockoutPhases||4;
        const groupOpponents=c.groupGames===6?3:c.groupGames;
        c.teams=[team(S.teamName,S.teamOvr,'BR')].concat(chooseOpponents(S,def,groupOpponents));
        c.table={};c.teams.forEach(t=>c.table[t.n]={n:t.n,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});c.opponents=chooseOpponents(S,def,Math.max(c.maxPhase,4));
      }else{
        c.maxPhase=def.phases||1;c.legs=def.legs||1;
        c.startPhase=def.id==='bra-copa'?(LEAGUE_BY_ID(S.leagueId).id==='bra-sa'?5:LEAGUE_BY_ID(S.leagueId).id==='bra-sb'?2:1):1;
        c.phase=c.startPhase;c.opponents=chooseOpponents(S,def,Math.max(c.maxPhase,1));
      }
      return c;
    });return S.comps;
  };

  function leagueRounds(c){let rounds=E._roundPairs(c.teams);if(c.isLeague&&c.compId==='bra-sc')rounds=rounds.slice(0,c.teams.length-1);if(!c.isLeague)rounds=rounds.slice(0,c.teams.length-1);return rounds;}
  function matchFromPair(S,c,pair,round,extra){const home=pair[0].n===S.teamName,rival=home?pair[1]:pair[0];return Object.assign({type:'match',comp:c.compId,round,opp:{n:rival.n,o:rival.o},home},extra||{});}
  function knockoutQueue(S,c){
    const def=COMP_BY_ID(c.compId)||{},out=[];
    for(let phase=(c.startPhase||1);phase<=c.maxPhase;phase++){
      const opp=(c.opponents||[])[phase-1]||{n:'Adversário',o:72};let legs=c.legs||1;
      if(c.compId==='bra-copa')legs=(phase>=5&&phase<c.maxPhase)?2:1;
      else if(c.type==='mata'&&def.twoLeggedUntilFinal)legs=phase===c.maxPhase?1:2;
      if(c.type==='grupos_mata'&&c.level==='regional')legs=phase===1?1:2;
      else if(c.type==='grupos_mata'&&c.compId!=='world-club')legs=phase===c.maxPhase?1:2;
      for(let leg=1;leg<=legs;leg++)out.push({type:'match',comp:c.compId,stage:'knockout',phase,round:phase,leg,legs,opp:{n:opp.n,o:opp.o},home:legs===1||leg===2});
    }return out;
  }
  E.genCompCalendar=function(S){
    if(!S.comps||!S.comps.length)return E.genCalendar(S);
    const queues=S.comps.map(c=>{
      if(c.type==='pontos')return leagueRounds(c).map((rp,i)=>{const p=rp.find(x=>x[0].n===S.teamName||x[1].n===S.teamName);return p?matchFromPair(S,c,p,i+1):null;}).filter(Boolean);
      if(c.type==='grupos_mata'){
        const group=c.teams.slice(1).map((opp,i)=>({type:'match',comp:c.compId,stage:'group',round:i+1,opp:{n:opp.n,o:opp.o},home:i%2===0}));
        if(c.groupGames>c.teams.length-1)c.teams.slice(1).forEach((opp,i)=>group.push({type:'match',comp:c.compId,stage:'group',round:c.teams.length+i,opp:{n:opp.n,o:opp.o},home:i%2!==0}));
        return group.slice(0,c.groupGames).concat(knockoutQueue(S,c));
      }return knockoutQueue(S,c);
    });
    const cal=[];let active=true;while(active){active=false;for(const q of queues)if(q.length){cal.push(q.shift());active=true;}}
    const out=[];cal.forEach((wk,i)=>{out.push(wk);if((i+1)%3===0&&i<cal.length-1)out.push({type:'train'});});return out;
  };

  function applyTable(table,a,b,gf,ga){const A=table[a],B=table[b];if(!A||!B)return;A.p++;B.p++;A.gf+=gf;A.ga+=ga;B.gf+=ga;B.ga+=gf;if(gf>ga){A.w++;B.l++;A.pts+=3;}else if(gf<ga){B.w++;A.l++;B.pts+=3;}else{A.d++;B.d++;A.pts++;B.pts++;}}
  E.applyCompResult=function(S,id,a,b,gf,ga,wk){
    const c=(S.comps||[]).find(x=>x.compId===id);if(!c||!c.table||!(c.type==='pontos'||(c.type==='grupos_mata'&&wk&&wk.stage==='group')))return;
    applyTable(c.table,a,b,gf,ga);
    if(c.type==='grupos_mata'){const rest=c.teams.filter(t=>t.n!==a&&t.n!==b).slice().sort(()=>Math.random()-.5);for(let i=0;i+1<rest.length;i+=2){const A=rest[i],B=rest[i+1],r=E.simMatch({teamOvr:A.o,ovr:A.o,pos:'MEI',form:3,skills:[]},B,false);applyTable(c.table,A.n,B.n,r.gf,r.ga);}}
  };
  E.getCompTable=function(S,id){const c=(S.comps||[]).find(x=>x.compId===id);if(!c||!c.table)return[];return Object.values(c.table).map(r=>({n:r.n,p:r.p,w:r.w,d:r.d,l:r.l,gf:r.gf,ga:r.ga,sg:r.gf-r.ga,pts:r.pts,me:r.n===S.teamName})).sort((a,b)=>b.pts-a.pts||b.w-a.w||b.sg-a.sg||b.gf-a.gf||a.n.localeCompare(b.n));};
  function dropFuture(S,id){S.calendar=S.calendar.filter((wk,i)=>i<=S.calIdx||wk.comp!==id);}
  E.advanceCompPhase=function(S,id,wk,result){
    const c=(S.comps||[]).find(x=>x.compId===id);if(!c)return null;
    if(c.type==='grupos_mata'&&wk.stage==='group'){
      c.groupPlayed=(c.groupPlayed||0)+1;
      if(c.groupPlayed>=c.groupGames){const pos=E.getCompTable(S,id).findIndex(r=>r.me)+1;c.groupPosition=pos;c.phase=1;if(pos>2){c.status='eliminado';dropFuture(S,id);return{qualified:false,group:true};}}
      return null;
    }
    if(wk.stage!=='knockout')return null;
    if(!c.tie||c.tie.phase!==wk.phase)c.tie={phase:wk.phase,gf:0,ga:0};c.tie.gf+=result.gf;c.tie.ga+=result.ga;if(wk.leg<(wk.legs||1))return null;
    let won=c.tie.gf>c.tie.ga,penalties=null;if(c.tie.gf===c.tie.ga){won=Math.random()<Math.max(.25,Math.min(.75,.5+(S.teamOvr-(wk.opp.o||70))*.015));penalties=won?'vitória nos pênaltis':'derrota nos pênaltis';result.penalties=penalties;}
    c.lastDecision=penalties||(`${c.tie.gf}x${c.tie.ga} no agregado`);if(!won){c.status='eliminado';if(wk.phase===c.maxPhase)c.runnerUp=true;dropFuture(S,id);}else if(wk.phase>=c.maxPhase)c.status='campeao';else c.phase=wk.phase+1;c.tie=null;return{qualified:won,penalties};
  };

  E.finishCompetitions=function(S,leaguePos){
    const reasons={},next=new Set(),get=id=>(S.comps||[]).find(c=>c.compId===id);const add=(id,reason)=>{next.add(id);reasons[id]=reason;};
    (S.comps||[]).forEach(c=>{if(c.type==='pontos'&&!c.isLeague){const pos=E.getCompTable(S,c.compId).findIndex(r=>r.me)+1;c.finalPosition=pos;if(pos===1)c.status='campeao';}});
    const lg=LEAGUE_BY_ID(S.leagueId);if(lg&&lg.code==='BR'&&lg.id!=='bra-varzea'){
      if(lg.id==='bra-sa'){if(leaguePos<=5)add('sam-lib',leaguePos+'º lugar no Brasileirão Série A');else if(leaguePos<=11)add('sam-sula',leaguePos+'º lugar no Brasileirão Série A');add('bra-copa','clube participante da Série A');}
      const copa=get('bra-copa');if(copa&&copa.status==='campeao')add('sam-lib','campeão da Copa do Brasil');if(copa&&copa.runnerUp)add('sam-lib','vice-campeão da Copa do Brasil (pré-Libertadores)');
      const lib=get('sam-lib'),sula=get('sam-sula');if(lib&&lib.status==='campeao'){add('sam-lib','atual campeão da Libertadores');add('sam-recopa','campeão da Libertadores');add('world-inter','campeão da Libertadores');S.worldQualificationHistory=S.worldQualificationHistory||[];S.worldQualificationHistory.push(S.season);}
      if(sula&&sula.status==='campeao'){add('sam-lib','campeão da Sul-Americana');add('sam-recopa','campeão da Sul-Americana');}
      if(leaguePos===1||(copa&&copa.status==='campeao'))add('bra-super',leaguePos===1?'campeão brasileiro':'campeão da Copa do Brasil');
      for(const id of ['bra-paulista','bra-carioca','bra-mineiro','bra-gaucho']){const c=get(id);if(c&&c.finalPosition&&c.finalPosition<=4)add('bra-copa',c.finalPosition+'º lugar no campeonato estadual');}
      for(const id of ['bra-nordeste','bra-verde','bra-sulse','bra-sc','bra-sd']){const c=get(id);if(c&&c.status==='campeao')add('bra-copa','campeão de '+c.name);}
      if(lib){S.worldRankingPoints=(S.worldRankingPoints||0)+(lib.groupPosition?Math.max(0,5-lib.groupPosition):0)+(lib.phase||0)*2;}
      const nextSeason=S.season+1;
      if(nextSeason%4===0&&(S.worldQualificationHistory||[]).some(y=>y>=nextSeason-4))add('world-club','campeão da Libertadores no ciclo de quatro anos');
      else if(nextSeason%4===0&&(S.worldRankingPoints||0)>=16)add('world-club','ranking CONMEBOL do ciclo de quatro anos');
    }
    if(next.has('sam-lib'))next.delete('sam-sula');
    S.nextComps=Array.from(next);S.compReasons=reasons;S.qualificationClub=S.teamName;
  };
  E.COMP_LEVEL=COMP_LEVEL;E.COMP_BY_ID=COMP_BY_ID;
})();
