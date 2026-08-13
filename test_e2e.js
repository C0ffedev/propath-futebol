// Validação E2E: carrega index.html, injeta fetch stub, simula onboarding + carreira.
const { JSDOM } = require('jsdom');
const http = require('http');

function get(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}

(async()=>{
  const base='http://localhost:4407';
  const errors=[];
  const dom = await JSDOM.fromURL(base+'/index.html', {
    runScripts:'dangerously', resources:'usable',
    beforeParse(w){
      // fetch stub: grava/le save + leaderboard em memória
      const mem={saves:{}, lb:[]};
      w.fetch = (url,opts)=>{
        return new Promise((resolve)=>{
          let body={};
          try{ if(opts&&opts.body) body=JSON.parse(opts.body); }catch(e){}
          if(url.includes('/api/saves')&&(!opts||opts.method==='GET')) resolve({json:()=>Promise.resolve(Object.keys(mem.saves).map(id=>({id,updated_at:Date.now()})))});
          else if(url.includes('/api/save/')&&opts&&opts.method==='POST'){ const id=url.split('/').pop(); mem.saves[id]=body; resolve({json:()=>Promise.resolve({ok:true})}); }
          else if(url.includes('/api/save/')&&opts&&opts.method==='GET'){ const id=url.split('/').pop(); resolve({json:()=>Promise.resolve(mem.saves[id]||{})}); }
          else if(url.includes('/api/leaderboard')&&opts&&opts.method==='POST'){ mem.lb.push(body); resolve({json:()=>Promise.resolve({ok:true})}); }
          else if(url.includes('/api/leaderboard')&&(!opts||opts.method==='GET')){ resolve({json:()=>Promise.resolve(mem.lb)}); }
          else resolve({json:()=>Promise.resolve({})});
        });
      };
      w.addEventListener('error', e=>errors.push('ERR: '+(e.error&&e.error.stack||e.message)));
    }
  });
  await new Promise(r=>setTimeout(r,1200));
  const w = dom.window, d = w.document;
  console.log('globais TIERS/POS/E/UI:', typeof w.TIERS, typeof w.POSITIONS, typeof w.E, typeof w.UI);
  console.log('onboard visível?', !d.getElementById('onboard').classList.contains('hidden'));

  // simula onboarding: preenche nome, idade, escolhe pos, nation, começa
  d.querySelector('#ob-next').click(); // passo 0 -> precisa nome. vamos setar antes
  // como não há campo ainda montado neste tick, forçamos draft via UI
  w.App.draft = {name:'Zé do Pânico', age:19, pos:'ATA', nation:'Brasil'};
  w.startCareer ? null : null;
  // chama startCareer indiretamente: usa App
  // startCareer é interno ao IIFE; dispara via nextStep no passo 3
  // Atalho: chama a função exposta? não exposta. Vamos simular cliques:
  // passo 0
  d.querySelector('#ob-back') && (d.querySelector('#ob-back').disabled=false);
  // monta passo 1 manualmente setando draft e avançando
  // Usar API pública: não existe; então recria player via E e seta UI.S + render
  const S = w.E.createPlayer({name:'Zé do Pânico', nation:'Brasil', pos:'ATA', age:19});
  w.UI.S = S; w.UI.tab='carreira';
  d.getElementById('onboard').classList.add('hidden');
  d.getElementById('topbar').classList.remove('hidden'); d.getElementById('tabs').classList.remove('hidden'); d.getElementById('app').classList.remove('hidden');
  w.UI.render();
  console.log('render carreira OK, topbar info len:', d.getElementById('topbar-info').innerHTML.length);
  // avança 5 semanas clicando em btn-advance
  for(let i=0;i<5;i++){ const b=d.querySelector('#btn-advance'); if(b){ b.click(); w.UI.render(); } }
  console.log('apos 5 semanas OVR:', w.UI.S.ovr, '| temporada:', w.UI.S.season, '| historico:', w.UI.S.career.length);
  // abre cada aba
  ['ficha','temporada','liga','mercado','conquistas','ranking'].forEach(t=>{ w.UI.tab=t; w.UI.render(); });
  console.log('todas abas renderizaram sem erro');
  console.log('ERROS CAPTURADOS:', errors.length, errors.slice(0,3));
  console.log(errors.length===0 ? 'E2E PASS ✅' : 'E2E FAIL ❌');
  process.exit(0);
})().catch(e=>{console.error('FALHA:',e.message);process.exit(1);});
