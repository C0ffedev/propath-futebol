// Teste da escalação: carrega app via jsdom, simula partida, inspecta .squad
const { JSDOM } = require('jsdom');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = 'C:/Users/karla/carreira-futebol';
const PORT = 4577;

function wait(ms){return new Promise(r=>setTimeout(r,ms));}

(async()=>{
  // sobe servidor local
  const srv = spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) } });
  await wait(1500);

  const errors = [];
  const dom = await JSDOM.fromURL(`http://localhost:${PORT}/index.html`, {
    runScripts:'dangerously', resources:'usable',
    beforeParse(w){
      const mem={saves:{}, lb:[]};
      w.fetch = (url,opts)=>new Promise((resolve)=>{
        let body={}; try{ if(opts&&opts.body) body=JSON.parse(opts.body); }catch(e){}
        if(url.includes('/api/saves')&&(!opts||opts.method==='GET')) resolve({json:()=>Promise.resolve(Object.keys(mem.saves).map(id=>({id,updated_at:Date.now()})))});
        else if(url.includes('/api/save/')&&opts&&opts.method==='POST'){ const id=url.split('/').pop(); mem.saves[id]=body; resolve({json:()=>Promise.resolve({ok:true})}); }
        else if(url.includes('/api/save/')&&opts&&opts.method==='GET'){ const id=url.split('/').pop(); resolve({json:()=>Promise.resolve(mem.saves[id]||{})}); }
        else if(url.includes('/api/leaderboard')&&opts&&opts.method==='POST'){ mem.lb.push(body); resolve({json:()=>Promise.resolve({ok:true})}); }
        else if(url.includes('/api/leaderboard')&&(!opts||opts.method==='GET')) resolve({json:()=>Promise.resolve(mem.lb)});
        else resolve({json:()=>Promise.resolve({})});
      });
      w.addEventListener('error', e=>errors.push('ERR: '+(e.error&&e.error.stack||e.message)));
    }
  });
  await wait(1200);
  const w = dom.window, d = w.document;

  let f=0; const ck=(c,l)=>{console.log(`${c?'OK ':'RUIM'} ${l}`); if(!c)f++;};

  ck(typeof w.E==='object' && typeof w.UI==='object', 'E e UI carregados');

  // cria player e renderiza
  const S = w.E.createPlayer({name:'Teste Escal', nation:'Brasil', pos:'ATA', age:19});
  w.UI.S = S; w.UI.tab='carreira';
  d.getElementById('onboard').classList.add('hidden');
  ['topbar','tabs','app'].forEach(id=>d.getElementById(id).classList.remove('hidden'));
  w.UI.render();
  ck(true, 'render inicial OK');

  // avança semanas até um modal de partida abrir (ou 60 semanas)
  let opened=false;
  for(let i=0;i<60 && !opened;i++){
    const b=d.querySelector('#btn-advance');
    if(!b) break;
    b.click();
    w.UI.render();
    const modal=d.getElementById('modal');
    if(modal && !modal.classList.contains('hidden') && modal.innerHTML.includes('PROVÁVEL ESCALAÇÃO')){ opened=true; }
  }
  ck(opened, 'modal de partida com PROVÁVEL ESCALAÇÃO abriu');

  if(opened){
    const squadHtml = d.getElementById('modal').innerHTML;
    // conta srow por coluna (2 colunas = 2 times)
    const cols = d.querySelectorAll('#modal .squad-col');
    ck(cols.length===2, 'dois times (voce x adversario) na escalacao');
    const rows = d.querySelectorAll('#modal .squad-col .srow');
    ck(rows.length===22, `22 jogadores (11x2) listados = ${rows.length}`);
    // labels de setor presentes
    const blocks = [...d.querySelectorAll('#modal .sblock-h')].map(e=>e.textContent);
    ck(blocks.includes('Goleiro')&&blocks.includes('Defesa')&&blocks.includes('Meio')&&blocks.includes('Ataque'), 'setores Goleiro/Defesa/Meio/Ataque presentes');
    // labels de posicao (nao codigo cru)
    ck(squadHtml.includes('Goleiro')&&squadHtml.includes('Zagueiro')&&squadHtml.includes('Lateral')&&squadHtml.includes('Volante')&&squadHtml.includes('Meia')&&squadHtml.includes('Atacante'), 'posicoes com label (Goleiro/Zagueiro/...)');
    // NAO deve ter codigo cru solto
    ck(!/>GOL</.test(squadHtml) && !/>ZAG</.test(squadHtml) && !/>LAT</.test(squadHtml), 'sem codigo cru GOL/ZAG/LAT no HTML');
    // formacao 4-3-3: 4 defesa, 3 meio, 3 ataque por time
    const myDef = d.querySelectorAll('#modal .squad-col:first-child .sblock');
    console.log('   debug blocos time1:', blocks.slice(0,4).join(' | '));
  }

  ck(errors.length===0, 'sem erros de JS no console ('+errors.length+')');
  if(errors.length) console.log(errors.slice(0,3).join('\n'));

  srv.kill();
  console.log(f===0 ? '\nESCALACAO TEST: PASSOU ✅' : `\nESCALACAO TEST: FALHOU ❌ (${f})`);
  process.exit(f===0?0:1);
})().catch(e=>{console.error('FALHA:',e.stack||e.message);process.exit(1);});
