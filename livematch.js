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

  // gera a lista de QTEs conforme a posição + arquétipo + mental (4 por jogo, + especiais)
  function buildQTEs(S){
    const pos = S.pos;
    const A = (typeof resolveArchetype==='function')?resolveArchetype(S.archetype):null;
    const M = (typeof resolveArchetype==='function')?resolveArchetype(S.mental):null;
    const qtes = [];
    const push = (q)=>qtes.push(q);
    // modificadores por arquétipo/mental
    const predador = (A&&A.k==='predador')||(A&&A.k==='predador_lider')||(M&&(M.k==='predador'||M.k==='predador_lider'));
    const meta = (A&&/metavista/.test(A.k))||(M&&/metavista/.test(M.k));
    const hybrid = (A&&/hibrido/.test(A.k))||(M&&/hibrido/.test(M.k));
    const defAura = (A&&A.signature&&A.signature.defAura)||(M&&M.signature&&M.signature.defAura);
    // ajuste de janela de timing: predador amplia (instinto), metavisa aperta (precisão), defAura amplia em defesa
    const sweetMul = predador?1.35 : meta?0.7 : 1;
    const defSweetMul = defAura?1.4 : 1;
    const atk = (q)=>{ q.sweetMul = sweetMul; return q; };
    const def = (q)=>{ q.sweetMul = defSweetMul; return q; };
    const MENTAL = M && M.k; // mental ativo (predador/metavista/hibrido)

    if (pos==='ATA'){
      push(atk({type:'timing', key:'finaliza', label:'FINALIZAÇÃO', attr:'Finalização', zone:'ataque', win:{goals:1}, lose:{rating:-0.3}, arch:A&&A.k, mental:MENTAL}));
      push({type:'choice', key:'drible', label:'PASSE DE LETRA / DRIBLE', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{goals:1}, lose:{rating:-0.2}, arch:A&&A.k, mental:MENTAL});
      push(atk({type:'timing', key:'finaliza2', label:'CHANCE DE OURO', attr:'Finalização', zone:'ataque', win:{goals:1, special:true}, lose:{rating:-0.3}, arch:A&&A.k, mental:MENTAL}));
      push({type:'timing', key:'posse', label:'RECUperaÇÃO DE POSSE', attr:'Posicionamento', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
    } else if (pos==='MEI'){
      push({type:'choice', key:'passe', label:'ENFIADA DE PASSE', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1}, lose:{rating:-0.2}, arch:M&&M.k, mental:MENTAL});
      push(atk({type:'timing', key:'finaliza', label:'INFILTRA E FINALIZA', attr:'Finalização', zone:'ataque', win:{goals:1}, lose:{rating:-0.3}, arch:A&&A.k, mental:MENTAL}));
      push({type:'choice', key:'leitura', label:'LEITURA DE JOGO', choices:['Marcar','Armar','Seguir'], zone:'meio', win:{assists:1, rating:0.1}, lose:{rating:-0.2}, arch:M&&M.k, mental:MENTAL});
      push({type:'timing', key:'posse', label:'DOMÍNIO DE MEIO', attr:'Visão', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
    } else if (pos==='VOL'){
      push(def({type:'timing', key:'desarme', label:'DESARME DECISIVO', attr:'Marcação', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL}));
      push({type:'choice', key:'passe', label:'SAÍDA DE BOLA', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1}, lose:{rating:-0.2}, arch:M&&M.k, mental:MENTAL});
      push({type:'timing', key:'posse', label:'CHEGADA AO ATAQUE', attr:'Interceptação', zone:'ataque', win:{assists:1}, lose:{rating:-0.1}, mental:MENTAL});
      push(def({type:'timing', key:'defesa', label:'INTERVENÇÃO', attr:'Posicionamento', zone:'meio', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
    } else if (pos==='ZAG'){
      push(def({type:'timing', key:'defesa', label:'INTERVENÇÃO NA ÁREA', attr:'Marcação', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, arch:M&&M.k, mental:MENTAL}));
      push(def({type:'timing', key:'defesa2', label:'DIVIDA AÉREA', attr:'Cabeceio', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
      push({type:'choice', key:'posse', label:'POSICIONAMENTO', choices:['Subir','Segurar','Recuar'], zone:'defesa', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
      push(def({type:'timing', key:'desarme', label:'CARGA NO MEIA', attr:'Interceptação', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL}));
    } else if (pos==='LAT'){
      push(atk({type:'timing', key:'cruzamento', label:'CRUZAMENTO NA ÁREA', attr:'Cruzamento', zone:'ataque', win:{assists:1}, lose:{rating:-0.2}, arch:A&&A.k, mental:MENTAL}));
      push({type:'choice', key:'drible', label:'INFILTRAÇÃO PELA LINHA', choices:['Interna','Centro','Externa'], zone:'ataque', win:{assists:1}, lose:{rating:-0.2}, mental:MENTAL});
      push(def({type:'timing', key:'defesa', label:'RECORRER O CONTROLE', attr:'Marcação', zone:'meio', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
      push(atk({type:'timing', key:'posse', label:'SUBIDA DE LATERAL', attr:'Velocidade', zone:'ataque', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL}));
    } else if (pos==='GOL'){
      push(def({type:'timing', key:'defesa', label:'DEFESA DIFÍCIL', attr:'Reflexos', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, arch:M&&M.k, mental:MENTAL}));
      push(def({type:'timing', key:'defesa2', label:'SAÍDA DE GOL', attr:'Saída', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
      push({type:'choice', key:'posse', label:'POSICIONAMENTO', choices:['Fechar Ângulo','Sair','Recuar'], zone:'defesa', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
      push(def({type:'timing', key:'defesa3', label:'DEFESA DE PÉ', attr:'Anticipação', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
    }
    // QTEs ESPECIAIS de mental (aparecem SE o mental despertou)
    if (predador){
      push(atk({type:'timing', key:'predador', label:'👹 INSTINTO PREDADOR', attr:'Finalização', zone:'ataque', win:{goals:1, special:true}, lose:{rating:-0.2}, arch:'predador', mental:'predador', specialLabel:'GOL DE DESTAQUE DO PREDADOR'}));
    }
    if (meta){
      push({type:'choice', key:'metavista', label:'👁 METAVISÃO', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1, rating:0.2}, lose:{rating:-0.2}, arch:'metavista', mental:'metavista', metaReveal:true});
    }
    if (hybrid){
      push({type:'hybrid', key:'hibrido', label:'🜂 DOMÍNIO TOTAL', attr:'Finalização', zone:'ataque', win:{goals:1, assists:1, special:true}, lose:{rating:-0.3}, arch:'hibrido', mental:'hibrido'});
    }
    return qtes;
  }

  function zoneY(zone){ return zone==='ataque'?40 : zone==='meio'?120 : 178; }

  // gera elenco (nomes) alinhado aos 15 pontos da formação 4-3-3 + G adversário
  const SQUAD_POOL = ['Isagi','Bachira','Chigiri','Kunigami','Rin','Nagi','Reo','Hiori','Aiku','Barou','Otoya','Karla','Café','Aryu','Zantetsu','Gagamaru','Kunigami','Yukimiya'];
  function buildSquad(S, opp){
    const youIdx = (function(){ const I={GOL:0,ZAG:2,LAT:1,VOL:5,MEI:8,ATA:11}; return I[S.pos]!=null?I[S.pos]:0; })();
    const squad = SQUAD_POOL.slice(); let si=0; const pick=()=> squad[(si++)%squad.length];
    const names = [];
    for (let i=0;i<15;i++){
      if (i===youIdx) names.push(S.name||'Você');
      else if (i===14) names.push((opp&&opp.n?opp.n:'Adv')+' G');
      else names.push(pick());
    }
    return names;
  }

  // ---------- tela ao vivo ----------
  function showLiveMatch(S, wk, onDone){
    const opp = wk && wk.opp ? wk.opp : {n:'Adversário', o:70};
    const qtes = buildQTEs(S);
    const acc = { goals:0, assists:0, gaSaved:0, rating:0, special:false, oppGoals:0, attrLog:[] };
    let qi = 0;
    let currentQ = null;
    let clock = 0;
    const totalLances = qtes.length;
    const pts = formationPts();
    // marca o ponto do jogador do usuário conforme a posição real (não fixo no GOL)
    const POS_INDEX = { GOL:0, ZAG:2, LAT:1, VOL:5, MEI:8, ATA:11 };
    const youIdx = (POS_INDEX[S.pos]!=null) ? POS_INDEX[S.pos] : pts.findIndex(p=>p.s==='me');
    pts.forEach((p,i)=>{ p.s = (i===youIdx)?'me':'me'; }); // time da casa = 'me' (verde/ciano)
    // adversário já vem com s:'opp' na formação; garantir
    pts[pts.length-1].s = 'opp';
    const squad = buildSquad(S, opp); // nomes alinhados aos 15 pontos
    let ball = { x:50, y:178 };

    const overlay = document.createElement('div');
    overlay.id = 'live-overlay';
    overlay.innerHTML = `
      <div class="live-wrap">
        <div class="live-tv">
          <div class="live-tv-team"><b>${UI.esc(S.teamName)}</b><span id="live-my">0</span></div>
          <div class="live-tv-mid"><span id="live-clock">0'</span></div>
          <div class="live-tv-team rev"><span id="live-opp">0</span><b>${UI.esc(opp.n)}</b></div>
        </div>
        <div class="live-top">
          <span class="live-cup">${UI&&UI.S? (LEAGUE_BY_ID&&LEAGUE_BY_ID(S.leagueId)?LEAGUE_BY_ID(S.leagueId).short:'LIGA') : 'LIGA'}</span>
          <span class="live-vs">${UI.esc(S.teamName)} <b>×</b> ${UI.esc(opp.n)}</span>
          <button class="btn live-watch" id="live-watch">▶ Assistir</button>
        </div>
        <svg class="live-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="6" class="live-field"/>
          <line x1="2" y1="${H/2}" x2="${W-2}" y2="${H/2}" class="live-mid"/>
          <circle cx="${W/2}" cy="${H/2}" r="14" class="live-circle"/>
          <rect x="${W/2-12}" y="2" width="24" height="4" class="live-box"/>
          <rect x="${W/2-12}" y="${H-6}" width="24" height="4" class="live-box"/>
          <g id="live-players"></g>
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
    const myEl = overlay.querySelector('#live-my');
    const oppEl = overlay.querySelector('#live-opp');
    const clockEl = overlay.querySelector('#live-clock');
    const watchBtn = overlay.querySelector('#live-watch');

    // animação contínua — simulação de jogo: bola com um dono, passes periódicos, time sobe/desce
    let autoMode = false;
    // constrói os 22 marcadores (estilo tática): círculo + rótulo de posição
    const playersG = overlay.querySelector('#live-players');
    const SVGNS = 'http://www.w3.org/2000/svg';
    const playerBase = pts.map((p,i)=>{
      const g = document.createElementNS(SVGNS,'g'); g.setAttribute('class','live-pl');
      const c = document.createElementNS(SVGNS,'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.setAttribute('r', (i===youIdx)?3.6:2.4);
      const isYou = (i===youIdx);
      c.setAttribute('fill', p.s==='opp'?'#ff5bd0':(isYou?'#ffd21e':'#36e0ff'));
      c.setAttribute('stroke', isYou?'#fff':'rgba(0,0,0,.45)');
      c.setAttribute('stroke-width', isYou?'1':'0.5');
      if (isYou) c.setAttribute('class','live-you');
      const label = document.createElementNS(SVGNS,'text');
      label.setAttribute('x', p.x); label.setAttribute('y', p.y-4.5);
      label.setAttribute('text-anchor','middle');
      label.setAttribute('class','live-plabel'+(isYou?' you':''));
      label.textContent = (squad[i]||p.n);
      g.appendChild(c); g.appendChild(label);
      playersG.appendChild(g);
      return { idx:i, g, circle:c, label, x:p.x, y:p.y, s:p.s, you:isYou, ph:Math.random()*6.28, amp:0.9, cx:p.x, cy:p.y };
    });
    const ballRing = (()=>{ const r = document.createElementNS('http://www.w3.org/2000/svg','circle'); r.setAttribute('r','4.2'); r.setAttribute('fill','none'); r.setAttribute('stroke','#ffd21e'); r.setAttribute('stroke-width','1'); r.setAttribute('opacity','0'); r.setAttribute('class','live-ring'); svgEl.appendChild(r); return r; })();
    let animT = 0, animRaf=null;
    let possessor = playerBase[Math.floor(Math.random()*playerBase.length)];
    let passTarget = null, passT = 0, passFrom=null;
    let passTimer = (0.7 + Math.random()*0.8);
    function animStep(){
      animT += 0.045;
      // movimento ORIENTADO À BOLA (parece jogo, não ruído)
      const bx = +ballEl.getAttribute('cx'), by = +ballEl.getAttribute('cy');
      // acha o marcador mais próximo da bola entre os adversários (quem pressiona)
      let presser=null, pd=1e9;
      for (const p of playerBase){ if (p.s==='opp'){ const d=Math.hypot(p.x-bx,p.y-by); if(d<pd){pd=d;presser=p;} } }
      for (const p of playerBase){
        let tx = p.x, ty = p.y; // alvo = posição de casa (formação)
        if (p.s===possessor.s && !p.you){
          // companheiro do dono abre opção: aproxima um pouco do dono
          tx = p.x + (possessor.cx - p.x)*0.35;
          ty = p.y + (possessor.cy - p.y)*0.35;
        }
        if (p===presser){
          // adversário mais próximo marca o dono da bola
          tx = possessor.cx + (p.x-possessor.cx)*0.25;
          ty = possessor.cy + (p.y-possessor.cy)*0.25;
        } else if (p.s==='opp' && p!==possessor){
          // outros adversários recuam em direção à própria meta (y cresce)
          ty = p.y + 4;
        }
        if (p.you){
          // seu jogador acompanha o lance: se tem a bola, avança pra meta; senão, vai pro apoio
          if (p.s===possessor.s && p===possessor){ tx = bx; ty = Math.max(34, by-4); }
          else { tx = bx + (p.x-bx)*0.4; ty = by + (p.y-by)*0.4; }
        }
        // interpola suavemente em direção ao alvo + leve ruído de respiração
        const dx = Math.sin(animT*0.7 + p.ph)*0.5;
        const dy = Math.cos(animT*0.9 + p.ph*1.3)*0.5;
        p.cx += ((tx+dx) - p.cx)*0.08;
        p.cy += ((ty+dy) - p.cy)*0.08;
        p.circle.setAttribute('cx', p.cx.toFixed(2));
        p.circle.setAttribute('cy', p.cy.toFixed(2));
        p.label.setAttribute('x', p.cx.toFixed(2));
        p.label.setAttribute('y', (p.cy - 4.5).toFixed(2));
      }
      if (ball.locked){
        // durante a transição de lance, bola vai pra zona alvo (já setada via style transition)
      } else if (passTarget){
        passT += 0.06;
        const k = Math.min(1, passT);
        const bx = passFrom.cx + (passTarget.cx - passFrom.cx)*k;
        const by = passFrom.cy + (passTarget.cy - passFrom.cy)*k;
        ballEl.setAttribute('cx', bx.toFixed(2));
        ballEl.setAttribute('cy', by.toFixed(2));
        if (k>=1){ possessor = passTarget; passTarget=null; passFrom=null; passTimer = 0.7 + Math.random()*0.9; }
      } else {
        // bola colada no dono; dono avança em direção à meta adversária via loop acima
        ballEl.setAttribute('cx', possessor.cx.toFixed(2));
        ballEl.setAttribute('cy', (possessor.cy - 3).toFixed(2));
        // goleiro adversário se posiciona entre a bola e o gol (x da bola, y perto do gol)
        const gk = playerBase[playerBase.length-1];
        if (gk && gk.s==='opp'){ gk.cx += (bx - gk.cx)*0.05; gk.cy += (188 - gk.cy)*0.05; }
        passTimer -= 0.045;
        if (passTimer <= 0){
          const mates = playerBase.filter(p => p.s===possessor.s);
          const cand = mates[Math.floor(Math.random()*mates.length)];
          if (cand && cand!==possessor){ passFrom = possessor; passTarget = cand; passT = 0; }
          else { passTimer = 0.5; }
        }
      }
      // anel na bola
      ballRing.setAttribute('cx', ballEl.getAttribute('cx'));
      ballRing.setAttribute('cy', ballEl.getAttribute('cy'));
      animRaf = requestAnimationFrame(animStep);
    }
    animRaf = requestAnimationFrame(animStep);

    function setAuto(on){
      autoMode = on;
      watchBtn.textContent = on ? '⏸ Jogar' : '▶ Assistir';
      if (on){
        // se já há um QTE montado, dispara resolução automática
        const pending = qteEl.querySelector('#qte-go') || qteEl.querySelector('.qte-opt');
        if (pending) resolveAuto();
      }
    }
    watchBtn.onclick = ()=> setAuto(!autoMode);

    // resolve um QTE automaticamente (usando o atributo do jogador) — modo espectador
    function qteWinChance(q){
      const av = (S.attrs && q.attr) ? (S.attrs[q.attr]||50) : 60;
      let ch = 0.15 + (av-50)/50*0.6; // 50->0.15, 80->0.51, 95->0.69
      if (q.sweetMul) ch *= (q.sweetMul>1?0.8:1.15); // predador ajuda, metavisa exige mais
      return Math.max(0.08, Math.min(0.92, ch));
    }
    let autoTimer=null;
    function resolveAuto(){
      if (!autoMode) return;
      clearTimeout(autoTimer);
      const go = qteEl.querySelector('#qte-go');
      const opts = qteEl.querySelectorAll('.qte-opt');
      if (go){
        // timing: decide win e posiciona a marca na faixa (ou fora) antes de disparar
        const q = currentQ;
        const win = Math.random() < qteWinChance(q);
        const bar = qteEl.querySelector('.qte-bar');
        const sweet = bar ? bar.querySelector('.qte-sweet') : null;
        if (sweet){
          // posiciona a marca dentro/fora da faixa doce visualmente
          const loP = parseFloat(sweet.style.left), wP = parseFloat(sweet.style.width);
          const markPos = win ? (loP + wP/2) : (loP > 5 ? loP-6 : loP+wP+6);
          const mark = qteEl.querySelector('#qte-mark');
          if (mark) mark.style.left = Math.max(0,Math.min(100,markPos))+'%';
        }
        autoTimer = setTimeout(()=>{ if(autoMode) go.click(); }, 650);
      } else if (opts.length){
        const q = currentQ;
        const win = Math.random() < qteWinChance(q);
        const correct = +opts[0].dataset.i; // primeira é a correta se reveal, senão sorteia
        const correctIdx = opts[0].textContent.indexOf('✨')>=0 ? 0 : Math.floor(Math.random()*opts.length);
        autoTimer = setTimeout(()=>{ if(autoMode) opts[win?correctIdx:((correctIdx+1)%opts.length)].click(); }, 650);
      }
    }

    function moveBall(zone, cb){
      // durante a transição a bola viaja pra zona do lance; zera estado de passe
      passTarget = null; passFrom = null; ball.locked = true; ballRing.setAttribute('opacity','0');
      const ty = zoneY(zone);
      const tx = (zone==='ataque') ? (youIdx>=0?pts[youIdx].x:50) : 50;
      ball.x = tx; ball.y = ty;
      ballEl.style.transition = 'cx .42s cubic-bezier(.4,1.4,.5,1), cy .42s cubic-bezier(.4,1.4,.5,1)';
      ballEl.setAttribute('cx', tx); ballEl.setAttribute('cy', ty);
      statusEl.textContent = `⚽ Bola no ${zone==='ataque'?'ataque':zone==='meio'?'meio-campo':'campo defensivo'}…`;
      setTimeout(()=>{
        ball.locked = false;
        // dono da bola conforme a posse do lance: time da casa ataca, visitante defende
        const side = (zone==='defesa') ? 'opp' : 'me';
        const pool = playerBase.filter(p=>p.s===side);
        possessor = pool.length ? pool[Math.floor(Math.random()*pool.length)] : playerBase[0];
        passTimer = 0.5 + Math.random()*0.6;
        ballRing.setAttribute('opacity','0.9');
        cb();
      }, 480);
    }

    // feedback imediato: flash no campo + texto flutuante
    function flash(kind, txt){
      overlay.classList.remove('flash-win','flash-lose','flash-save');
      void overlay.offsetWidth; // reflow p/ reiniciar animação
      overlay.classList.add(kind==='win'?'flash-win':kind==='save'?'flash-save':'flash-lose');
      const pop = document.createElement('div');
      pop.className = 'live-pop '+(kind==='win'?'pop-win':kind==='save'?'pop-save':'pop-lose');
      pop.textContent = txt;
      overlay.querySelector('.live-wrap').appendChild(pop);
      setTimeout(()=>pop.remove(), 900);
    }

    function logLine(txt, good){
      const d = document.createElement('div'); d.className = 'live-log-line'+(good?' good':' bad'); d.textContent = txt;
      logEl.prepend(d);
    }

    function finish(){
      if (animRaf) cancelAnimationFrame(animRaf);
      if (autoTimer) clearTimeout(autoTimer);
      overlay.remove();
      // deriva atributos treinados pelos QTEs (acerto sobe, erro desce)
      const attrDeltas = {};
      acc.attrLog.forEach(l=>{
        const d = (l.win?1:-0.5);
        attrDeltas[l.attr] = (attrDeltas[l.attr]||0) + d;
      });
      const mods = {
        goals: acc.goals, assists: acc.assists, gaSaved: acc.gaSaved,
        rating: acc.rating, special: acc.special, attrDeltas
      };
      onDone(mods);
    }

    function nextQTE(){
      if (qi >= qtes.length){ finish(); return; }
      const q = qtes[qi++];
      currentQ = q;
      moveBall(q.zone, ()=> runQTE(q, (res)=>{
        // avança relógio virtual
        clock += Math.round(90/totalLances);
        if (clockEl) clockEl.textContent = Math.min(90,clock)+"'";
        // aplica resultado + feedback
        let popTxt='', popKind='lose', narr='';
        if (res.win){
          if (q.win.goals){ acc.goals += q.win.goals; popTxt='⚽ GOOOOL!'; popKind='win'; narr=`${q.label} — ${S.name} marca!`; }
          if (q.win.assists){ acc.assists += q.win.assists; popTxt='🅰️ ENADE!'; popKind='win'; narr=`${S.name} armou o companheiro!`; }
          if (q.win.gaSaved){ acc.gaSaved += q.win.gaSaved; popTxt='🧤 DEFESA!'; popKind='save'; narr=`${S.name} defendeu!`; }
          if (q.win.rating && !popTxt){ acc.rating += q.win.rating; popTxt='✅ BEM JOGADO'; popKind='win'; narr=`${S.name} se saiu bem.`; }
          if (q.win.special){ acc.special = true; if(popTxt==='⚽ GOOOOL!'){ popTxt='👹 GOL DE DESTAQUE!'; } }
          if (q.attr) acc.attrLog.push({ attr:q.attr, win:true });
          flash(popKind, popTxt);
          if (myEl) myEl.textContent = acc.goals;
          logLine('✅ '+(q.label), true);
        } else {
          if (q.lose.rating) acc.rating += q.lose.rating;
          if (q.win && q.win.gaSaved){ acc.oppGoals += 1; if(oppEl) oppEl.textContent = acc.oppGoals; }
          if (q.key && /defesa|desarme/.test(q.key)){ flash('lose', '❌ PASSEU!'); narr=`${S.name} não alcançou — gol adversário.`; }
          else { flash('lose', '❌ ERROU'); narr=`${S.name} errou a jogada.`; }
          if (q.attr) acc.attrLog.push({ attr:q.attr, win:false });
          logLine('❌ '+(q.label), false);
        }
        if (narr && logEl){ const n=document.createElement('div'); n.className='live-narr'; n.textContent='🎙️ '+narr; logEl.prepend(n); }
        qteEl.innerHTML = '';
        statusEl.textContent = `Lance ${qi}/${qtes.length}…`;
        setTimeout(nextQTE, autoMode?90:180);
      }));
    }

    function runQTE(q, cb){
      if (q.type==='timing') runTiming(q, cb);
      else if (q.type==='hybrid') runHybrid(q, cb);
      else runChoice(q, cb);
    }

    function runTiming(q, cb){
      const attrVal = (S.attrs && q.attr) ? (S.attrs[q.attr]||50) : 50;
      // janela "doce" mais estreita (dificuldade): 0.07..0.15 * mul
      const mul = q.sweetMul || 1;
      const sweetW = (0.07 + (attrVal/100)*0.08) * mul;
      const center = 0.5;
      const lo = center - sweetW/2, hi = center + sweetW/2;
      let t = 0, dir = 1, raf=null, done=false;
      qteEl.innerHTML = `
        <div class="qte qte-timing">
          <div class="qte-label">${q.label}</div>
          <div class="qte-bar"><div class="qte-sweet" style="left:${lo*100}%;width:${sweetW*100}%"></div><div class="qte-mark" id="qte-mark"></div></div>
          <button class="btn btn-red qte-go" id="qte-go">DISPARAR ⚡</button>
          <div class="qte-hint">Clique NA faixa dourada — precisa de precisão!</div>
        </div>`;
      const mark = qteEl.querySelector('#qte-mark');
      function step(){ if(done) return; t += 0.034*dir; if(t>1){t=1;dir=-1;} if(t<0){t=0;dir=1;} mark.style.left=(t*100)+'%'; raf=requestAnimationFrame(step); }
      raf = requestAnimationFrame(step);
      qteEl.querySelector('#qte-go').onclick = ()=>{
        if (done) return; done=true; if(raf)cancelAnimationFrame(raf);
        const win = (t>=lo && t<=hi);
        cb({ win });
      };
      if (autoMode) resolveAuto();
    }

    function runChoice(q, cb){
      const correct = Math.floor(Math.random()*q.choices.length);
      const reveal = q.metaReveal || (q.arch && (q.arch==='metavista'||q.arch==='metavista_mei'||q.arch==='metavista_total'||q.arch==='hibrido'||q.arch==='hibrido_absoluto'));
      qteEl.innerHTML = `
        <div class="qte qte-choice">
          <div class="qte-label">${q.label}</div>
          <div class="qte-choices">${q.choices.map((c,i)=>`<button class="btn qte-opt" data-i="${i}">${c}${reveal&&i===correct?' ✨':''}</button>`).join('')}</div>
          ${reveal?'<div class="qte-hint">Metavisão revela a melhor opção (✨)</div>':'<div class="qte-hint">Escolha a melhor opção</div>'}
        </div>`;
      qteEl.querySelectorAll('.qte-opt').forEach(b=>{
        b.onclick = ()=>{
          const i = parseInt(b.dataset.i);
          cb({ win: i===correct });
        };
      });
      if (autoMode) resolveAuto();
    }

    function runHybrid(q, cb){
      // QTE híbrido: escolhe a direção (choice) e depois dispara no timing do passe
      const correct = Math.floor(Math.random()*q.choices.length);
      qteEl.innerHTML = `
        <div class="qte qte-hybrid">
          <div class="qte-label">${q.label}</div>
          <div class="qte-choices">${q.choices.map((c,i)=>`<button class="btn qte-opt" data-i="${i}">${c}</button>`).join('')}</div>
          <div class="qte-hint">Escolha a jogada e DISPARE no momento certo</div>
        </div>`;
      qteEl.querySelectorAll('.qte-opt').forEach(b=>{
        b.onclick = ()=>{
          const i = parseInt(b.dataset.i);
          const dirOk = (i===correct);
          // fase 2: timing (mais estreita/rápida)
          const attrVal = (S.attrs && q.attr) ? (S.attrs[q.attr]||50) : 50;
          const sweetW = (0.08 + (attrVal/100)*0.08);
          const lo = 0.5 - sweetW/2, hi = 0.5 + sweetW/2;
          let t=0, dir=1, raf=null, done=false;
          qteEl.innerHTML = `
            <div class="qte qte-timing">
              <div class="qte-label">${q.label} — DISPARAR ⚡</div>
              <div class="qte-bar"><div class="qte-sweet" style="left:${lo*100}%;width:${sweetW*100}%"></div><div class="qte-mark" id="qte-mark"></div></div>
              <button class="btn btn-red qte-go" id="qte-go">DISPARAR ⚡</button>
            </div>`;
          const mark = qteEl.querySelector('#qte-mark');
          function step(){ if(done) return; t += 0.034*dir; if(t>1){t=1;dir=-1;} if(t<0){t=0;dir=1;} mark.style.left=(t*100)+'%'; raf=requestAnimationFrame(step); }
          raf = requestAnimationFrame(step);
          qteEl.querySelector('#qte-go').onclick = ()=>{ if(done) return; done=true; if(raf)cancelAnimationFrame(raf); cb({ win: dirOk && (t>=lo && t<=hi) }); };
          if (autoMode) resolveAuto();
        };
      });
      if (autoMode) resolveAuto();
    }

    // inicia
    statusEl.textContent = '⚽ Aquecimento…';
    setTimeout(nextQTE, 450);
  }

  window.showLiveMatch = showLiveMatch;
})();
