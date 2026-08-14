// ===== home.js — ProPath Futebol =====
// Página inicial: Landing pública, Hub pós-login, Menu de carreiras, Intro narrativa.
// Estende o objeto UI. Incluído APÓS ui.js e ANTES de main.js no index.html.
(function(){
  if (typeof UI === 'undefined') { console.error('home.js precisa vir após ui.js'); return; }
  if (typeof E === 'undefined') { console.error('home.js precisa vir após engine.js'); return; }

  // ===================================================================
  // 1) LANDING PÚBLICA (aparece ANTES do login)
  // ===================================================================
  UI.landing = function(){
    const box = document.getElementById('landing');
    box.classList.remove('hidden');
    // esconde o resto
    ['topbar','tabs','app','auth','onboard'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.add('hidden'); });
    box.innerHTML = `
      <div class="land-bg"></div>
      <div class="land-wrap">
        <div class="land-hero">
          <div class="brand land-brand">PRO<span>PATH</span> · FUTEBOL</div>
          <h1 class="land-title">Do barro da <span class="t-obs">várzea</span> ao <span class="t-acc">Panteão</span> Mundial.</h1>
          <p class="land-sub">Crie seu jogador. Viva uma carreira SIMULADA de verdade — times reais, competições em paralelo, decisões que importam.</p>
          <div class="land-cta">
            <button class="big-btn land-enter" id="land-enter">Entrar / Criar conta</button>
          </div>
          <div class="land-note muted">Seu progresso fica salvo neste computador, separado por conta.</div>
        </div>

        <div class="land-how">
          <div class="how-step"><div class="how-num">1</div><div><b>Crie seu jogador</b><br><span class="muted">Posição, nacionalidade, arquétipo e o pé (tem 1% de chance de ser ambidestro).</span></div></div>
          <div class="how-step"><div class="how-num">2</div><div><b>Viva a carreira</b><br><span class="muted">Partidas SIMULADAS rodada a rodada. Aumente OVR, conquiste títulos, mude de clube.</span></div></div>
          <div class="how-step"><div class="how-num">3</div><div><b>Conquiste o mundo</b><br><span class="muted">Estadual → Nacional → Continental → Mundial. Pirâmide em paralelo.</span></div></div>
        </div>

        <div class="land-feats">
          <div class="feat"><span class="feat-ic">🏆</span> Competições em paralelo (pirâmide)</div>
          <div class="feat"><span class="feat-ic">⚽</span> Times reais (Brasil + América do Sul)</div>
          <div class="feat"><span class="feat-ic">🔒</span> Saves isolados por conta</div>
          <div class="feat"><span class="feat-ic">📈</span> Evolução real de OVR e atributos</div>
        </div>

        <div class="land-foot muted">Projeto não comercial · inspirado em jogos de carreira de futebol</div>
      </div>`;

    const enter = document.getElementById('land-enter');
    if (enter) enter.onclick = function(){ if (typeof showLogin === 'function') showLogin(); };
  };

  // ===================================================================
  // 2) HUB CENTRAL pós-login (unifica dashboard + 3) Menu de carreiras)
  // ===================================================================
  UI.hub = function(){
    const box = document.getElementById('app');
    if (box) box.classList.remove('hidden');
    const S = UI.S;
    if (S){
      UI.render(); // já renderiza a aba atual (carreira) — mantém comportamento
      return;
    }
    // sem carreira carregada: tela de MENU / carreiras
    UI.tab = 'hub';
    renderHubMenu();
  };

  function renderHubMenu(){
    const owner = (typeof apiSaveOwner === 'function') ? apiSaveOwner() : (window.Session && window.Session.id || '');
    const box = document.getElementById('app');
    // busca as carreiras do dono + órfãos
    fetch('/api/saves?owner='+encodeURIComponent(owner||''))
      .then(r=>r.json())
      .then(list=>{
        const mine = (list||[]).filter(s=>s.owner===owner);
        const orphans = (list||[]).filter(s=>!s.owner);
        const card = s => {
          const label = UI.esc(s.name || (s.id||'').slice(0,22));
          const sub = [s.team, s.season?('Temp '+s.season):''].filter(Boolean).join(' · ');
          return `<div class="realcard" data-id="${s.id}">${label}<small>${sub}</small><small class="rc-id">${UI.esc((s.id||'').slice(0,14))}</small><button class="del-save" data-id="${s.id}" title="Apagar carreira">🗑</button></div>`;
        };
        const mineHtml = mine.length ? mine.map(card).join('') : '<div class="muted" style="padding:8px 4px">Você ainda não tem carreiras. Crie uma abaixo.</div>';
        const orphanHtml = orphans.length ? orphans.map(s=>{
          const label = UI.esc(s.name || (s.id||'').slice(0,22));
          const sub = [s.team, s.season?('Temp '+s.season):''].filter(Boolean).join(' · ');
          return `<div class="realcard orphan" data-id="${s.id}">${label}<small>${sub} · sem dono</small><button class="claim-save" data-id="${s.id}" title="Tornar este meu">Reivindicar</button><button class="del-save" data-id="${s.id}" title="Apagar">🗑</button></div>`;
        }).join('') : '';
        box.innerHTML = `
          <div class="panel hub-menu">
            <h2><span class="ic">🏠</span> Bem-vindo, ${UI.esc((window.Session&&window.Session.name)||'')}</h2>
            <div class="hub-actions">
              <button class="big-btn btn-red" id="hub-new">+ Nova carreira</button>
              <button class="btn ghost" id="hub-ranking" data-tab="ranking">Ranking</button>
            </div>
            <div class="orphan-title" style="margin-top:18px">Suas carreiras</div>
            <div class="realgrid">${mineHtml}</div>
            ${orphans.length?`<div class="orphan-title">Carreiras sem dono (antigas/outros)</div><div class="realgrid">${orphanHtml}</div>`:''}
          </div>`;
        // handlers
        const nb = document.getElementById('hub-new'); if (nb) nb.onclick = ()=>{ if (typeof renderOnboard==='function') renderOnboard(); };
        const rb = document.getElementById('hub-ranking'); if (rb) rb.onclick = ()=>{ UI.tab='ranking'; UI.render(); afterRender(); };
        box.querySelectorAll('.realcard').forEach(el=>{
          if (el.classList.contains('orphan')) return;
          el.onclick=(e)=>{
            if (e.target.classList.contains('del-save')) return;
            const id=el.dataset.id;
            fetch('/api/save/'+id).then(r=>r.json()).then(S2=>{ E.normalizeSave(S2); UI.S=S2; UI.tab='carreira'; UI.render(); afterRender(); showToast('Carreira carregada'); })
              .catch(err=>{ console.error('Erro ao carregar save', err); showToast('Erro ao carregar'); });
          };
        });
        box.querySelectorAll('.realcard.orphan').forEach(el=>{
          el.onclick=(e)=>{
            if (e.target.classList.contains('del-save')) return;
            const id=el.dataset.id;
            if (e.target.classList.contains('claim-save')){
              fetch('/api/save/'+id+'/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({owner})})
                .then(r=>r.ok?r.json():r.json().then(j=>Promise.reject(j)))
                .then(()=>{ showToast('Carreira reivindicada ✅'); renderHubMenu(); })
                .catch(err=>showToast((err&&err.error)||'Não foi possível reivindicar'));
              return;
            }
            fetch('/api/save/'+id).then(r=>r.json()).then(S2=>{ E.normalizeSave(S2); UI.S=S2; UI.tab='carreira'; UI.render(); afterRender(); showToast('Carreira carregada (sem dono)'); })
              .catch(err=>{ console.error(err); showToast('Erro ao carregar'); });
          };
        });
        box.querySelectorAll('.del-save').forEach(btn=>btn.onclick=(e)=>{
          e.stopPropagation();
          const id=btn.dataset.id;
          if (confirm('Apagar esta carreira? Esta ação não pode ser desfeita.')){
            fetch('/api/save/'+id+'?owner='+encodeURIComponent(owner), {method:'DELETE'})
              .then(()=>{ showToast('Carreira apagada 🗑'); renderHubMenu(); });
          }
        });
      })
      .catch(()=>{
        box.innerHTML = `<div class="panel hub-menu"><h2>Bem-vindo</h2><div class="hub-actions"><button class="big-btn btn-red" id="hub-new2">+ Nova carreira</button></div><div class="muted">Não foi possível carregar suas carreiras.</div></div>`;
        const nb = document.getElementById('hub-new2'); if (nb) nb.onclick = ()=>{ if (typeof renderOnboard==='function') renderOnboard(); };
      });
  }

  // HUB com carreira carregada: dashboard. Substitui parte do UI.carreira como "casa".
  UI.hubDashboard = function(){
    const S=UI.S; if(!S) return UI.hub();
    const next = S.calendar[S.calIdx];
    const compShort = next && next.comp ? (COMP_BY_ID(next.comp)||{short:''}).short : '';
    const nextTxt = next?(next.type==='match'?`vs ${next.opp.n}${compShort?' ['+compShort+']':''}`:`Semana de Treino`):'Fim da temporada';
    const comps = (S.comps||[]).map(c=>`<span class="pill comp-pill" data-comp="${c.compId}">${COMP_BY_ID(c.compId)?COMP_BY_ID(c.compId).short:c.short}</span>`).join('') || '<span class="muted">—</span>';
    const trophies = (S.trophies||[]).slice(-5).map(t=>`<span class="pill trophy">${UI.esc(t)}</span>`).join('') || '<span class="muted">sem títulos ainda</span>';
    const feed = (S.career||[]).slice(-5).map(c=>`<p class="muted">${UI.esc(c)}</p>`).join('');
    return `<div class="panel hub-dash">
      <div class="hub-player">
        <div class="hp-ovr">${S.ovr}<small>OVR</small></div>
        <div class="hp-info">
          <div class="hp-name">${UI.esc(S.name)}</div>
          <div class="hp-meta">${UI.esc(S.teamName)} · ${FOOT_LABEL[S.foot]||''} · ${S.age} anos · ${POSITIONS[S.pos]?POSITIONS[S.pos].label:S.pos}</div>
          <div class="hp-league">${LEAGUE_BY_ID(S.leagueId)?LEAGUE_BY_ID(S.leagueId).name:'—'}</div>
        </div>
        <button class="big-btn hub-advance" id="hub-advance">▶ Avançar Semana</button>
      </div>
      <div class="hub-next">
        <div class="muted">PRÓXIMO EVENTO (Semana ${S.week})</div>
        <div class="hub-next-txt">${UI.esc(nextTxt)}</div>
      </div>
      <div class="hub-comps">
        <div class="muted">COMPETIÇÕES ATIVAS</div>
        <div class="hub-pills">${comps}</div>
      </div>
      <div class="hub-cols">
        <div class="hub-col">
          <div class="muted">TROFÉUS</div>
          <div class="hub-pills">${trophies}</div>
        </div>
        <div class="hub-col">
          <div class="muted">AÇÕES RÁPIDAS</div>
          <div class="hub-quick">
            <button class="btn" data-tab="temporada">📅 Calendário</button>
            <button class="btn" data-tab="competicoes">🏆 Competições</button>
            <button class="btn" data-tab="mercado">💱 Mercado</button>
            <button class="btn" data-tab="estatisticas">📊 Estatísticas</button>
          </div>
        </div>
      </div>
      <div class="hub-feed">
        <div class="muted">ÚLTIMAS DA CARREIRA</div>
        ${feed}
      </div>
    </div>`;
  };

  // torna o dashboard a "casa" quando a aba for 'hub' (ou quando S existe e tab===carreira default)
  const _origRender = UI.render;
  UI.render = function(){
    const S=UI.S;
    // se tem carreira e a aba for a padrão de carreira, mostra dashboard no lugar
    if (S && UI.tab==='carreira'){
      document.getElementById('topbar-info').innerHTML = UI.topbar();
      const tabs=[['carreira','Carreira'],['ficha','Ficha'],['estatisticas','Estatísticas'],['temporada','Temporada'],['liga','Liga'],['ligas','Ligas'],['competicoes','Comp'],['mercado','Mercado'],['conquistas','Conquistas'],['ranking','Ranking']];
      document.getElementById('tabs').innerHTML = tabs.map(t=>`<button class="tab ${UI.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('');
      let html;
      try { html = UI.hubDashboard(); }
      catch(e){
        console.error('hubDashboard erro:', e);
        html = '<div class="panel"><h2>Dashboard indisponível</h2>'
          + '<div class="muted">'+(e&&e.message||e)+'</div>'
          + '<div class="hub-quick">'
          + '<button class="big-btn hub-advance" id="hub-advance">▶ Avançar Semana</button>'
          + '<button class="btn" data-tab="temporada">📅 Calendário</button>'
          + '<button class="btn" data-tab="competicoes">🏆 Competições</button>'
          + '<button class="btn" data-tab="mercado">💱 Mercado</button>'
          + '<button class="btn" data-tab="estatisticas">📊 Estatísticas</button>'
          + '</div></div>';
      }
      document.getElementById('app').innerHTML = html;
      bindHubDash();
      return;
    }
    return _origRender();
  };

  function bindHubDash(){
    const adv = document.getElementById('hub-advance'); if (adv) adv.onclick = ()=>{ if (typeof advanceWeek==='function') advanceWeek(); };
    document.querySelectorAll('#app .hub-quick [data-tab]').forEach(b=>b.onclick=()=>{ UI.tab=b.dataset.tab; UI.render(); afterRender(); });
    document.querySelectorAll('#app .comp-pill').forEach(p=>p.onclick=()=>{ UI.tab='competicoes'; UI.render(); afterRender(); });
  }

  // expõe para main.js
  window.UI = UI;
})();
