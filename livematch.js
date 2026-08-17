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

  // ---------- tela ao vivo ----------
  function showLiveMatch(S, wk, onDone){
    const opp = wk && wk.opp ? wk.opp : {n:'Adversário', o:70};
    const qtes = buildQTEs(S);
    const acc = { goals:0, assists:0, gaSaved:0, rating:0, special:false, oppGoals:0, attrLog:[] };
    let qi = 0;
    let clock = 0;
    const totalLances = qtes.length;
    const pts = formationPts();
    const youIdx = pts.findIndex(p=>p.s==='me');
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
    const myEl = overlay.querySelector('#live-my');
    const oppEl = overlay.querySelector('#live-opp');
    const clockEl = overlay.querySelector('#live-clock');

    function moveBall(zone, cb){
      const ty = zoneY(zone);
      const tx = (zone==='ataque') ? (youIdx>=0?pts[youIdx].x:50) : 50;
      ball.x = tx; ball.y = ty;
      ballEl.style.transition = 'cx .42s cubic-bezier(.4,1.4,.5,1), cy .42s cubic-bezier(.4,1.4,.5,1)';
      ballEl.setAttribute('cx', tx); ballEl.setAttribute('cy', ty);
      statusEl.textContent = `⚽ Bola no ${zone==='ataque'?'ataque':zone==='meio'?'meio-campo':'campo defensivo'}…`;
      setTimeout(cb, 480);
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
        setTimeout(nextQTE, 180);
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
        };
      });
    }

    // inicia
    statusEl.textContent = '⚽ Aquecimento…';
    setTimeout(nextQTE, 450);
  }

  window.showLiveMatch = showLiveMatch;
})();
