// E2E da Página Inicial: landing -> login -> hub -> nova carreira.
const http=require('http'); const {JSDOM}=require('jsdom');
function get(url){return new Promise((res,rej)=>{http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej);});}

(async()=>{
  const base='http://127.0.0.1:4411';
  const errors=[];
  const mem={ saves:{}, accounts:{} };
  // stub fetch (memória, por dono)
  const fstub = (url,opts)=>{
    url=url.replace(/^https?:\/\/[^/]+/,'');
    const method=(opts&&opts.method)||'GET';
    const body=opts&&opts.body?JSON.parse(opts.body):null;
    if(url.includes('/api/save/') && url.includes('/claim')){ const id=url.split('/')[3]; mem.saves[id]=Object.assign(mem.saves[id]||{},{owner:body.owner}); return Promise.resolve({ok:true,json:()=>Promise.resolve({ok:true})}); }
    if(url==='/api/login'){ if(mem.accounts[body.id]){ return Promise.resolve({ok:true,json:()=>Promise.resolve({id:body.id,name:body.id})}); } return Promise.resolve({ok:false,json:()=>Promise.resolve({error:'nao'})}); }
    if(url==='/api/account'){ mem.accounts[body.id]={id:body.id,name:body.id}; return Promise.resolve({ok:true,json:()=>Promise.resolve({id:body.id,name:body.id})}); }
    if(url.includes('/api/save/') && method==='DELETE'){ delete mem.saves[url.split('/')[3]]; return Promise.resolve({ok:true,json:()=>Promise.resolve({})}); }
    if(url.includes('/api/save/') && url.split('/')[4]==='claim'){ const id=url.split('/')[3]; mem.saves[id]=Object.assign(mem.saves[id]||{},{owner:body&&body.owner}); return Promise.resolve({ok:true,json:()=>Promise.resolve({})}); }
    if(url.includes('/api/save/') && method==='POST'){ const id=url.split('/')[3]; mem.saves[id]=body||{}; mem.saves[id].id=id; return Promise.resolve({ok:true,json:()=>Promise.resolve({})}); }
    if(url.includes('/api/save/') && method==='GET'){ const id=url.split('/')[3]; const s=mem.saves[id]; return s?Promise.resolve({ok:true,json:()=>Promise.resolve(s)}):Promise.resolve({ok:true,json:()=>Promise.resolve({})}); }
    if(url.startsWith('/api/saves')){ const u=new URL(base+url); const owner=u.searchParams.get('owner')||''; const list=Object.values(mem.saves).filter(s=>s.owner===owner||!s.owner); return Promise.resolve({ok:true,json:()=>Promise.resolve(list)}); }
    if(url==='/api/health') return Promise.resolve({ok:true,json:()=>Promise.resolve({ok:true})});
    return Promise.resolve({ok:true,json:()=>Promise.resolve({})});
  };

  const dom = await JSDOM.fromURL(base+'/index.html',{runScripts:'dangerously',resources:'usable',
    beforeParse(w){
      w.fetch = (url,opts)=>fstub(url,opts);
      w.localStorage = { _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;}, removeItem(k){delete this._d[k];} };
      const oe=w.addEventListener.bind(w); w.addEventListener('error',e=>errors.push(e.message||String(e.error)));
      const oc=w.console.error.bind(w.console); w.console.error=(...a)=>{errors.push(a.join(' '));};
    }
  });
  const w=dom.window, d=w.document;
  await new Promise(r=>setTimeout(r,900));

  const landingVisible = !d.getElementById('landing').classList.contains('hidden');
  console.log('1) landing visível no boot?', landingVisible, '(deve ser true)');
  const hasLandingTitle = d.getElementById('landing').textContent.includes('Panteão');
  console.log('   landing tem conteúdo?', hasLandingTitle);
  const enterBtn = d.getElementById('land-enter');
  console.log('   botão Entrar existe?', !!enterBtn);

  // 2) clica Entrar -> abre login
  enterBtn.click();
  await new Promise(r=>setTimeout(r,150));
  const authVisible = !d.getElementById('auth').classList.contains('hidden');
  console.log('2) clicar Entrar abre login?', authVisible, '(deve ser true)');

  // 3) cria conta karla (modo signup) e loga
  const signupTab = d.querySelector('#auth .auth-tab[data-at="signup"]');
  if (signupTab) signupTab.click();
  d.querySelector('#a-id').value='karla'; d.querySelector('#a-pass').value='senha';
  d.querySelector('#a-go').click();
  await new Promise(r=>setTimeout(r,500));
  const topUser = d.getElementById('top-user').textContent;
  console.log('3) logado como?', JSON.stringify(topUser), '(deve ser karla)');

  // 4) hub menu aparece (sem carreira carregada)
  const app = d.getElementById('app');
  const hubVisible = !app.classList.contains('hidden') && app.textContent.includes('Bem-vindo');
  console.log('4) hub menu aparece após login?', hubVisible, '(deve ser true)');

  // 5) clica Nova carreira -> onboarding
  const newBtn = d.getElementById('hub-new');
  console.log('   botão Nova carreira existe?', !!newBtn);
  if (newBtn) newBtn.click();
  await new Promise(r=>setTimeout(r,200));
  const onboardVisible = !d.getElementById('onboard').classList.contains('hidden');
  console.log('5) Nova carreira abre onboarding?', onboardVisible, '(deve ser true)');

  // 6) premissa abre (volta pro hub e clica A Premissa)
  // recarrega hub
  if (w.UI && w.UI.hub) w.UI.hub();
  await new Promise(r=>setTimeout(r,150));
  const premBtn = d.getElementById('hub-premise');
  console.log('6) botão A Premissa existe no hub?', !!premBtn);
  if (premBtn) premBtn.click();
  await new Promise(r=>setTimeout(r,150));
  const modalVisible = !d.getElementById('modal').classList.contains('hidden');
  const premiseOk = modalVisible && d.getElementById('modal-box').textContent.includes('PREMISSA');
  console.log('   premissa abre modal?', premiseOk, '(deve ser true)');

  // 7) DASHBOARD: cria jogador via engine e renderiza a "casa" (hubDashboard)
  if (w.E && w.UI){
    const P = w.E.createPlayer({name:'Dash Test', nation:'Brasil', pos:'ATA', age:19, arch:'branco', leagueId:'bra-sa', owner:'karla'});
    w.UI.S = P; w.UI.tab='carreira'; w.UI.render();
    await new Promise(r=>setTimeout(r,150));
    const app7 = d.getElementById('app');
    const dashOk = app7.textContent.includes('COMPETIÇÕES ATIVAS') && app7.textContent.includes('PRÓXIMO EVENTO');
    const pillsOk = app7.querySelectorAll('.comp-pill').length >= 1;
    console.log('7) dashboard (casa) renderiza?', dashOk, '| pills de competição:', app7.querySelectorAll('.comp-pill').length);
    console.log('   próximo evento mostra competição?', pillsOk);
    var dashPass = dashOk && pillsOk;
  } else { var dashPass=false; console.log('7) engine/ui indisponíveis'); }

  const pass = errors.length===0 && landingVisible && authVisible && topUser.includes('karla') && hubVisible && onboardVisible && premiseOk && dashPass;
  console.log('ERROS CAPTURADOS:', errors.length, errors.slice(0,3));
  console.log(pass ? 'HOME E2E PASS ✅' : 'HOME E2E FAIL ❌');
  process.exit(pass?0:1);
})().catch(e=>{console.error('FALHA:', e && (e.stack||e.message)); process.exit(1);});
