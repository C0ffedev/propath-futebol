// Validação headless: concatena data.js+engine.js e roda em jsdom (escopo compartilhado = navegador).
const fs = require('fs');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;

const code = fs.readFileSync('data.js','utf8') + '\n' + fs.readFileSync('archetypes.js','utf8') + '\n' +
  fs.readFileSync('engine.js','utf8') + '\n' + fs.readFileSync('comps.js','utf8');
window.eval(code + '\n;window.__E=E;window.__TIERS=TIERS;window.__POS=POSITIONS;');

const E = window.__E, TIERS = window.__TIERS, POSITIONS = window.__POS;
console.log('tiers:', TIERS.length, '| positions:', Object.keys(POSITIONS).length);

const S = E.createPlayer({name:'Teste Pânico', nation:'Brasil', pos:'ATA', age:19});
console.log('OVR inicial:', S.ovr, '| pot:', S.pot, '| time:', S.teamName, '| cal:', S.calendar.length);
let matchCount=0, ovrTrail=[];
for (let w=0; w<60; w++){ const r=E.advanceWeek(S); if(r) matchCount++; ovrTrail.push(S.ovr); }
console.log('apos 60 semanas -> OVR:', S.ovr, '| idade:', S.age, '| temp:', S.season, '| tier:', S.tierIndex, '| time:', S.teamName);
console.log('jogos:', matchCount, '| troféus:', S.trophies.length, '| ofertas:', S.offers.length);
if(S.offers.length) console.log('ex oferta:', JSON.stringify(S.offers[0]));
console.log('evo pts:', S.sMeEvo.length, '| OVR subiu?', ovrTrail[0] < S.ovr);
console.log('OK: engine sem erros JS.');
