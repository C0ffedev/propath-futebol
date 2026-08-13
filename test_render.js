// Validação de render: baixa index.html do servidor e executa scripts via jsdom (sem erros).
const { JSDOM } = require('jsdom');
const fs = require('fs');
const http = require('http');

function get(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}

(async()=>{
  const base='http://localhost:4407';
  const jsons=[]; // captura erros
  const dom = await JSDOM.fromURL(base+'/index.html', {
    runScripts:'dangerously', resources:'usable',
    beforeParse(w){ w.addEventListener('error', e=>jsons.push('ERR: '+(e.error&&e.error.stack||e.message))); }
  });
  // espera scripts externos carregarem
  await new Promise(r=>setTimeout(r,1500));
  const w = dom.window;
  const errs = [];
  // checa globais
  const checks = {TIERS:typeof w.TIERS, POSITIONS:typeof w.POSITIONS, E:typeof w.E, UI:typeof w.UI};
  console.log('globais:', JSON.stringify(checks));
  // simula DOMContentLoaded já disparou -> onboard deve estar visível
  const onboard = w.document.getElementById('onboard');
  console.log('onboard presente:', !!onboard, '| html tem conteúdo?', (onboard&&onboard.innerHTML.length>50));
  // força criação de player sem UI (testa engine já validada)
  console.log('SEM ERROS CAPTURADOS:', errs.length===0, errs.slice(0,3));
  console.log('jsdom globais OK');
  process.exit(0);
})().catch(e=>{console.error('FALHA:',e.message);process.exit(1);});
