// test_liga.js — valida a LIGA REAL (tabela computada por resultados) do ProPath.
// Obs: em S.table, 'p' = PONTOS (acumulado em advanceWeek); em leagueTable, 'p' = JOGOS.
// Valida o estado da tabela ANTES do endSeason (que reseta para a próxima temporada).
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
const code = fs.readFileSync('data.js','utf8') + '\n' + fs.readFileSync('archetypes.js','utf8') + '\n' +
  fs.readFileSync('engine.js','utf8') + '\n' + fs.readFileSync('comps.js','utf8');
window.eval(code + '\n;window.__E=E;window.__TIERS=TIERS;');
const E = window.__E, TIERS = window.__TIERS;
let fail = 0;
function check(name, cond){ console.log((cond?'PASS':'FAIL')+' '+name); if(!cond) fail++; }
const origEnd = E.endSeason;
E.endSeason = function(S){
  const rows = E.getLeagueTable(S);
  const nTeams = rows.length;
  const ligaJogos = S.leagueId==='bra-sc' ? nTeams-1 : (nTeams-1)*2;
  const totalW = rows.reduce((a,r)=>a+r.w,0);
  const totalL = rows.reduce((a,r)=>a+r.l,0);
  const totalGF = rows.reduce((a,r)=>a+r.gf,0);
  const totalGA = rows.reduce((a,r)=>a+r.ga,0);
  const ok = totalW===totalL && totalGF===totalGA
    && rows.every(r=> r.pts===r.w*3+r.d)
    && rows.every(r=> r.p===ligaJogos)
    && rows.every(r=> r.p===r.w+r.d+r.l)
    && rows.every(r=> r.gf - r.ga === r.sg);
  check('temp '+S.season+' (tier '+S.tierIndex+'): tabela coerente J='+ligaJogos, ok);
  const me = rows.find(r=>r.me);
  check('temp '+S.season+': seu time bate S.table (pontos='+me.pts+'=='+S.table.p+', J='+me.p+')',
        me && me.pts===S.table.p && me.w===S.table.w && me.d===S.table.d && me.l===S.table.l && me.gf===S.table.gf && me.ga===S.table.ga);
  check('temp '+S.season+': artilharia sem negativos', S.scorers.every(s=>s.goals>=0));
  console.log('  -> '+me.w+'V '+me.d+'E '+me.l+'D · '+me.pts+'pts · '+(rows.findIndex(r=>r.me)+1)+'º · top: '+E.getTopScorers(S).slice(0,2).map(s=>s.name+'('+s.goals+')').join(', '));
  return origEnd(S);
};
for (let trial=0; trial<5; trial++){
  const S = E.createPlayer({name:'Teste Liga '+trial, nation:'Brasil', pos:'ATA', age:19});
  let guard=0;
  while (S.season <= 3 && guard < 6000){ E.advanceWeek(S); guard++; }
}
console.log(fail===0 ? '\nLIGA REAL PASS ✅' : '\nLIGA REAL FAIL ❌ ('+fail+' falhas)');
process.exit(fail===0?0:1);
