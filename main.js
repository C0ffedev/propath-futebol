// ===== main.js — ProPath Futebol (onboarding, nav, ações, save) =====
(function(){
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const App = { step:0, draft:{}, steps:['id','pos','nation','arch'] };
const MAX_SKILLS = 2; // limite de skills selecionáveis no onboarding

// ===== SESSÃO / CONTAS (modo local: separa saves por dono) =====
const Session = { id:null, name:null };
function saveSession(){ try { localStorage.setItem('propath_session', JSON.stringify(Session)); } catch(e){} }
function loadSession(){ try { const s=JSON.parse(localStorage.getItem('propath_session')||'null'); if(s&&s.id){ Session.id=s.id; Session.name=s.name; } } catch(e){} }
function clearSession(){ Session.id=null; Session.name=null; try{ localStorage.removeItem('propath_session'); }catch(e){} }
function apiSaveOwner(){ return Session.id || ''; }

function showToast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(App._t); App._t=setTimeout(()=>t.classList.add('hidden'),2200);
}
function modal(html, onClose){
  const m=$('#modal'); $('#modal-box').innerHTML=html+'<button class="modal-close" id="m-close">✕</button>';
  m.classList.remove('hidden');
  $('#m-close').onclick=()=>{m.classList.add('hidden'); onClose&&onClose();};
}
function closeModal(){ $('#modal').classList.add('hidden'); }

// ---------- ONBOARDING ----------
function renderOnboard(){
  $('#onboard').classList.remove('hidden');
  $('#onboard').innerHTML = UI.onboardHTML();
  App.step = 0; draftStep();
}
function pickFoot(){
  const r=Math.random();
  if (r < FOOT_CHANCE.amb) return 'amb';
  if (r < FOOT_CHANCE.amb + FOOT_CHANCE.esq) return 'esq';
  return 'dir';
}
function draftStep(){
  const labels=['Identidade','Posição','Nacionalidade','Arquétipo'];
  $('#ob-step').textContent = `Passo ${App.step+1} / 4 — ${labels[App.step]}`;
  const body=$('#ob-body');
  if (App.step===0){
    body.innerHTML = `<div class="ob-field"><label>Nome do jogador</label><input type="text" id="f-name" placeholder="Ex: Zé do Pânico" value="${App.draft.name||''}"></div>
      <div class="ob-field"><label>Idade</label><input type="number" id="f-age" min="16" max="38" value="${App.draft.age||19}"></div>`;
  } else if (App.step===1){
    body.innerHTML = `<div class="opt-grid">`+Object.keys(POSITIONS).map(k=>`<div class="opt ${App.draft.pos===k?'sel':''}" data-pos="${k}">${POSITIONS[k].label}<small>${k}</small></div>`).join('')+`</div>`;
    $$('#ob-body .opt').forEach(el=>el.onclick=()=>{App.draft.pos=el.dataset.pos; $$('#ob-body .opt').forEach(e=>e.classList.remove('sel')); el.classList.add('sel');});
  } else if (App.step===2){
    body.innerHTML = `<div class="opt-grid">`+NATIONS.map(n=>`<div class="opt ${App.draft.nation===n?'sel':''}" data-n="${n}">${n}</div>`).join('')+`</div>`;
    $$('#ob-body .opt').forEach(el=>el.onclick=()=>{App.draft.nation=el.dataset.n; $$('#ob-body .opt').forEach(e=>e.classList.remove('sel')); el.classList.add('sel');});
  } else {
    // arquétipo (perfil de criação) + arquétipo de HABILIDADE (power) + skills + (personalizada: pontos)
    const arch = App.draft.arch || 'branco';
    let html = `<div class="opt-grid">`+ARCHETYPES.map(a=>`<div class="opt ${arch===a.k?'sel':''}" data-arch="${a.k}">${a.n}<small>${a.d}</small></div>`).join('')+`</div>`;
    // ----- ARQUÉTIPO DE HABILIDADE (Modelo B, por posição) -----
    const pos = App.draft.pos || 'ATA';
    const powers = archetypesForPos(pos);
    const pw = App.draft.power || (powers[0] && powers[0].k);
    html += `<div class="ob-sub" style="margin-top:14px;font-weight:700;color:var(--gold)">Arquétipo de estilo (define sua jogada assinatura):</div>`;
    if (powers.length){
      html += `<div class="opt-grid">`+powers.map(a=>`<div class="opt pw ${pw===a.k?'sel':''}" data-pw="${a.k}"><b>${a.n}</b><small>${a.insp}</small><small>${a.blurb}</small></div>`).join('')+`</div>`;
    } else {
      html += `<div class="muted">Nenhum arquétipo de estilo disponível para ${pos} — você jogará no estilo clássico da posição.</div>`;
    }
    // ----- ARQUÉTIPOS MENTAIS (transversais, TRANCADOS no início; despertam por marco) -----
    const ms = mentalArchetypes();
    html += `<div class="ob-sub" style="margin-top:16px;font-weight:700;color:var(--obsession)">Arquétipos Mentais (Predador / Metavisão / Híbrido) — despertam na carreira:</div>`;
    html += `<div class="opt-grid">`+ms.map(a=>{
      const g=a.gate||{}; const gateTxt=[g.goalsCareer?`${g.goalsCareer} gols`:'',g.assistsCareer?`${g.assistsCareer} assist`:'',g.gamesCareer?`${g.gamesCareer} jogos`:''].filter(Boolean).join(' + ');
      return `<div class="opt pw locked" title="Trancado: desperta com ${gateTxt}"><b>${a.n} 🔒</b><small>${a.insp}</small><small>Trancado — ${gateTxt}</small></div>`;
    }).join('')+`</div>`;
    html += `<div class="muted" style="margin-top:6px">Essas qualidades mentais (tipo Kaiser ter meta-visão sendo atacante, ou Aiku/Niko zagueiros com meta-visão) só despertam conforme sua carreira evolui. Você combina um Arquétipo de Estilo + um Mental desperto.</div>`;
    html += `<div class="muted" style="margin-top:10px">Skills (opcional — máx <b>${MAX_SKILLS}</b>; aumentam atributos e jogadas especiais): <span id="sk-left">restam ${MAX_SKILLS-(App.draft.skills||[]).length}</span></div><div class="opt-grid skills">`+
      SKILLS.map(s=>`<div class="opt sk ${App.draft.skills&&App.draft.skills.includes(s.k)?'sel':''}" data-sk="${s.k}">${s.n}<small>${s.d}</small></div>`).join('')+
      `</div>`;
    if (arch==='personalizada'){
      const pos = App.draft.pos||'ATA';
      const pts = App.draft.skillPts || {};
      const used = Object.values(pts).reduce((a,b)=>a+b,0);
      const TOTAL = ARCHETYPES.find(a=>a.k==='personalizada').pts;
      html += `<div class="muted" style="margin-top:10px">Distribua <b>${TOTAL-used}</b> pontos (máx 95 por atributo):</div><div class="attr-edit">`+
        POSITIONS[pos].attrs.map(k=>`<div class="ae-row"><span>${k}</span><button data-dec="${k}">−</button><b id="ae-${k}">${pts[k]||0}</b><button data-inc="${k}">+</button></div>`).join('')+
        `</div>`;
    }
    body.innerHTML = html;
    $$('#ob-body .opt[data-arch]').forEach(el=>el.onclick=()=>{App.draft.arch=el.dataset.arch; $$('#ob-body .opt[data-arch]').forEach(e=>e.classList.remove('sel')); el.classList.add('sel'); draftStep();});
    $$('#ob-body .opt.pw').forEach(el=>el.onclick=()=>{App.draft.power=el.dataset.pw; $$('#ob-body .opt.pw').forEach(e=>e.classList.remove('sel')); el.classList.add('sel');});
    $$('#ob-body .opt.sk').forEach(el=>el.onclick=()=>{
      App.draft.skills = App.draft.skills||[];
      const k=el.dataset.sk;
      if (App.draft.skills.includes(k)){ App.draft.skills=App.draft.skills.filter(x=>x!==k); el.classList.remove('sel'); }
      else {
        if (App.draft.skills.length >= MAX_SKILLS){ showToast(`Máximo de ${MAX_SKILLS} skills`); return; }
        App.draft.skills.push(k); el.classList.add('sel');
      }
      const left = $('#sk-left'); if (left) left.textContent = 'restam ' + (MAX_SKILLS - App.draft.skills.length);
    });
    $$('#ob-body [data-inc]').forEach(b=>b.onclick=()=>{
      const k=b.dataset.inc; const TOTAL=ARCHETYPES.find(a=>a.k==='personalizada').pts;
      const used=Object.values(App.draft.skillPts||{}).reduce((a,b)=>a+b,0);
      if (used>=TOTAL) return;
      App.draft.skillPts=App.draft.skillPts||{};
      if ((App.draft.skillPts[k]||0) >= 95) return;
      App.draft.skillPts[k]=(App.draft.skillPts[k]||0)+1; $('#ae-'+k).textContent=App.draft.skillPts[k]; draftStepRefreshUsed();
    });
    $$('#ob-body [data-dec]').forEach(b=>b.onclick=()=>{
      const k=b.dataset.dec; App.draft.skillPts=App.draft.skillPts||{};
      if ((App.draft.skillPts[k]||0) <= 0) return;
      App.draft.skillPts[k]-=1; $('#ae-'+k).textContent=App.draft.skillPts[k]; draftStepRefreshUsed();
    });
  }
  $('#ob-back').disabled = App.step===0;
  $('#ob-next').textContent = App.step===3?'⚽ Começar Carreira':'Próximo →';
  $('#ob-next').onclick = nextStep;
  $('#ob-back').onclick = ()=>{ if(App.step>0){App.step--;draftStep();} };
}
function draftStepRefreshUsed(){
  const TOTAL=ARCHETYPES.find(a=>a.k==='personalizada').pts;
  const used=Object.values(App.draft.skillPts||{}).reduce((a,b)=>a+b,0);
  const note=$('#ob-body .muted:last-of-type');
  if (note) note.innerHTML=`Distribua <b>${TOTAL-used}</b> pontos (máx 95 por atributo):`;
}
function nextStep(){
  if (App.step===0){
    const nm=$('#f-name').value.trim(); const age=parseInt($('#f-age').value)||19;
    if (!nm){showToast('Digite um nome');return;} if(age<16||age>38){showToast('Idade 16-38');return;}
    App.draft.name=nm; App.draft.age=age;
  } else if (App.step===1){ if(!App.draft.pos){showToast('Escolha uma posição');return;} }
  else if (App.step===2){ if(!App.draft.nation){showToast('Escolha nacionalidade');return;} }
  else {
    App.draft.arch = App.draft.arch || 'branco';
    if (App.draft.arch==='personalizada' && Object.keys(App.draft.skillPts||{}).length===0){
      App.draft.skillPts = {}; // permitir 0 pts distribuídos
    }
    startCareer(); return;
  }
  App.step++; draftStep();
}

function startCareer(){
  const S = E.normalizeSave(E.createPlayer({
    name:App.draft.name, nation:App.draft.nation, pos:App.draft.pos,
    age:App.draft.age, arch:App.draft.arch, foot:pickFoot(), leagueId:null,
    skills:App.draft.skills||[], skillPts:App.draft.skillPts||{},
    power:App.draft.power||null,
    owner: apiSaveOwner()
  }));
  UI.S = S; UI.tab='carreira';
  $('#onboard').classList.add('hidden');
  $('#topbar').classList.remove('hidden'); $('#tabs').classList.remove('hidden'); $('#app').classList.remove('hidden');
  UI.render();
  saveGame();
  showToast('Carreira iniciada! Boa sorte, lenda 🔥');
}

// ---------- SAVE / LOAD ----------
function saveGame(){
  if(!UI.S) return;
  // garante que o save carregue sempre com o owner da sessão atual (ou o já existente)
  if (!UI.S.owner) UI.S.owner = apiSaveOwner();
  fetch('/api/save/'+UI.S.id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(UI.S)})
    .then(()=>showToast('💾 Salvo')).catch(()=>showToast('Erro ao salvar'));
}
// ---------- AUTH / LOGIN ----------
function showLogin(){
  const ld = document.getElementById('landing'); if (ld) ld.classList.add('hidden');
  $('#onboard').classList.add('hidden');
  const box = $('#auth'); box.classList.remove('hidden');
  box.innerHTML = `
    <div class="auth-card">
      <div class="brand auth-brand">PRO<span>PATH</span> · FUTEBOL</div>
      <p class="muted" style="text-align:center;margin:4px 0 18px">Entre com sua conta para ver apenas as <b>suas</b> carreiras.</p>
      <div class="auth-tabs">
        <button class="auth-tab on" data-at="login">Entrar</button>
        <button class="auth-tab" data-at="signup">Criar conta</button>
      </div>
      <div class="ob-field"><label>ID da conta (apelido único)</label><input type="text" id="a-id" placeholder="ex: karla" autocomplete="off"></div>
      <div class="ob-field"><label>Senha</label><input type="password" id="a-pass" placeholder="••••••" autocomplete="off"></div>
      <div id="a-err" class="a-err"></div>
      <button class="big-btn" id="a-go">Entrar</button>
      <div class="muted" style="text-align:center;font-size:11px;margin-top:10px">Suas carreiras ficam salvas neste computador, separadas por conta.</div>
    </div>`;
  let mode='login';
  $$('#auth .auth-tab').forEach(t=>t.onclick=()=>{
    mode=t.dataset.at; $$('#auth .auth-tab').forEach(x=>x.classList.toggle('on', x===t));
    $('#a-go').textContent = mode==='login' ? 'Entrar' : 'Criar conta';
    $('#a-err').textContent='';
  });
  $('#a-go').onclick = ()=>{
    const id=$('#a-id').value.trim(); const pass=$('#a-pass').value;
    if(!id||!pass){ $('#a-err').textContent='Preencha ID e senha.'; return; }
    $('#a-err').textContent='';
    if(mode==='signup'){
      fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,name:id,pass})})
        .then(r=>r.ok?r.json():r.json().then(j=>Promise.reject(j)))
        .then(()=>doLogin(id,pass))
        .catch(err=>{ $('#a-err').textContent=(err&&err.error)||'Falha ao criar conta'; });
    } else {
      doLogin(id,pass);
    }
  };
}
function doLogin(id,pass){
  fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,pass})})
    .then(r=>r.ok?r.json():r.json().then(j=>Promise.reject(j)))
    .then(j=>{ Session.id=j.id; Session.name=j.name; saveSession(); $('#auth').classList.add('hidden'); afterLogin(); })
    .catch(err=>{ $('#a-err').textContent=(err&&err.error)||'Falha ao entrar'; });
}
function afterLogin(){
  const ld = document.getElementById('landing'); if (ld) ld.classList.add('hidden');
  $('#topbar').classList.remove('hidden');
  $('#btn-logout').classList.remove('hidden');
  UI.renderTopUser && UI.renderTopUser();
  // God Mode: visível SÓ para o dono (karla)
  const godBtn = document.getElementById('btn-god');
  if (godBtn){ if (Session.id === 'karla'){ godBtn.classList.remove('hidden'); } else { godBtn.classList.add('hidden'); } }
  UI.hub();
}
function logout(){
  clearSession();
  UI.S=null;
  $('#topbar').classList.add('hidden');
  $('#tabs').classList.add('hidden');
  $('#app').classList.add('hidden');
  $('#btn-logout').classList.add('hidden');
  $('#topbar-info').innerHTML='';
  UI.tab='carreira';
  UI.landing();
}

function loadList(){
  const owner = apiSaveOwner();
  fetch('/api/saves?owner='+encodeURIComponent(owner)).then(r=>r.json()).then(list=>{
    if(!list.length){ renderOnboard(); return; }
    const mine = list.filter(s=>s.owner===owner);
    const orphans = list.filter(s=>!s.owner);
    const mineHtml = mine.length ? mine.map(s=>{
      const label = UI.esc(s.name || (s.id||'').slice(0,22));
      const sub = [s.team, s.southern, s.season?('Temp '+s.season):''].filter(Boolean).join(' · ');
      return `<div class="realcard" data-id="${s.id}">${label}<small>${sub}</small><small class="rc-id">${UI.esc((s.id||'').slice(0,14))}</small><button class="del-save" data-id="${s.id}" title="Apagar carreira">🗑</button></div>`;
    }).join('') : '<div class="muted" style="padding:8px 4px">Você ainda não tem carreiras. Crie uma abaixo ou reivindique uma da lista "sem dono".</div>';
    const orphanHtml = orphans.length ? orphans.map(s=>{
      const label = UI.esc(s.name || (s.id||'').slice(0,22));
      const sub = [s.team, s.southern, s.season?('Temp '+s.season):''].filter(Boolean).join(' · ');
      return `<div class="realcard orphan" data-id="${s.id}">${label}<small>${sub} · sem dono</small><button class="claim-save" data-id="${s.id}" title="Tornar este meu">Reivindicar</button><button class="del-save" data-id="${s.id}" title="Apagar carreira">🗑</button></div>`;
    }).join('') : '';
    const orphanSection = orphans.length ? `<div class="orphan-title">Carreiras sem dono (de outras pessoas/antigas)</div><div class="realgrid">${orphanHtml}</div>` : '';
    modal(`<h3>Carreira — ${UI.esc(Session.name||'')}</h3><div class="realgrid">${mineHtml}</div>${orphanSection}<div class="actions" style="margin-top:14px"><button class="btn btn-red" id="m-new">+ Nova carreira</button></div>`);
    $$('#modal-box .realcard').forEach(el=>{
      if (el.classList.contains('orphan')) return;
      el.onclick=(e)=>{
        if (e.target.classList.contains('del-save')) return;
        const id=el.dataset.id;
        fetch('/api/save/'+id).then(r=>r.json()).then(S=>{E.normalizeSave(S); UI.S=S;UI.tab='carreira';closeModal();$('#onboard').classList.add('hidden');$('#topbar').classList.remove('hidden');$('#tabs').classList.remove('hidden');$('#app').classList.remove('hidden');UI.render();showToast('Carreira carregada');}).catch(err=>{ console.error('Erro ao carregar save', err); showToast('Erro ao carregar: '+(err&&err.message||err)); });
      };
    });
    $$('#modal-box .realcard.orphan').forEach(el=>{
      el.onclick=(e)=>{
        if (e.target.classList.contains('del-save')) return;
        const id=el.dataset.id;
        if (e.target.classList.contains('claim-save')){
          fetch('/api/save/'+id+'/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner})})
            .then(r=>r.ok?r.json():r.json().then(j=>Promise.reject(j)))
            .then(()=>{ showToast('Carreira reivindicada ✅'); loadList(); })
            .catch(err=>showToast((err&&err.error)||'Não foi possível reivindicar'));
          return;
        }
        fetch('/api/save/'+id).then(r=>r.json()).then(S=>{E.normalizeSave(S); UI.S=S;UI.tab='carreira';closeModal();$('#onboard').classList.add('hidden');$('#topbar').classList.remove('hidden');$('#tabs').classList.remove('hidden');$('#app').classList.remove('hidden');UI.render();showToast('Carreira carregada (sem dono)');}).catch(err=>{ console.error(err); showToast('Erro ao carregar'); });
      };
    });
    $$('#modal-box .del-save').forEach(btn=>btn.onclick=(e)=>{
      e.stopPropagation();
      const id=btn.dataset.id;
      if (confirm('Apagar esta carreira? Esta ação não pode ser desfeita.')){
        fetch('/api/save/'+id+'?owner='+encodeURIComponent(owner), {method:'DELETE'}).then(()=>{ showToast('Carreira apagada 🗑'); loadList(); });
      }
    });
    $('#m-new').onclick=()=>{closeModal();renderOnboard();};
  }).catch(()=>renderOnboard());
}

window.App=App; window.showToast=showToast; window.modal=modal; window.closeModal=closeModal;
window.saveGame=saveGame; window.loadList=loadList; window.showLogin=showLogin; window.logout=logout; window.Session=Session;
window.showMatchScreen=showMatchScreen; window.advanceWeek=advanceWeek; window.openTrainChoice=openTrainChoice;
window.renderOnboard=renderOnboard; window.afterRender=afterRender; window.apiSaveOwner=apiSaveOwner;
window.startCareer=startCareer; window.renderMinimap=renderMinimap; window.archetypeImpactNote=archetypeImpactNote; window.nextStep=nextStep; window.draftStep=draftStep;

// ---------- NAVEGAÇÃO ----------
function bindNav(){
  $$('#tabs .tab').forEach(b=>b.onclick=()=>{UI.tab=b.dataset.tab; UI.render(); afterRender();});
  $('#btn-save').onclick=saveGame;
  $('#btn-god') && ($('#btn-god').onclick = ()=>{
    if (!UI.S){ showToast('Abra uma carreira primeiro'); return; }
    if (Session.id !== 'karla'){ showToast('God Mode só para o dono'); return; }
    const on = !UI.S.godMode;
    E.setGodMode(UI.S, on);
    UI.render(); afterRender(); saveGame();
    showToast(on ? '👑 God Mode ATIVADO!' : 'God Mode desativado');
  });
  $('#btn-back') && ($('#btn-back').onclick = ()=>{ UI.tab='carreira'; UI.render(); afterRender(); });
  $('#btn-menu').onclick=function(){ UI.S ? UI.hub() : (typeof loadList==='function' && loadList()); };
  $('#btn-logout').onclick=logout;
}
function afterRender(){
  $('#btn-advance') && ($('#btn-advance').onclick = advanceWeek);
  $('#btn-plan') && ($('#btn-plan').onclick = openPlan);
  $('#btn-escalador') && ($('#btn-escalador').onclick = UI.runEscalador);
  $$('#app [data-offer]').forEach(b=>b.onclick=()=>acceptOffer(parseInt(b.dataset.offer)));
  $$('#app [data-club]').forEach(el=>el.onclick=(e)=>{ e.stopPropagation(); UI.clubProfile(el.dataset.club, el.dataset.league); });
  const hallBtn = document.querySelector('#btn-clubhall'); if (hallBtn) hallBtn.onclick = UI.clubHall;
  // God Mode: reflete estado no botão E revela só para o dono (karla) em toda renderização
  const godBtn2 = document.getElementById('btn-god');
  if (godBtn2){
    if (Session.id === 'karla') godBtn2.classList.remove('hidden'); else godBtn2.classList.add('hidden');
    godBtn2.classList.toggle('active', !!(UI.S && UI.S.godMode));
  }
}

function advanceWeek(){
  const wk = UI.S.calendar[UI.S.calIdx];
  // na semana de treino, deixa o jogador escolher o foco antes de avançar
  if (wk && wk.type==='train' && !UI.S.pendingTrain){
    openTrainChoice(); return;
  }
  if (wk && wk.type==='match'){
    // PARTIDA AO VIVO com QTEs (estilo ProPath Valorant) — modula o desfecho
    if (typeof window.showLiveMatch==='function'){
      window.showLiveMatch(UI.S, wk, (mods)=>{
        const r = E.advanceWeek(UI.S, mods);
        finalizeWeek(r);
      });
    } else {
      const r = E.advanceWeek(UI.S);
      finalizeWeek(r);
    }
    return;
  }
  const r = E.advanceWeek(UI.S);
  finalizeWeek(r);
}

// passos pós-avanço de semana (transferência travada, render, save, resumo, tela de partida)
function finalizeWeek(r){
  // trava o jogo numa janela de transferências até o usuário decidir
  if (UI.S.pendingTransfer){ openTransferWindow(); return; }
  UI.render(); afterRender();
  saveGame();
  if (r){ showMatchScreen(r); }
  // resumo de temporada se acabou agora
  if (UI.S.seasonSummary && UI.S.seasonSummary.season === UI.S.season-1 && !UI.S._summaryShown){
    UI.S._summaryShown = UI.S.seasonSummary.season;
    setTimeout(()=>showSeasonSummary(UI.S.seasonSummary), 400);
  }
}

function openTrainChoice(){
  const grid = TRAIN_PLANS.map(p=>`<div class="opt ${UI.S.trainPlan.k===p.k?'sel':''}" data-p="${p.k}">${p.n}<small>${p.d}</small></div>`).join('');
  modal(`<h3>⚽ Semana de Treino — escolha o foco</h3>
    <div class="muted" style="margin-bottom:8px">Isso melhora os atributos destacados nesta semana. O plano padrão (<b>${UI.esc(UI.S.trainPlan.n)}</b>) é usado se você só avançar.</div>
    <div class="opt-grid">${grid}</div>`);
  $$('#modal-box .opt').forEach(el=>el.onclick=()=>{
    const p=TRAIN_PLANS.find(x=>x.k===el.dataset.p);
    UI.S.pendingTrain=p;
    closeModal();
    advanceWeek(); // re-chama já com pendingTrain setado
  });
}




// Heatmap leve de zona do jogador (3x3), determinístico pela posição
function matchHeatmap(pos){
  // grid 3x3: linhas = Defesa / Meio / Ataque ; colunas = Esquerda / Centro / Direita
  const ZONE_LABELS = ['Defesa Esq.','Defesa Centro','Defesa Dir.','Meio Esq.','Meio Centro','Meio Dir.','Ataque Esq.','Ataque Centro','Ataque Dir.'];
  const base = { GOL:[1,1,1, 1,3,1, 2,4,2], ZAG:[2,4,2, 3,5,3, 1,2,1], LAT:[3,3,4, 2,3,3, 1,1,1],
    VOL:[3,4,3, 4,5,4, 2,2,1], MEI:[3,4,3, 4,5,4, 3,4,3], ATA:[2,3,4, 3,4,5, 3,3,2] };
  const a = base[pos] || base['MEI'];
  const max = Math.max.apply(null, a);
  const cells = a.map(function(v,i){
    const op = (0.18 + 0.82*(v/max)).toFixed(2);
    return '<div class="ms-heat-cell" style="opacity:'+op+'" title="'+ZONE_LABELS[i]+'"><span class="ms-heat-lab">'+ZONE_LABELS[i]+'</span></div>';
  }).join('');
  const legend = '<div class="ms-heat-leg">'+
    '<div class="ms-heat-leg-h">Como ler o campo</div>'+
    '<div class="ms-heat-leg-grid">'+
      '<span>Defesa Esq.</span><span>Defesa Centro</span><span>Defesa Dir.</span>'+
      '<span>Meio Esq.</span><span>Meio Centro</span><span>Meio Dir.</span>'+
      '<span>Ataque Esq.</span><span>Ataque Centro</span><span>Ataque Dir.</span>'+
    '</div>'+
    '<div class="ms-heat-leg-note">Cada quadrado = uma zona do campo. Quanto mais forte a cor, mais vezes você atuou ali nesta partida.</div>'+
  '</div>';
  return '<div class="ms-heat-wrap">'+'<div class="ms-heat">'+cells+'</div>'+legend+'</div>';
}

// Card de ESTATÍSTICAS DA PARTIDA com barras de comparação + placar de domínio
function matchStatsCard(st, meName, oppName, domMe, domOpp, pos){
  const barRow = (label, a, b) => {
    const tot = (a+b)||1, lf = Math.round(a/tot*100), rf = 100-lf;
    const win = Math.sign(a-b); const ca = win>0?' win':''; const cb = win<0?' win':'';
    return '<div class="ms-bar"><span class="msl">'+label+'</span>'+
      '<div class="ms-bar-row"><span class="msv'+ca+'">'+a+'</span>'+
      '<div class="ms-bar-track"><div class="ms-bar-l" style="width:'+lf+'%"></div><div class="ms-bar-r" style="width:'+rf+'%"></div></div>'+
      '<span class="msv'+cb+'">'+b+'</span></div></div>';
  };
  return '<div class="ms-card team">'+
    '<div class="ms-card-h">ESTATÍSTICAS DA PARTIDA</div>'+
    '<div class="ms-poss-wrap"><div class="ms-poss-lab">Posse de Bola</div>'+
      '<div class="ms-poss"><div class="ms-poss-l"><span>'+st.posse+'%</span></div>'+
      '<div class="ms-poss-bar"><div class="ms-poss-fill" style="width:'+st.posse+'%"></div></div>'+
      '<div class="ms-poss-r"><span>'+(100-st.posse)+'%</span></div></div></div>'+
    '<div class="ms-domin">DOMÍNIO: <b class="me">'+meName+' '+domMe+'</b> × <b class="opp">'+domOpp+' '+oppName+'</b></div>'+
    '<div class="ms-stats-head"><span class="msh-l">'+meName+'</span><span class="msh-c"></span><span class="msh-r">'+oppName+'</span></div>'+
    '<div class="ms-bars">'+
      barRow('Chutes', st.myShots, st.oppShots)+
      barRow('No Gol', st.myOnTarget, st.oppOnTarget)+
      barRow('Passes', st.myPasses, st.oppPasses)+
      barRow('Precisão', st.myAcc, st.oppAcc)+
      barRow('Escanteios', st.myCorners, st.oppCorners)+
      barRow('Faltas', st.myFouls, st.oppFouls)+
      barRow('Amarelos', st.myYellow, st.oppYellow)+
      barRow('Impedimentos', st.myOffsides, st.oppOffsides)+
      barRow('Defesas (GOL)', st.mySaves, st.oppSaves)+
    '</div>'+
    '<div class="ms-card-sub">Dentro da área: '+meName+' '+st.myInside+' × '+st.oppInside+' '+oppName+' · fora: '+st.myOutside+' × '+st.oppOutside+'</div>'+
    '<div class="ms-heat-h">SUAS ZONAS NA PARTIDA</div>'+ matchHeatmap(pos)+
  '</div>';
}

// ===== Tela de pós-jogo =====
function showMatchScreen(r){
  const S = UI.S;
  const wk = S.calendar[S.calIdx-1];
  const opp = wk ? wk.opp : null;
  const oppName = opp ? opp.n : 'Adversário';
  const cupTxt = (wk && wk.comp) ? (COMP_BY_ID(wk.comp) ? COMP_BY_ID(wk.comp).short : LEAGUE_BY_ID(S.leagueId).short) : LEAGUE_BY_ID(S.leagueId).short;
  const resMap = {V:'VITÓRIA', D:'DERROTA', E:'EMPATE'};
  const resCls = {V:'win', D:'lose', E:'draw'}[r.res];
  const st = r.stats, p = st.player;
  const feed = r.feed.map(f=>'<p class="f'+(f.c?' '+f.c:'')+'"><span class="min">'+f.min+'\'</span><span>'+UI.esc(f.t)+'</span></p>').join('');
  const perfRow = (label, main, detail) => '<div class="ms-perf"><span class="ms-perf-lab">'+label+'</span><span class="ms-perf-val"><b>'+main+'</b> <i>'+detail+'</i></span></div>';
  const specialsTxt = (r.specials&&r.specials.length)? '<div class="ms-specials">🌟 '+r.specials.map(s=>s.label).join(' · ')+'</div>' : '';
  // placar de domínio: quantas estatísticas cada time venceu
  const domPairs = [[st.myShots,st.oppShots],[st.myOnTarget,st.oppOnTarget],[st.myPasses,st.oppPasses],[st.myAcc,st.oppAcc],[st.myCorners,st.oppCorners],[st.myFouls,st.oppFouls],[st.myYellow,st.oppYellow],[st.myOffsides,st.oppOffsides],[st.mySaves,st.oppSaves]];
  let domMe=0, domOpp=0; domPairs.forEach(([a,b])=>{ if(a>b) domMe++; else if(b>a) domOpp++; });
  // média de nota na temporada (via sMeEvo)
  const avg = (S.sMeEvo&&S.sMeEvo.length)? S.sMeEvo.reduce((a,x)=>a+(x.r||0),0)/S.sMeEvo.length : 0;
  const _myStars = (E.leagueTeams(S).find(t=>t.n===S.teamName)||{}).stars || [];
  const _oppTeam = E.leagueTeams(S).find(t=>t.n===oppName) || LEAGUE_BY_ID(S.leagueId).teams.find(t=>t.n===oppName) || { o:(opp&&opp.o)||70, stars:[] };
  const _youSquad = E.genSquad(S.teamName, S.teamOvr, _myStars);
  const _oppSquad = E.genSquad(oppName, _oppTeam.o||70, _oppTeam.stars||[]);
  const squadCols = (title, me, sq) => {
    const settGroup = (setor, rows) => `<div class="sblock"><div class="sblock-h">${setor}</div>${rows.map(p=>`<div class="srow"><span class="spos">${(POSITIONS[p.pos]&&POSITIONS[p.pos].label)||p.pos}</span><span class="sn">${UI.esc(p.n)}</span><span class="sov">${p.o}</span></div>`).join('')}</div>`;
    const order = ['Goleiro','Defesa','Meio','Ataque'];
    const groups = order.map(s=>{ const r=sq.filter(x=>x.setor===s); return r.length?settGroup(s,r):''; }).join('');
    return `<div class="squad-col"><div class="squad-h ${me?'me':''}">${UI.esc(title)}</div>${groups}</div>`;
  };
  const squadSection = `<div class="ms-card squad"><div class="ms-card-h">PROVÁVEL ESCALAÇÃO (4-3-3)</div>
    <div class="squad-cols">
      ${squadCols(S.teamName, true, _youSquad)}
      ${squadCols(oppName, false, _oppSquad)}
    </div></div>`;
  const html = `
  <div class="mscreen ${resCls}">
    <div class="ms-top">
      <span class="ms-cup">${cupTxt}</span>
      <span class="ms-badge ${resCls}">${resMap[r.res]}</span>
    </div>
    <div class="ms-score">
      <div class="ms-team"><div class="ms-nm me">${UI.esc(S.teamName)}</div><div class="ms-ovr">OVR ${S.teamOvr}</div></div>
      <div class="ms-num">${r.gf}<span class="ms-x">x</span>${r.ga}</div>
      <div class="ms-team"><div class="ms-nm">${UI.esc(oppName)}</div><div class="ms-ovr">OVR ${opp?opp.o:'—'}</div></div>
    </div>
    <div class="ms-body">
      <div class="ms-card perf">
        <div class="ms-card-h">SEU DESEMPENHO</div>
        <div class="ms-rating"><span class="ms-rate-num">${r.rating.toFixed(1)}</span><span class="ms-rate-lab">NOTA</span></div>
        <div class="ms-goals">
          <span class="ms-g ${r.goals?'hl':''}">⚽ <b>${r.goals}</b> gols</span>
          <span class="ms-a ${r.assists?'hl':''}">🅰️ <b>${r.assists}</b> assist.</span>
        </div>
        ${specialsTxt}
        ${r.mom?'<div class="ms-mom">🔥 HOMEM DO JOGO</div>':''}
        <div class="ms-pstats">
          ${perfRow('Finalizações', p.shots, p.onTarget+' no gol')}
          ${perfRow('Passes', p.passes, p.passAcc+'% prec.')}
          ${perfRow('Desarmes', p.tackles, 'feitos')}
          ${perfRow('Dribles', p.dribbles, p.dribblesWon+' certos')}
        </div>
        <div class="ms-ctx">
          <div class="ms-ctx-h">SUA MÉDIA NA TEMPORADA</div>
          <div class="ms-ctx-row"><span>Média de Nota</span><b>${avg?avg.toFixed(1):'—'}</b></div>
          <div class="ms-ctx-row"><span>Gols / jogo</span><b>${(S.seasonStats.games)?(S.seasonStats.goals/S.seasonStats.games).toFixed(2):'—'}</b></div>
          <div class="ms-ctx-row"><span>Assist / jogo</span><b>${(S.seasonStats.games)?(S.seasonStats.assists/S.seasonStats.games).toFixed(2):'—'}</b></div>
          <div class="ms-ctx-note">Esta partida: nota ${r.rating.toFixed(1)} ${r.rating>=avg?'▲ acima':'▼ abaixo'} da média</div>
        </div>
      </div>
      ${matchStatsCard(st, S.teamName, oppName, domMe, domOpp, S.pos)}
      ${squadSection}
      ${renderMinimap(S, r, wk)}
      ${archetypeImpactNote(S, r)}
      <div class="ms-card feed">
        <div class="ms-card-h">CRÔNICA</div>
        <div class="ms-feed">${feed}</div>
      </div>
    </div>
    <button class="big-btn ms-close" id="ms-ok">Continuar ▶</button>
  </div>`;
  modal(html);
  $('#ms-ok').onclick = closeModal;
}

// ===== MINIMAPA (campo top-down) + nota de impacto do arquétipo =====
// Campo 100x200 (retrato). Plota os 22 em 4-3-3, destaca seu jogador + duo de sinergia,
// marca os highlights da partida e a camada "reveal" do arquétipo.
function renderMinimap(S, r, wkArg){
  const W=100, H=200;
  const youSquad = E.genSquad(S.teamName, S.teamOvr, (E.leagueTeams(S).find(t=>t.n===S.teamName)||{}).stars||[]);
  // B6: usa o adversário da partida em questão (wkArg) quando disponível; cai p/ calendário só p/ compatibilidade
  const wkOpp = (typeof wkArg!=='undefined' && wkArg && wkArg.opp) ? wkArg.opp : (S.calendar[S.calIdx-1]&&S.calendar[S.calIdx-1].opp);
  const oppTeam = E.leagueTeams(S).find(t=>t.n===(wkOpp&&wkOpp.n)) || LEAGUE_BY_ID(S.leagueId).teams[0];
  const oppSquad = E.genSquad(oppTeam?oppTeam.n:'Adversário', oppTeam?oppTeam.o:70, (oppTeam&&oppTeam.stars)||[]);
  // posições base por setor (y "para cima" = ataque do jogador)
  const layout = {
    Goleiro:[50], Defesa:[22,40,60,78], Meio:[33,50,67], Ataque:[33,50,67]
  };
  function pts(sq, side){ // side: 'me' (baixo) ou 'opp' (topo)
    const out=[]; const order=['Goleiro','Defesa','Meio','Ataque'];
    let yBase = side==='me' ? [185,150,110,75] : [15,50,90,125];
    order.forEach((setor,si)=>{
      const rows=(sq||[]).filter(p=>p.setor===setor);
      const xs=layout[setor];
      rows.forEach((p,i)=>{ out.push({x:xs[i]||50, y:yBase[si], p, side}); });
    });
    return out;
  }
  const me = pts(youSquad,'me'), opp = pts(oppSquad,'opp');
  const all = me.concat(opp);
  const A = resolveArchetype(S.archetype);
  const M = resolveArchetype(S.mental);
  // seu ponto: encontra pelo nome+pos
  const youPos = all.find(n=>n.p&&n.p.n===S.name) || (me.find(n=>n.p&&n.p.pos===S.pos) || me[0]);
  // atribui arquétipos aleatórios aos mates do elenco (o genSquad não os define) p/ sinergia aparecer
  youSquad.forEach(p=>{ if(!p.archetype){ const ps=archetypesForPos(p.pos); if(ps.length) p.archetype = ps[Math.floor(Math.random()*ps.length)].k; } });
  // duo de sinergia: outro do time com arquétipo 'likes'
  let duo=null;
  if (A&&A.synergy&&A.synergy.likes){
    const mates = youSquad.filter(p=>p.n!==S.name && p.archetype && A.synergy.likes.includes(p.archetype));
    if (mates.length){ const m=mates[0]; duo = all.find(n=>n.p===m); }
  }
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="mini-svg" preserveAspectRatio="xMidYMid meet">`;
  // gramado
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#0c2a14"/>`;
  svg += `<rect x="2" y="2" width="${W-4}" height="${H-4}" fill="none" stroke="#1f7a3a" stroke-width="1"/>`;
  // meio-campo
  svg += `<line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="#1f7a3a" stroke-width="0.6"/>`;
  svg += `<circle cx="${W/2}" cy="${H/2}" r="10" fill="none" stroke="#1f7a3a" stroke-width="0.6"/>`;
  // áreas
  svg += `<rect x="${W/2-18}" y="2" width="36" height="16" fill="none" stroke="#1f7a3a" stroke-width="0.6"/>`;
  svg += `<rect x="${W/2-18}" y="${H-18}" width="36" height="16" fill="none" stroke="#1f7a3a" stroke-width="0.6"/>`;
  // camada reveal do arquétipo
  if (A&&A.reveal==='spaces'){
    svg += `<circle cx="50" cy="14" r="9" fill="rgba(255,210,40,.18)" stroke="rgba(255,210,40,.5)" stroke-width="0.5"/>`;
    svg += `<circle cx="33" cy="20" r="6" fill="rgba(255,210,40,.15)" stroke="rgba(255,210,40,.4)" stroke-width="0.4"/>`;
  } else if (A&&A.reveal==='finish'){
    svg += `<circle cx="${W/2}" cy="${H-14}" r="10" fill="rgba(255,39,64,.20)" stroke="rgba(255,39,64,.6)" stroke-width="0.5"/>`;
  } else if (A&&A.reveal==='lines'){
    svg += `<line x1="50" y1="110" x2="50" y2="40" stroke="rgba(70,160,255,.35)" stroke-width="1" stroke-dasharray="2 2"/>`;
    svg += `<line x1="33" y1="110" x2="33" y2="30" stroke="rgba(70,160,255,.25)" stroke-width="0.8" stroke-dasharray="2 2"/>`;
  }
  // pontos
  all.forEach(n=>{
    const isYou = (n===youPos);
    const isDuo = (n===duo);
    const col = n.side==='me' ? (isYou?'#ff2740':isDuo?'#b14bff':'#3da35d') : '#cfcfcf';
    const rad = isYou?3.2:isDuo?2.6:2;
    svg += `<circle cx="${n.x}" cy="${n.y}" r="${rad}" fill="${col}" ${isYou?'stroke="#fff" stroke-width="0.6"':''}/>`;
  });
  // highlight: gol do jogador -> marca na área adversária; assist -> linha do meio
  if (r&&r.goals>0&&youPos){ svg += `<circle cx="${W/2}" cy="14" r="4" fill="#ffd21e"/>`; }
  if (r&&r.assists>0&&youPos){ svg += `<line x1="${youPos.x}" y1="${youPos.y}" x2="${W/2}" y2="14" stroke="#ffd21e" stroke-width="0.8" stroke-dasharray="1.5 1.5"/>`; }
  svg += `</svg>`;
  const legend = `<div class="mini-legend"><span><i style="background:#ff2740"></i>Você</span><span><i style="background:#b14bff"></i>Dupla (sinergia)</span><span><i style="background:#3da35d"></i>Seu time</span><span><i style="background:#cfcfcf"></i>Adversário</span></div>`;
  return `<div class="ms-card minimap"><div class="ms-card-h">MAPA DA PARTIDA (4-3-3)</div>${svg}${legend}${A?`<div class="mini-arch">⚡ ${A.n}: ${A.signature&&A.signature.name||''}</div>`:''}${M?`<div class="mini-arch" style="color:var(--obsession)">🧠 ${M.n}: ${M.signature&&M.signature.name||''}</div>`:''}</div>`;
}

// Nota de impacto do arquétipo (estilo Valorant): conta o efeito da assinatura na partida
// Combina ARQUÉTIPO DE POSIÇÃO + MENTAL desperto (camada 3 do modelo).
function _noteForArch(S, r, A){
  if (!A) return '';
  const sig = A.signature||{};
  let head='', body='';
  if (sig.type==='active'){
    const hadSpecial = (r.specials||[]).some(s=>s.k===A.k);
    if (sig.specialChance && r.goals>0 && hadSpecial){ head='Instinto Predador'; body=`Você explodeu a rede com um gol de destaque — a assinatura ${A.n} brilhou e inflou sua nota (${r.rating}).`; }
    else if (sig.missPenalty && r.goals===0){ head='Pressão do Predador'; body=`Sem gol, o risco do ${A.n} pesou: nota um pouco abaixo (${r.rating}). É o preço de jogar no limite.`; }
    else if (sig.guaranteedAssist && r.assists>0){ head='Bombeiro Regista'; body=`Armou jogadas garantidas pela assinatura ${A.n} (${r.assists} assist.) — o meio campo funcionou.`; }
    else { head='Leitura de jogo'; body=`A assinatura ${A.n} esteve presente, mas o jogo não pediu o momento especial.`; }
  } else if (sig.type==='passive'){
    head='Visão que decide'; body=`O ${A.n} subiu sua leitura: +assistências e nota (${r.rating}) de forma consistente. Quem vê, joga.`;
  } else if (sig.type==='hybrid'){
    head='Domínio Total'; body=`O ${A.n} uniu leitura e instinto: você dominou o espaço e devorou a chance (nota ${r.rating}).`;
  }
  return `<div class="in-block"><div class="in-h">${head}</div><div class="in-b">${body}</div></div>`;
}
function archetypeImpactNote(S, r){
  const Ap = resolveArchetype(S.archetype);
  const Am = resolveArchetype(S.mental);
  if (!Ap && !Am) return '';
  let blocks = _noteForArch(S, r, Ap) + _noteForArch(S, r, Am);
  const label = Am ? '⚡ Impacto (Posição + Mental)' : '⚡ Impacto do seu arquétipo';
  return `<div class="impact-note"><div class="in-head">${label}</div>${blocks}</div>`;
}

function showSeasonSummary(sum){
  const s=sum;
  const situ = s.champ ? '<div class="ss-champ">🏆 CAMPEÃO!</div>'
    : (s.relegated ? '<div class="ss-rel">⬇️ REBAIXADO</div>' : '');
  const html = `<div class="seas-summary">
    <h2>🏁 Fim da Temporada ${s.season}</h2>
    <div class="ss-league">${UI.esc(s.league)} · ${UI.esc(s.team)}</div>
    ${situ}
    <div class="ss-grid">
      <div><span>Posição final</span><b>${s.pos}º</b></div>
      <div><span>Campanha</span><b>${s.w}V ${s.d}E ${s.l}D</b></div>
      <div><span>Pontos</span><b>${s.pts}</b></div>
      <div><span>Gols (time)</span><b>${s.gf}x${s.ga}</b></div>
      <div><span>Seus Gols</span><b>${s.goals}</b></div>
      <div><span>Suas Assist.</span><b>${s.assists}</b></div>
      <div><span>Homem do Jogo</span><b>${s.mom}</b></div>
      <div><span>Melhor Nota</span><b>${s.best}</b></div>
      <div><span>Pior Nota</span><b>${s.worst}</b></div>
      <div><span>OVR final</span><b>${s.ovrEnd}</b> <i>(pot ${s.pot})</i></div>
    </div>
    <div class="actions"><button class="big-btn" id="ss-ok">Seguir para Temp ${s.season+1} ▶</button></div>
  </div>`;
  modal(html);
  $('#ss-ok').onclick = closeModal;
}

function openPlan(){
  const grid = TRAIN_PLANS.map(p=>`<div class="opt ${UI.S.trainPlan.k===p.k?'sel':''}" data-p="${p.k}">${p.n}<small>${p.d}</small></div>`).join('');
  modal(`<h3>⚙ Plano de Treino</h3><div class="opt-grid">${grid}</div>`);
  $$('#modal-box .opt').forEach(el=>el.onclick=()=>{
    const p=TRAIN_PLANS.find(x=>x.k===el.dataset.p); UI.S.trainPlan={k:p.k,n:p.n};
    closeModal(); UI.render(); afterRender(); saveGame(); showToast('Plano: '+p.n);
  });
}

function acceptOffer(i){
  E.acceptOffer(UI.S, i); UI.tab='carreira'; UI.render(); afterRender(); saveGame();
  showToast('Contrato assinado! 💱 (as outras ofertas sumiram)');
}

// Janela de transferências TRAVADA: modal sem botão de fechar; só sai decidindo.
function openTransferWindow(){
  const S = UI.S; const offers = S.offers || [];
  showToast(`🔔 Você recebeu ${offers.length} proposta(s) de transferência!`);
  const list = offers.map((o,i)=>`<div class="offer"><div><div class="ot">${UI.esc(o.team)}<span class="pill">${LEAGUE_BY_ID(o.tier).short}</span></div><div class="od">OVR ${o.ovr} · R$ ${o.salary.toLocaleString('pt-BR')}/mês · ${o.cond}</div></div><button class="btn btn-purple" data-oi="${i}">Assinar (única)</button></div>`).join('');
  const body = `<h3>💱 Janela de Transferências</h3>
    <div class="muted" style="margin-bottom:10px">Decisão obrigatória — você não avança a temporada sem escolher.</div>
    <div class="offers">${list || '<div class="muted">Nenhuma oferta desta vez.</div>'}</div>
    <button class="btn ghost" id="btn-stay" style="margin-top:12px;width:100%">Ficar no ${UI.esc(S.teamName)}</button>`;
  const m = $('#modal'); $('#modal-box').innerHTML = body; m.classList.remove('hidden');
  $$('#modal-box [data-oi]').forEach(b=>b.onclick=()=>{ acceptOffer(parseInt(b.dataset.oi)); closeModal(); });
  $('#btn-stay').onclick=()=>{ E.rejectOffers(S); UI.tab='carreira'; UI.render(); afterRender(); saveGame(); closeModal(); showToast('Você segue no '+S.teamName+' 🛡'); };
}

const _origRender = UI.render.bind(UI);
UI.render = function(){
  try { _origRender(); }
  catch(e){ console.error('Render error:', e); showToast('Erro ao renderizar aba: '+(e.message||e)); }
  finally { afterRender(); bindNav(); }  // SEMPRE liga handlers (corrige navegação travada)
};

window.addEventListener('DOMContentLoaded', ()=>{
  UI.tab='carreira';
  UI.loadRankSaves(); // pré-carrega Hall da Fama (offline) para a aba Ranking
  loadSession();
  if (Session.id){ afterLogin(); } else { UI.landing(); }
});

})();
