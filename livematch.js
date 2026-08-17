// ===== livematch.js — Partida AO VIVO com QTEs (estilo ProPath Valorant) =====
// Mostra o campo 4-3-3 animado (bola circulando def->meio->ataque) e, em cada
// parada, dispara um QTE. O resultado dos QTEs MODULA o desfecho individual do
// jogador (gols/assist/nota/sofridos), mantendo a tabela da liga coerente.
// Depende de globais: E, UI, window.modal, window.closeModal, window.showToast.

(function(){
  const W=100, H=200;

  // pontos da formação 4-3-3 (campo vertical: 0=defesa própria, 200=ataque adversário)
  function formationPts(){
    return [
      {x:50,y:188,n:'G',s:'me'},
      {x:14,y:165,n:'LD'}, {x:38,y:170,n:'Z1'}, {x:62,y:170,n:'Z2'}, {x:86,y:165,n:'LE'},
      {x:24,y:122,n:'VOL1'}, {x:50,y:128,n:'VOL2'}, {x:76,y:122,n:'VOL3'},
      {x:24,y:80,n:'ME1'}, {x:50,y:74,n:'ME2'}, {x:76,y:80,n:'ME3'},
      {x:30,y:36,n:'ATA1'}, {x:50,y:30,n:'ATA2'}, {x:70,y:36,n:'ATA3'},
      {x:50,y:12,n:'Gadv',s:'opp'}
    ];
  }

  // gera a lista de QTEs conforme a posição + arquétipo (4 por jogo)
  function buildQTEs(S){
    const pos = S.pos;
    const A = (typeof resolveArchetype==='function')?resolveArchetype(S.archetype):null;
    const M = (typeof resolveArchetype==='function')?resolveArchetype(S.mental):null;
    const has = (a,k)=> a && a.synergy && a.synergy.likes && a.synergy.likes.includes(k);
    const qtes = [];
    const push = (q)=>qtes.push(q);
    if (pos==='ATA'){
      push({type:'timing', key:'finaliza', label:'FINALIZAÇÃO', attr:'Finalização', zone:'ataque', win:{goals:1}, lose:{rating:-0.3}, arch:A&&A.k});
      push({type:'choice', key:'drible', label:'PASSE DE LETRA / DRIBLE', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{goals:1}, lose:{rating:-0.2}, arch:A&&A.k});
      push({type:'timing', key:'finaliza2', label:'CHANCE DE OURO', attr:'Finalização', zone:'ataque', win:{goals:1, special:true}, lose:{rating:-0.3}, arch:A&&A.k});
      push({type:'timing', key:'posse', label:'RECUperaÇÃO DE POSSE', attr:'Visão', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}});
    } else if (pos==='MEI'){
      push({type:'choice', key:'passe', label:'ENFIADA DE PASSE', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1}, lose:{rating:-0.2}, arch:M&&M.k});
      push({type:'timing', key:'finaliza', label:'INFILTRA E FINALIZA', attr:'Finalização', zone:'ataque', win:{goals:1}, lose:{rating:-0.3}, arch:A&&A.k});
      push({type:'choice', key:'leitura', label:'LEITURA DE JOGO', choices:['Marcar','Armar','Seguir'], zone:'meio', win:{assists:1, rating:0.1}, lose:{rating:-0.2}, arch:M&&M.k});
      push({type:'timing', key:'posse', label:'DOMÍNIO DE MEIO', attr:'Visão', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}});
    } else if (pos==='VOL'){
      push({type:'timing', key:'desarme', label:'DESARME DECISIVO', attr:'Defesa', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}});
      push({type:'choice', key:'passe', label:'SAÍDA DE BOLA', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1}, lose:{rating:-0.2}, arch:M&&M.k});
      push({type:'timing', key:'posse', label:'CHEGADA AO ATAQUE', attr:'Visão', zone:'ataque', win:{assists:1}, lose:{rating:-0.1}});
      push({type:'timing', key:'defesa', label:'INTERVENÇÃO', attr:'Defesa', zone:'meio', win:{gaSaved:1}, lose:{rating:-0.1}});
    } else if (pos==='ZAG'){
      push({type:'timing', key:'defesa', label:'INTERVENÇÃO NA ÁREA', attr:'Defesa', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, arch:M&&M.k});
      push({type:'timing', key:'defesa2', label:'DIVIDA AÉREA', attr:'Cabeceio', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}});
      push({type:'choice', key:'posse', label:'POSICIONAMENTO', choices:['Subir','Segurar','Recuar'], zone:'defesa', win:{rating:0.2}, lose:{rating:-0.1}});
      push({type:'timing', key:'desarme', label:'CARGA NO MEIA', attr:'Defesa', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}});
    } else if (pos==='LAT'){
      push({type:'timing', key:'cruzamento', label:'CRUZAMENTO NA ÁREA', attr:'Passe', zone:'ataque', win:{assists:1}, lose:{rating:-0.2}, arch:A&&A.k});
      push({type:'choice', key:'drible', label:'INFILTRAÇÃO PELA LINHA', choices:['Interna','Centro','Externa'], zone:'ataque', win:{assists:1}, lose:{rating:-0.2}});
      push({type:'timing', key:'defesa', label:'RECORRER O CONTROLE', attr:'Defesa', zone:'meio', win:{gaSaved:1}, lose:{rating:-0.1}});
      push({type:'timing', key:'posse', label:'SUBIDA DE LATERAL', attr:'Passe', zone:'ataque', win:{rating:0.2}, lose:{rating:-0.1}});
    } else if (pos==='GOL'){
      push({type:'timing', key:'defesa', label:'DEFESAA DIFÍCIL', attr:'Defesa', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, arch:M&&M.k});
      push({type:'timing', key:'defesa2', label:'SAÍDA DE GOL', attr:'Visão', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}});
      push({type:'choice', key:'posse', label:'POSICIONAMENTO', choices:['Fechar Ângulo','Sair','Recuar'], zone:'defesa', win:{rating:0.2}, lose:{rating:-0.1}});
      push({type:'timing', key:'defesa3', label:'DEFESAA DE PÉ', attr:'Defesa', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}});
    }
    return qtes;
  }

  function zoneY(zone){ return zone==='ataque'?40 : zone==='meio'?120 : 178; }

  // ---------- tela ao vivo ----------
  function showLiveMatch(S, wk, onDone){
    const opp = wk && wk.opp ? wk.opp : {n:'Adversário', o:70};
    const qtes = buildQTEs(S);
    const acc = { goals:0, assists:0, gaSaved:0, rating:0, special:false };
    let qi = 0;
    const pts = formationPts();
    const youIdx = pts.findIndex(p=>p.s==='me');
    let ball = { x:50, y:178 };

    const overlay = document.createElement('div');
    overlay.id = 'live-overlay';
    overlay.innerHTML = `
      <div class="live-wrap">
        <div class="live-top">
          <span class="live-cup">${UI&&UI.S? (LEAGUE_BY_ID&&LEAGUE_BY_ID(S.leagueId)?LEAGUE_BY_ID(S.leagueId).short:'LIGA') : 'LIGA'}</span>
          <span class="live-vs">${UI.esc(S.teamName)} <b>×</b> ${UI.esc(opp.n)}</span>
        </div>
        <svg class="live-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="6" class="live-field"/>
          <line x1="2" y1="${H/2}" x2="${W-2}" y2="${H/2}" class="live-mid"/>
          <circle cx="${W/2}" cy="${H/2}" r="14" class="live-circle"/>
          <rect x="${W/2-12}" y="2" width="24" height="4" class="live-box"/>
          <rect x="${W/2-12}" y="${H-6}" width="24" height="4" class="live-box"/>
          ${pts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${p.s==='me'?3.4:2.2}" fill="${p.s==='me'?'#ff2740':p.s==='opp'?'#cfcfcf':'#3da35d'}" ${p.s==='me'?'stroke="#fff" stroke-width="0.6"':''}/>`).join('')}
          <circle id="live-ball" cx="${ball.x}" cy="${ball.y}" r="2.6" fill="#ffd21e"/>
        </svg>
        <div class="live-status" id="live-status">⚽ Aquecimento…</div>
        <div class="live-qte" id="live-qte"></div>
        <div class="live-log" id="live-log"></div>
      </div>`;
    document.body.appendChild(overlay);

    const ballEl = overlay.querySelector('#live-ball');
    const statusEl = overlay.querySelector('#live-status');
    const qteEl = overlay.querySelector('#live-qte');
    const logEl = overlay.querySelector('#live-log');
    const svgEl = overlay.querySelector('.live-svg');

    function moveBall(zone, cb){
      const ty = zoneY(zone);
      const tx = (zone==='ataque') ? (youIdx>=0?pts[youIdx].x:50) : 50;
      ball.x = tx; ball.y = ty;
      ballEl.style.transition = 'cx .6s ease, cy .6s ease';
      ballEl.setAttribute('cx', tx); ballEl.setAttribute('cy', ty);
      statusEl.textContent = `⚽ Bola no ${zone==='ataque'?'ataque':zone==='meio'?'meio-campo':'campo defensivo'}…`;
      setTimeout(cb, 650);
    }

    function logLine(txt, good){
      const d = document.createElement('div'); d.className = 'live-log-line'+(good?' good':' bad'); d.textContent = txt;
      logEl.prepend(d);
    }

    function finish(){
      overlay.remove();
      const mods = {
        goals: acc.goals, assists: acc.assists, gaSaved: acc.gaSaved,
        rating: acc.rating, special: acc.special
      };
      onDone(mods);
    }

    function nextQTE(){
      if (qi >= qtes.length){ finish(); return; }
      const q = qtes[qi++];
      moveBall(q.zone, ()=> runQTE(q, (res)=>{
        // aplica resultado
        if (res.win){
          if (q.win.goals) acc.goals += q.win.goals;
          if (q.win.assists) acc.assists += q.win.assists;
          if (q.win.gaSaved) acc.gaSaved += q.win.gaSaved;
          if (q.win.rating) acc.rating += q.win.rating;
          if (q.win.special) acc.special = true;
          logLine('✅ '+(q.label), true);
        } else {
          if (q.lose.rating) acc.rating += q.lose.rating;
          logLine('❌ '+(q.label), false);
        }
        qteEl.innerHTML = '';
        statusEl.textContent = `Lance ${qi}/${qtes.length}…`;
        setTimeout(nextQTE, 350);
      }));
    }

    function runQTE(q, cb){
      if (q.type==='timing') runTiming(q, cb);
      else runChoice(q, cb);
    }

    function runTiming(q, cb){
      const attrVal = (S.attrs && q.attr) ? (S.attrs[q.attr]||50) : 50;
      // janela "doce" (0..1) — atributo alto = janela maior
      const sweetW = 0.12 + (attrVal/100)*0.18; // 0.12..0.30
      const center = 0.5;
      const lo = center - sweetW/2, hi = center + sweetW/2;
      let t = 0, dir = 1, raf=null, done=false;
      qteEl.innerHTML = `
        <div class="qte qte-timing">
          <div class="qte-label">${q.label}</div>
          <div class="qte-bar"><div class="qte-sweet" style="left:${lo*100}%;width:${sweetW*100}%"></div><div class="qte-mark" id="qte-mark"></div></div>
          <button class="btn btn-red qte-go" id="qte-go">DISPARAR ⚡</button>
          <div class="qte-hint">Clique no momento certo (na faixa dourada)</div>
        </div>`;
      const mark = qteEl.querySelector('#qte-mark');
      function step(){ if(done) return; t += 0.022*dir; if(t>1){t=1;dir=-1;} if(t<0){t=0;dir=1;} mark.style.left=(t*100)+'%'; raf=requestAnimationFrame(step); }
      raf = requestAnimationFrame(step);
      qteEl.querySelector('#qte-go').onclick = ()=>{
        if (done) return; done=true; if(raf)cancelAnimationFrame(raf);
        const win = (t>=lo && t<=hi);
        cb({ win });
      };
    }

    function runChoice(q, cb){
      const correct = Math.floor(Math.random()*q.choices.length);
      const meta = (q.arch && (q.arch==='metavista'||q.arch==='metavista_mei'||q.arch==='metavista_total'||q.arch==='hibrido'||q.arch==='hibrido_absoluto'));
      qteEl.innerHTML = `
        <div class="qte qte-choice">
          <div class="qte-label">${q.label}</div>
          <div class="qte-choices">${q.choices.map((c,i)=>`<button class="btn qte-opt" data-i="${i}">${c}${meta&&i===correct?' ✨':''}</button>`).join('')}</div>
          ${meta?'<div class="qte-hint">Metavisão revela a melhor opção (✨)</div>':'<div class="qte-hint">Escolha a melhor opção</div>'}
        </div>`;
      qteEl.querySelectorAll('.qte-opt').forEach(b=>{
        b.onclick = ()=>{
          const i = parseInt(b.dataset.i);
          cb({ win: i===correct });
        };
      });
    }

    // inicia
    statusEl.textContent = '⚽ Aquecimento…';
    setTimeout(nextQTE, 700);
  }

  window.showLiveMatch = showLiveMatch;
})();
