// Validação E2E: carrega index.html (servido), injeta fetch stub com contas+saves
// isolados por dono, simula LOGIN + onboarding + carreira, e confirma que a lista
// de saves só mostra o que pertence à conta logada.
const { JSDOM } = require('jsdom');
const http = require('http');

function get(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}

(async()=>{
  const base='http://localhost:4555';
  const errors=[];
  // estado "servidor" em memória (por dono)
  const mem={ saves:{}, accounts:{} };
  const dom = await JSDOM.fromURL(base+'/index.html', {
    runScripts:'dangerously', resources:'usable',
    beforeParse(w){
      w.fetch = (url,opts)=>{
        return new Promise((resolve)=>{
          let body={};
          try{ if(opts&&opts.body) body=JSON.parse(opts.body); }catch(e){}
          const method = opts&&opts.method || 'GET';
          // contas
          if(url.includes('/api/account')){ mem.accounts[body.id]=true; resolve({ok:true,json:()=>Promise.resolve({ok:true})}); return; }
          if(url.includes('/api/login')){ resolve({ok:true,json:()=>Promise.resolve({id:body.id,name:body.id})}); return; }
          // saves: suporta owner no body e filtro por query
          if(url.includes('/api/saves')){
            const u = new URL(url, 'http://x'); const owner = u.searchParams.get('owner')||'';
            let list = Object.keys(mem.saves);
            if(owner) list = list.filter(id=> mem.saves[id].owner===owner || !mem.saves[id].owner);
            resolve({ok:true,json:()=>Promise.resolve(list.map(id=>({id, owner:mem.saves[id].owner, name:mem.saves[id].name, team:mem.saves[id].teamName, southern:'', season:1})))});
            return;
          }
          if(url.includes('/api/save/')){
            const id=url.split('/').pop().split('?')[0];
            if(method==='POST'){ mem.saves[id]=body; resolve({ok:true,json:()=>Promise.resolve({ok:true})}); return; }
            if(method==='GET'){ resolve({ok:true,json:()=>Promise.resolve(mem.saves[id]||{})}); return; }
            if(method==='DELETE'){ delete mem.saves[id]; resolve({ok:true,json:()=>Promise.resolve({ok:true})}); return; }
          }
          resolve({ok:true,json:()=>Promise.resolve({})});
        });
      };
      w.addEventListener('error', e=>errors.push('ERR: '+(e.error&&e.error.stack||e.message)));
    }
  });
  await new Promise(r=>setTimeout(r,1000));
  const w = dom.window, d = w.document;
  console.log('globais TIERS/POS/E/UI:', typeof w.TIERS, typeof w.POSITIONS, typeof w.E, typeof w.UI);

  // pré-popula saves de DONOS diferentes + um órfão
  w.fetch('/api/save/s-karla',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'s-karla',name:'Só da Karla',teamName:'Flamengo',owner:'karla'})});
  w.fetch('/api/save/s-amigo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'s-amigo',name:'Só do Amigo',teamName:'Palmeiras',owner:'amigo'})});
  w.fetch('/api/save/s-orphan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'s-orphan',name:'Órfão',teamName:'Vasco'})});

  // 1) boot mostra tela de login (auth visível, onboard escondido)
  const authVisible = !d.getElementById('auth').classList.contains('hidden');
  console.log('tela de login visível no boot?', authVisible);

  // 2) simula login como KARLA
  d.querySelector('#a-id').value='karla';
  d.querySelector('#a-pass').value='senha';
  d.querySelector('#a-go').click();
  await new Promise(r=>setTimeout(r,250));
  const topUser = d.getElementById('top-user').textContent;
  console.log('top-user após login:', JSON.stringify(topUser));

  // 3) loadList deve mostrar só os saves da karla (+ órfão) — NÃO o do amigo
  const cards = [...d.querySelectorAll('#modal-box .realcard')].map(c=>c.dataset.id);
  const orphans = [...d.querySelectorAll('#modal-box .realcard.orphan')].map(c=>c.dataset.id);
  console.log('cards visíveis p/ karla:', cards);
  console.log('órfãos visíveis:', orphans);
  const seesAmigo = cards.includes('s-amigo');
  const seesOwn = cards.includes('s-karla');
  const seesOrphan = orphans.includes('s-orphan');
  console.log('→ vê save do AMIGO?', seesAmigo, '(deve ser false)');
  console.log('→ vê PRÓPRIO save?', seesOwn, '(deve ser true)');
  console.log('→ vê ÓRFÃO?', seesOrphan, '(deve ser true, para reivindicar)');

  // 4) cria carreira via createPlayer (owner será aplicado por saveGame via sessão interna)
  const S = w.E.createPlayer({name:'Zé do Pânico', nation:'Brasil', pos:'ATA', age:19});
  w.UI.S = S; w.UI.tab='carreira';
  d.getElementById('onboard').classList.add('hidden');
  d.getElementById('topbar').classList.remove('hidden'); d.getElementById('tabs').classList.remove('hidden'); d.getElementById('app').classList.remove('hidden');
  w.UI.render();
  console.log('render carreira OK, topbar len:', d.getElementById('topbar-info').innerHTML.length);

  // 5) salva e confere que o save foi gravado com owner=karla (via sessão interna)
  w.saveGame();
  await new Promise(r=>setTimeout(r,200));
  console.log('save gravado com owner:', mem.saves[S.id] && mem.saves[S.id].owner, '(deve ser karla)');

  // 6) percorre abas sem erro
  ['ficha','temporada','liga','mercado','conquistas','ranking'].forEach(t=>{ w.UI.tab=t; w.UI.render(); });
  console.log('todas abas renderizaram');

  // 7) logout volta p/ login
  d.querySelector('#btn-logout').click();
  await new Promise(r=>setTimeout(r,100));
  console.log('após logout, auth visível?', !d.getElementById('auth').classList.contains('hidden'));

  const pass = errors.length===0 && authVisible && !seesAmigo && seesOwn && seesOrphan && mem.saves[S.id] && mem.saves[S.id].owner==='karla';
  console.log('ERROS CAPTURADOS:', errors.length, errors.slice(0,3));
  console.log(pass ? 'E2E PASS ✅' : 'E2E FAIL ❌');
  process.exit(pass?0:1);
})().catch(e=>{console.error('FALHA:',e.message);process.exit(1);});
