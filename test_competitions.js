const fs=require('fs');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only'});
const code=['data.js','archetypes.js','engine.js','comps.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n');
dom.window.eval(code+'\nwindow.__E=E;window.__T=TIERS;');
const E=dom.window.__E,T=dom.window.__T;
let failures=0;
function check(name,ok){console.log((ok?'PASS ':'FAIL ')+name);if(!ok)failures++;}

const d=T.find(x=>x.id==='bra-sd');
check('Série D contém 16 grupos de seis',d.groups.length===16&&d.groups.every(g=>g.length===6)&&d.teams.length===96);
for(const [id,expected] of [['bra-sa',38],['bra-sb',38],['bra-sc',19],['bra-sd',10]]){
  const p=E.createPlayer({name:'Calendário '+id,nation:'Brasil',pos:'ATA',age:20,arch:'branco',leagueId:id});
  const leagueGames=p.calendar.filter(w=>w.comp===id).length;
  check(id+' respeita o número de jogos da primeira fase ('+expected+')',leagueGames===expected);
}

const flamengo=E.createPlayer({name:'Teste',nation:'Brasil',pos:'ATA',age:20,arch:'branco',leagueId:'bra-sa'});
flamengo.teamName='Flamengo';flamengo.teamOvr=83;flamengo.leagueTeams=T.find(x=>x.id==='bra-sa').teams.map(x=>({...x,stars:x.stars||[]}));
flamengo.comps=null;E.ensureComps(flamengo);flamengo.calendar=E.genCompCalendar(flamengo);E.initLeague(flamengo);
const ids=flamengo.comps.map(c=>c.compId);
check('Flamengo inicia 2026 na Libertadores',ids.includes('sam-lib'));
check('Flamengo inicia 2026 na Recopa e Intercontinental',ids.includes('sam-recopa')&&ids.includes('world-inter'));
const lib=flamengo.comps.find(c=>c.compId==='sam-lib');
check('Libertadores tem grupo de quatro e seis jogos',lib.teams.length===4&&lib.groupGames===6);
check('Libertadores agenda grupos e mata-mata',flamengo.calendar.some(w=>w.comp==='sam-lib'&&w.stage==='group')&&flamengo.calendar.some(w=>w.comp==='sam-lib'&&w.stage==='knockout'));
const copa=flamengo.comps.find(c=>c.compId==='bra-copa');copa.status='campeao';
check('Série A entra na 5ª fase da Copa do Brasil',copa.startPhase===5&&flamengo.calendar.some(w=>w.comp==='bra-copa'&&w.phase===5));
E.finishCompetitions(flamengo,6);
check('vaga da Libertadores prevalece sobre Sul-Americana',flamengo.nextComps.includes('sam-lib')&&!flamengo.nextComps.includes('sam-sula'));

const b=E.createPlayer({name:'Acesso',nation:'Brasil',pos:'ATA',age:20,arch:'branco',leagueId:'bra-sb'});
const original=b.teamName;
const target=T.find(x=>x.id==='bra-sa');
E.moveClubDivision(b,target);
check('clube mantém o nome ao subir',b.teamName===original&&b.leagueId==='bra-sa'&&b.leagueTeams.some(t=>t.n===original));

const fake={teamOvr:75,calendar:[{comp:'x'}],calIdx:0,teamName:'Meu Clube',comps:[{compId:'x',type:'mata',status:'active',maxPhase:1,phase:1}],};
const result={gf:1,ga:1};
E.advanceCompPhase(fake,'x',{stage:'knockout',phase:1,leg:1,legs:1,opp:{o:75}},result);
check('empate de mata-mata é decidido nos pênaltis',typeof result.penalties==='string');

console.log(failures?'\nREGRAS FAIL ('+failures+')':'\nREGRAS PASS');
process.exit(failures?1:0);
