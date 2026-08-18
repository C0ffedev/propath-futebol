// ===== livematch.js — Partida AO VIVO com QTEs (estilo ProPath Valorant) =====
// Mostra o campo 4-3-3 animado (bola circulando def->meio->ataque) e, em cada
// parada, dispara um QTE. O resultado dos QTEs MODULA o desfecho individual do
// jogador (gols/assist/nota/sofridos), mantendo a tabela da liga coerente.
// Depende de globais: E, UI, window.modal, window.closeModal, window.showToast.

(function(){
  const W=100, H=200;

  // pontos da formação 4-3-3 (campo vertical: 0=ataque adversário, 200=defesa própria)
  // SEU time (side 'me', índices 0-10) + adversário espelhado (side 'opp', 11-21) = 22 marcadores
  function formationPts(){
    const home = [
      {x:50,y:188,n:'G'},
      {x:14,y:165,n:'LD'}, {x:38,y:170,n:'Z1'}, {x:62,y:170,n:'Z2'}, {x:86,y:165,n:'LE'},
      {x:24,y:122,n:'VOL1'}, {x:50,y:128,n:'VOL2'}, {x:76,y:122,n:'VOL3'},
      {x:30,y:36,n:'ATA1'}, {x:50,y:30,n:'ATA2'}, {x:70,y:36,n:'ATA3'}
    ];
    const away = home.map(p=>({ x:p.x, y:200-p.y, n:p.n+'_adv', s:'opp' }));
    return home.map(p=>({ ...p, s:'me' })).concat(away);
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
      push({type:'choice', key:'drible', label:'PASSE DE LETRA / DRIBLE', attr:'Drible', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{goals:1}, lose:{rating:-0.2}, arch:A&&A.k, mental:MENTAL});
      push(atk({type:'timing', key:'finaliza2', label:'CHANCE DE OURO', attr:'Finalização', zone:'ataque', win:{goals:1, special:true}, lose:{rating:-0.3}, arch:A&&A.k, mental:MENTAL}));
      push({type:'timing', key:'posse', label:'RECUperaÇÃO DE POSSE', attr:'Posicionamento', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
    } else if (pos==='MEI'){
      push({type:'choice', key:'passe', label:'ENFIADA DE PASSE', attr:'Passe', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1}, lose:{rating:-0.2}, arch:M&&M.k, mental:MENTAL});
      push(atk({type:'timing', key:'finaliza', label:'INFILTRA E FINALIZA', attr:'Finalização', zone:'ataque', win:{goals:1}, lose:{rating:-0.3}, arch:A&&A.k, mental:MENTAL}));
      push({type:'choice', key:'leitura', label:'LEITURA DE JOGO', attr:'Visão', choices:['Marcar','Armar','Seguir'], zone:'meio', win:{assists:1, rating:0.1}, lose:{rating:-0.2}, arch:M&&M.k, mental:MENTAL});
      push({type:'timing', key:'posse', label:'DOMÍNIO DE MEIO', attr:'Visão', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
    } else if (pos==='VOL'){
      push(def({type:'timing', key:'desarme', label:'DESARME DECISIVO', attr:'Marcação', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL}));
      push({type:'choice', key:'passe', label:'SAÍDA DE BOLA', attr:'Passe', choices:['Esquerda','Centro','Direita'], zone:'meio', win:{assists:1}, lose:{rating:-0.2}, arch:M&&M.k, mental:MENTAL});
      push({type:'timing', key:'posse', label:'CHEGADA AO ATAQUE', attr:'Interceptação', zone:'ataque', win:{assists:1}, lose:{rating:-0.1}, mental:MENTAL});
      push(def({type:'timing', key:'defesa', label:'INTERVENÇÃO', attr:'Posicionamento', zone:'meio', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
    } else if (pos==='ZAG'){
      push(def({type:'timing', key:'defesa', label:'INTERVENÇÃO NA ÁREA', attr:'Marcação', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, arch:M&&M.k, mental:MENTAL}));
      push(def({type:'timing', key:'defesa2', label:'DIVIDA AÉREA', attr:'Cabeceio', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
      push({type:'choice', key:'posse', label:'POSICIONAMENTO', attr:'Posicionamento', choices:['Subir','Segurar','Recuar'], zone:'defesa', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
      push(def({type:'timing', key:'desarme', label:'CARGA NO MEIA', attr:'Interceptação', zone:'meio', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL}));
    } else if (pos==='LAT'){
      push(atk({type:'timing', key:'cruzamento', label:'CRUZAMENTO NA ÁREA', attr:'Cruzamento', zone:'ataque', win:{assists:1}, lose:{rating:-0.2}, arch:A&&A.k, mental:MENTAL}));
      push({type:'choice', key:'drible', label:'INFILTRAÇÃO PELA LINHA', attr:'Drible', choices:['Interna','Centro','Externa'], zone:'ataque', win:{assists:1}, lose:{rating:-0.2}, mental:MENTAL});
      push(def({type:'timing', key:'defesa', label:'RECORRER O CONTROLE', attr:'Marcação', zone:'meio', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
      push(atk({type:'timing', key:'posse', label:'SUBIDA DE LATERAL', attr:'Velocidade', zone:'ataque', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL}));
    } else if (pos==='GOL'){
      push(def({type:'timing', key:'defesa', label:'DEFESA DIFÍCIL', attr:'Reflexos', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, arch:M&&M.k, mental:MENTAL}));
      push(def({type:'timing', key:'defesa2', label:'SAÍDA DE GOL', attr:'Saída', zone:'defesa', win:{gaSaved:1}, lose:{rating:-0.1}, mental:MENTAL}));
      push({type:'choice', key:'posse', label:'POSICIONAMENTO', attr:'Reflexos', choices:['Fechar Ângulo','Sair','Recuar'], zone:'defesa', win:{rating:0.2}, lose:{rating:-0.1}, mental:MENTAL});
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

  // ELENCOS REAIS — fonte: soccerwiki.org (Fluminense verificado) + elencos reais conhecidos.
  // Cada jogador: {n:nome, p:posição normalizada G|DEF|MID|FWD}
  // O jogo puxa SQUADS[S.teamName] (casa) e SQUADS[opp.n] (visitante); fallback _GENERIC.
  const SQUADS = {
    'Fluminense': [
      {n:'Fábio',p:'G'},{n:'Vitor Eudes',p:'G'},{n:'Marcelo Pitaluga',p:'G'},
      {n:'Samuel Xavier',p:'DEF'},{n:'Thiago Silva',p:'DEF'},{n:'Ignácio',p:'DEF'},
      {n:'Igor Rabello',p:'DEF'},{n:'Bruno Jemmes',p:'DEF'},{n:'Guilherme Arana',p:'DEF'},
      {n:'Martins Renê',p:'DEF'},{n:'Claudio Guga',p:'DEF'},{n:'Juan Pablo Freytes',p:'DEF'},
      {n:'Matheus Martinelli',p:'MID'},{n:'Hércules',p:'MID'},{n:'Passos Otávio',p:'MID'},
      {n:'Gustavo Nonato',p:'MID'},{n:'Ganso',p:'MID'},{n:'Luciano Acosta',p:'MID'},
      {n:'Germán Cano',p:'FWD'},{n:'John Kennedy',p:'FWD'},{n:'Jefferson Savarino',p:'FWD'},
      {n:'Agustín Canobbio',p:'FWD'},{n:'Hulk',p:'FWD'},{n:'Yeferson Soteldo',p:'FWD'},{n:'Kevin Serna',p:'FWD'}
    ],
    'Flamengo': [
      {n:'Rossi',p:'G'},{n:'Dyogo Alves',p:'G'},{n:'Cleiton',p:'G'},
      {n:'Léo Pereira',p:'DEF'},{n:'David Luiz',p:'DEF'},{n:'Pablo',p:'DEF'},
      {n:'Ayrton Lucas',p:'DEF'},{n:'Varela',p:'DEF'},{n:'Alex Sandro',p:'DEF'},
      {n:'Ortiz',p:'DEF'},{n:'Léo Gonçalves',p:'DEF'},
      {n:'Gerson',p:'MID'},{n:'Pulgar',p:'MID'},{n:'Arrascaeta',p:'MID'},
      {n:'De la Cruz',p:'MID'},{n:'Evertthon Araújo',p:'MID'},{n:'Allan',p:'MID'},
      {n:'Pedro',p:'FWD'},{n:'Bruno Henrique',p:'FWD'},{n:'Everton Cebolinha',p:'FWD'},
      {n:'Luiz Araújo',p:'FWD'},{n:'Michael',p:'FWD'},{n:'Carlinhos',p:'FWD'}
    ],
    'Vasco': [
      {n:'Léo Jardim',p:'G'},{n:'Daniel Fuzato',p:'G'},
      {n:'Puma Rodríguez',p:'DEF'},{n:'João Victor',p:'DEF'},{n:'Lucas Mendes',p:'DEF'},
      {n:'Paulinho',p:'DEF'},{n:'Lucas Piton',p:'DEF'},{n:'Victor Luis',p:'DEF'},
      {n:'Mateus Carvalho',p:'MID'},{n:'Maurício Lemos',p:'MID'},{n:'Sforza',p:'MID'},
      {n:'Payet',p:'MID'},{n:'Gustavo Silva',p:'MID'},
      {n:'Vegetti',p:'FWD'},{n:'Diniz',p:'FWD'},{n:'Maxime Dominguez',p:'FWD'},
      {n:'Lorran',p:'FWD'},{n:'Coutinho',p:'FWD'}
    ],
    'Botafogo': [
      {n:'John',p:'G'},{n:'Raul',p:'G'},
      {n:'Vitão',p:'DEF'},{n:'Bastos',p:'DEF'},{n:'Lewis',p:'DEF'},
      {n:'Cuiabano',p:'DEF'},{n:'Tchê Tchê',p:'DEF'},{n:'Marçal',p:'DEF'},
      {n:'Marlon Freitas',p:'MID'},{n:'Gregore',p:'MID'},{n:'Santos',p:'MID'},
      {n:'Artur',p:'MID'},{n:'Savarino',p:'MID'},
      {n:'Igor Jesus',p:'FWD'},{n:'Jeffinho',p:'FWD'},{n:'Kauê',p:'FWD'},
      {n:'Montoro',p:'FWD'},{n:'Newton',p:'FWD'}
    ],
    'Palmeiras': [
      {n:'Weverton',p:'G'},{n:'Hugo Souza',p:'G'},
      {n:'Gustavo Gómez',p:'DEF'},{n:'Murilo',p:'DEF'},{n:'Luan',p:'DEF'},
      {n:'Piquerez',p:'DEF'},{n:'Mayke',p:'DEF'},{n:'Vitor Reis',p:'DEF'},
      {n:'Richard Ríos',p:'MID'},{n:'Zé Rafael',p:'MID'},{n:'Veiga',p:'MID'},
      {n:'Maurício',p:'MID'},{n:'Raphael Veiga',p:'MID'},
      {n:'Estêvão',p:'FWD'},{n:'Flaco López',p:'FWD'},{n:'Vitor Roque',p:'FWD'},
      {n:'Facundo Torres',p:'FWD'},{n:'Thalys',p:'FWD'}
    ],
    'Corinthians': [
      {n:'Hugo Souza',p:'G'},{n:'Matheus Donelli',p:'G'},
      {n:'Félix Torres',p:'DEF'},{n:'André Ramalho',p:'DEF'},{n:'Walce',p:'DEF'},
      {n:'Hugo',p:'DEF'},{n:'Matheuzinho',p:'DEF'},{n:'Marcelo',p:'DEF'},
      {n:'Maycon',p:'MID'},{n:'Garro',p:'MID'},{n:'Bidon',p:'MID'},
      {n:'Carrillo',p:'MID'},{n:'Memphis',p:'MID'},
      {n:'Yuri Alberto',p:'FWD'},{n:'Héctor Hernández',p:'FWD'},{n:'Talles Magno',p:'FWD'},
      {n:'Pedrinho',p:'FWD'},{n:'Léo Mana',p:'FWD'}
    ],
    '_GENERIC': [
      {n:'Fábio',p:'G'},{n:'Rossi',p:'G'},
      {n:'Thiago Silva',p:'DEF'},{n:'David Luiz',p:'DEF'},{n:'Marquinhos',p:'DEF'},
      {n:'Ayrton Lucas',p:'DEF'},{n:'Varela',p:'DEF'},{n:'Gomez',p:'DEF'},
      {n:'Gerson',p:'MID'},{n:'Pulgar',p:'MID'},{n:'Ganso',p:'MID'},
      {n:'Arrascaeta',p:'MID'},{n:'Veiga',p:'MID'},
      {n:'Gabigol',p:'FWD'},{n:'Pedro',p:'FWD'},{n:'Hulk',p:'FWD'},
      {n:'Cano',p:'FWD'},{n:'Soteldo',p:'FWD'}
    ]
  };
  // seleciona 11 (1 G + 4 DEF + 3 MID + 3 FWD) na ordem dos slots da formação 4-3-3
  function pick11(squad, userPos, userName){
    squad = squad && squad.length ? squad : SQUADS._GENERIC;
    const by = p => squad.filter(x=>x.p===p);
    const gs = by('G'), ds = by('DEF'), ms = by('MID'), fs = by('FWD');
    const need = { G:1, DEF:4, MID:3, FWD:3 };
    const take = (arr,n,def)=>{ const out=[]; for(let i=0;i<n;i++) out.push(arr[i]||def); return out; };
    const slots = [
      ...take(gs,1,{n:'Goleiro',p:'G'}),
      ...take(ds,4,{n:'Zagueiro',p:'DEF'}),
      ...take(ms,3,{n:'Meia',p:'MID'}),
      ...take(fs,3,{n:'Atacante',p:'FWD'})
    ];
    if (userPos && userName){
      const SLOT = { GOL:0, ZAG:2, LAT:1, VOL:6, MEI:5, ATA:9 };
      const idx = (SLOT[userPos]!=null)?SLOT[userPos]:9;
      slots[idx] = { n:userName, p: (SLOT[userPos]!=null?['G','DEF','DEF','DEF','DEF','MID','MID','MID','FWD','FWD','FWD'][idx]:'MID') };
    }
    return slots.map(s=>s.n);
  }
  // 11 do seu time (0-10) + 11 adversários (11-21). youIdx substitui o nome na posição do usuário.
  function buildSquad(S, opp){
    const home = pick11(SQUADS[(S.teamName||'Fluminense')] || SQUADS['Fluminense'], S.pos, S.name);
    const away = pick11(SQUADS[(opp&&opp.n)||'_GENERIC'] || SQUADS._GENERIC, null, null);
    return home.concat(away);
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
    const POS_INDEX = { GOL:0, ZAG:2, LAT:1, VOL:6, MEI:5, ATA:9 };
    const youIdx = (POS_INDEX[S.pos]!=null) ? POS_INDEX[S.pos] : pts.findIndex(p=>p.s==='me');
    // O s (side) de cada ponto já vem correto do formationPts: casa='me', visitante='opp'.
    // Não sobrescrever aqui (bug anterior pintava os 11 adversários de azul em vez de vermelho).
    const squad = buildSquad(S, opp); // nomes alinhados aos 15 pontos
    let ball = { x:50, y:178 };

    const overlay = document.createElement('div');
    overlay.id = 'live-overlay';
    // nome por extenso da competição da partida (ou da liga principal)
    const _cupDef = (wk&&wk.comp) ? ((typeof COMP_BY_ID==='function')?COMP_BY_ID(wk.comp):null) : null;
    const _lgDef = (LEAGUE_BY_ID&&LEAGUE_BY_ID(S.leagueId)) ? LEAGUE_BY_ID(S.leagueId) : null;
    const _cupName = _cupDef ? _cupDef.name : (_lgDef ? _lgDef.name : 'LIGA');
    const _cupShort = _cupDef ? _cupDef.short : (_lgDef ? _lgDef.short : 'LIGA');
    const _cupPhase = (wk&&wk.comp&&_cupDef&&_cupDef.type==='mata') ? (' — Fase '+(wk.round||1)) : (wk&&wk.round?(' — Rodada '+(wk.round||1)):'');
    overlay.innerHTML = `
      <div class="live-wrap">
        <div class="live-title">${UI.esc(_cupName)}${UI.esc(_cupPhase)}</div>
        <div class="live-tv">
          <div class="live-tv-team"><b>${UI.esc(S.teamName)}</b><span id="live-my">0</span></div>
          <div class="live-tv-mid"><span id="live-clock">0'</span></div>
          <div class="live-tv-team rev"><span id="live-opp">0</span><b>${UI.esc(opp.n)}</b></div>
        </div>
        <div class="live-progress"><div class="live-progress-fill" id="live-progress"></div></div>
        <div class="live-top">
          <span class="live-cup">${_cupShort}</span>
          <span class="live-vs">${UI.esc(S.teamName)} <b>×</b> ${UI.esc(opp.n)}</span>
          <button class="btn live-watch" id="live-watch">▶ Assistir</button>
        </div>
        <svg class="live-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
          <rect x="2" y="2" width="${W-4}" height="${H-4}" rx="6" class="live-field"/>
          <line x1="2" y1="${H/2}" x2="${W-2}" y2="${H/2}" class="live-mid"/>
          <circle cx="${W/2}" cy="${H/2}" r="14" class="live-circle"/>
          <rect x="${W/2-12}" y="2" width="24" height="4" class="live-box"/>
          <rect x="${W/2-12}" y="${H-6}" width="24" height="4" class="live-box"/>
          <g id="live-zone"></g>
          <g id="live-players"></g>
          <g id="live-trail"></g>
          <circle id="live-owner-ring" class="live-ring-off" cx="${ball.x}" cy="${ball.y}" r="5" fill="none" stroke="#ffd21e" stroke-width="1.1" opacity="0"/>
          <g id="live-pass"></g>
          <circle id="live-ball" cx="${ball.x}" cy="${ball.y}" r="2.6" fill="#ffd21e"/>
          <g id="live-shadow"></g>
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
    const progressEl = overlay.querySelector('#live-progress');
    const watchBtn = overlay.querySelector('#live-watch');
    const zoneG = overlay.querySelector('#live-zone');
    const ownerRing = overlay.querySelector('#live-owner-ring');
    const passG = overlay.querySelector('#live-pass');
    const trailG = overlay.querySelector('#live-trail');
    const shadowG = overlay.querySelector('#live-shadow');

    // marcadores estáticos em formação (o jogo pausa no QTE, então não há corrida contínua)
    let autoMode = false;
    const playersG = overlay.querySelector('#live-players');
    const SVGNS = 'http://www.w3.org/2000/svg';
    const playerBase = pts.map((p,i)=>{
      const g = document.createElementNS(SVGNS,'g'); g.setAttribute('class','live-pl');
      const c = document.createElementNS(SVGNS,'circle');
      c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      c.setAttribute('r', (i===youIdx)?3.6:2.4);
      const isYou = (i===youIdx);
      c.setAttribute('fill', p.s==='opp'?'#ff2740':(isYou?'#ffd21e':'#2e7bff'));
      c.setAttribute('stroke', isYou?'#fff':(p.s==='opp'?'#ff9aa6':'#9cc4ff'));
      c.setAttribute('stroke-width', isYou?'1':'0.5');
      if (isYou) c.setAttribute('class','live-you');
      const label = document.createElementNS(SVGNS,'text');
      label.setAttribute('x', p.x); label.setAttribute('y', p.y-4.5);
      label.setAttribute('text-anchor','middle');
      label.setAttribute('class','live-plabel'+(isYou?' you':''));
      label.textContent = (squad[i]||p.n);
      // número de camisa curto (G/LD/Z1/Z2/LE/VOL1-3/ATA1-3) abaixo do marcador
      const num = document.createElementNS(SVGNS,'text');
      num.setAttribute('x', p.x); num.setAttribute('y', p.y+5.5);
      num.setAttribute('text-anchor','middle');
      num.setAttribute('class','live-pnum'+(isYou?' you':''));
      num.textContent = p.n;
      g.appendChild(c); g.appendChild(label); g.appendChild(num);
      playersG.appendChild(g);
      return { idx:i, g, circle:c, label, num, x:p.x, y:p.y, s:p.s, you:isYou, cx:p.x, cy:p.y };
    });
    let animRaf=null;
    const trailPos = []; // CAMADA 1 (4): histórico de posições da bola p/ rastro
    const posseCount = {}; // CAMADA 4 (10): heatmap de posse por jogador (idx -> contagens)

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
      const ty = zoneY(zone);
      const tx = (zone==='ataque') ? (youIdx>=0?pts[youIdx].x:50) : 50;
      const fromX = ball.x, fromY = ball.y;
      ball.x = tx; ball.y = ty;
      // ---- CAMADA 1 (4): rastro da bola (histórico de posições, opacidade/raio crescentes) ----
      // Não limpa a cada lance: o rastro ACUMULA durante a partida (mais cinematográfico)
      if (trailG){
        trailPos.push({x:tx,y:ty});
        if (trailPos.length>8) trailPos.shift();
        trailG.innerHTML = '';
        trailPos.forEach((p,k)=>{
          const t = document.createElementNS(SVGNS,'circle');
          t.setAttribute('cx', p.x); t.setAttribute('cy', p.y);
          t.setAttribute('r', (0.8 + (k/trailPos.length)*1.4).toFixed(2));
          t.setAttribute('fill', '#ffd21e');
          t.setAttribute('opacity', (0.10 + (k/trailPos.length)*0.45).toFixed(2));
          trailG.appendChild(t);
        });
      }
      // ---- FRENTE A (2): dono da posse = jogador mais próximo da bola (calculado ANTES da linha p/ encadear) ----
      let nearest=null, nd=1e9;
      playerBase.forEach(pb=>{ const d=(pb.x-tx)*(pb.x-tx)+(pb.y-ty)*(pb.y-ty); if(d<nd){nd=d;nearest=pb;} });
      // ---- FRENTE A (1) + CAMADA 4 (9): linha de passe CONTÍNUA bola→dono→zona, com seta na ponta ----
      passG.innerHTML = '';
      const passPts = [ {x:fromX,y:fromY}, (nearest?{x:nearest.x,y:nearest.y}:{x:fromX,y:fromY}), {x:tx,y:ty} ];
      const passPath = document.createElementNS(SVGNS,'polyline');
      passPath.setAttribute('points', passPts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
      passPath.setAttribute('class','live-pass');
      passPath.setAttribute('fill','none');
      passG.appendChild(passPath);
      // ponta de seta na direção final (zona)
      const ang = Math.atan2(ty-(nearest?nearest.y:fromY), tx-(nearest?nearest.x:fromX));
      const ah = 3.2; // tamanho da seta
      const ax1 = tx - ah*Math.cos(ang - Math.PI/7), ay1 = ty - ah*Math.sin(ang - Math.PI/7);
      const ax2 = tx - ah*Math.cos(ang + Math.PI/7), ay2 = ty - ah*Math.sin(ang + Math.PI/7);
      const arrow = document.createElementNS(SVGNS,'polygon');
      arrow.setAttribute('points', `${tx},${ty} ${ax1.toFixed(1)},${ay1.toFixed(1)} ${ax2.toFixed(1)},${ay2.toFixed(1)}`);
      arrow.setAttribute('class','live-pass-arrow');
      passG.appendChild(arrow);
      if (nearest){
        ownerRing.setAttribute('cx', nearest.x); ownerRing.setAttribute('cy', nearest.y);
        ownerRing.setAttribute('opacity','0.95');
        ownerRing.setAttribute('class', 'live-ring '+(nearest.you?'live-ring-you':'live-ring-pos'));
        // CAMADA 1 (5): destaca o JOGADOR específico que tem a posse (label + número)
        // CAMADA 4 (10): acumula heatmap de posse e destaca o "rei da posse"
        playerBase.forEach(pb=>{ if(pb.label) pb.label.classList.remove('live-has-ball'); if(pb.num) pb.num.classList.remove('live-has-ball'); });
        if (nearest.label) nearest.label.classList.add('live-has-ball');
        if (nearest.num) nearest.num.classList.add('live-has-ball');
        posseCount[nearest.idx] = (posseCount[nearest.idx]||0) + 1;
        // CAMADA 4 (10): "rei da posse" = jogador com mais posse acumulada (aura persistente)
        let kingIdx=-1, kingN=0;
        for (const k in posseCount){ if (posseCount[k]>kingN){ kingN=posseCount[k]; kingIdx=+k; } }
        playerBase.forEach(pb=>{ if(pb.label) pb.label.classList.remove('live-posse-king'); if(pb.num) pb.num.classList.remove('live-posse-king'); });
        if (kingIdx>=0 && playerBase[kingIdx]){
          if (playerBase[kingIdx].label) playerBase[kingIdx].label.classList.add('live-posse-king');
          if (playerBase[kingIdx].num) playerBase[kingIdx].num.classList.add('live-posse-king');
        }
      }
      // ---- FRENTE A (3): glow da zona do lance ----
      zoneG.innerHTML = '';
      const zc = (zone==='ataque')?'rgba(255,210,30,.16)':(zone==='meio')?'rgba(177,75,255,.16)':'rgba(70,160,255,.15)';
      const zoneBlob = document.createElementNS(SVGNS,'rect');
      zoneBlob.setAttribute('x','2');
      zoneBlob.setAttribute('y',(zone==='ataque'?'2':zone==='meio'?'98':'100'));
      zoneBlob.setAttribute('width', (W-4));
      zoneBlob.setAttribute('height', (zone==='meio'?'4':(H/2-4)));
      zoneBlob.setAttribute('fill', zc);
      zoneBlob.setAttribute('class','live-zoneblob');
      zoneG.appendChild(zoneBlob);
      // transição suave da bolinha (CSS #live-ball transition)
      ballEl.setAttribute('cx', tx); ballEl.setAttribute('cy', ty);
      statusEl.textContent = `⚽ Bola no ${zone==='ataque'?'ataque':zone==='meio'?'meio-campo':'campo defensivo'}…`;
      setTimeout(()=>{
        // esvazia a linha de passe e o glow depois de a bola chegar (o lance pausa no QTE)
        if (passG) passG.innerHTML = '';
        if (zoneG) zoneG.innerHTML = '';
        cb();
      }, 600);
    }

    // CAMADA 1 (3): sombra de jogada — rótulo do atributo usado pisca na zona do lance
    const ATTR_NAMES = { Finalização:'FINALIZAÇÃO', Passe:'PASSE', Visão:'VISÃO', Drible:'DRIBLE', Marcação:'MARCAÇÃO', Posicionamento:'POSICIONAMENTO', Interceptação:'INTERCEPTAÇÃO', Cabeceio:'CABECEIO', Cruzamento:'CRUZAMENTO', Velocidade:'VELOCIDADE', Reflexos:'REFLEXOS', Saída:'SAÍDA DE BOLA', Anticipação:'ANTECIPAÇÃO' };
    function showShadow(q, res){
      if (!shadowG) return;
      shadowG.innerHTML = '';
      const zy = (q.zone==='ataque')?40 : (q.zone==='meio')?120 : 178;
      const zx = (q.zone==='ataque') ? (pts[youIdx]?pts[youIdx].x:50) : 50;
      const win = res ? res.win : null;
      const mark = (win===true)?'✓ ' : (win===false)?'✗ ' : '';
      const cls = (win===true)?'live-shadow-win' : (win===false)?'live-shadow-lose' : 'live-shadow-txt';
      const txt = document.createElementNS(SVGNS,'text');
      txt.setAttribute('x', zx); txt.setAttribute('y', zy);
      txt.setAttribute('text-anchor','middle');
      txt.setAttribute('class', cls);
      txt.textContent = mark + ((ATTR_NAMES[q.attr]||q.attr||'JOGADA').toUpperCase());
      shadowG.appendChild(txt);
      setTimeout(()=>{ if(shadowG) shadowG.innerHTML=''; }, 1300);
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
        showShadow(q, res); // CAMADA 4 (11): sombra de jogada com resultado ✓/✗
        // avança relógio virtual
        clock += Math.round(90/totalLances);
        if (clockEl) clockEl.textContent = Math.min(90,clock)+"'";
        if (progressEl) progressEl.style.width = Math.min(100, Math.round(clock/90*100))+'%'; // CAMADA 4 (12): barra de progresso
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
      const mul = q.sweetMul || 1;
      // janela "doce" baseada na ação/estatística: quanto maior a attr, mais fácil (janela maior)
      const sweetW = (0.12 + (attrVal/100)*0.16) * mul;
      // local dourado aparece em posição aleatória na barra (não sempre no meio)
      const center = 0.2 + Math.random()*0.6;
      const lo = Math.max(0, center - sweetW/2), hi = Math.min(1, center + sweetW/2);
      let t = 0, dir = 1, raf=null, done=false;
      qteEl.innerHTML = `
        <div class="qte qte-timing">
          <div class="qte-label">${q.label}</div>
          <div class="qte-bar"><div class="qte-sweet" style="left:${lo*100}%;width:${(hi-lo)*100}%"></div><div class="qte-mark" id="qte-mark"></div></div>
          <button class="btn btn-red qte-go" id="qte-go">DISPARAR ⚡</button>
          <div class="qte-hint">Clique NA faixa dourada — acerte no momento certo!</div>
        </div>`;
      const mark = qteEl.querySelector('#qte-mark');
      // velocidade mais lenta para dar tempo de mirar
      function step(){ if(done) return; t += 0.018*dir; if(t>1){t=1;dir=-1;} if(t<0){t=0;dir=1;} mark.style.left=(t*100)+'%'; raf=requestAnimationFrame(step); }
      raf = requestAnimationFrame(step);
      qteEl.querySelector('#qte-go').onclick = ()=>{
        if (done) return; done=true; if(raf)cancelAnimationFrame(raf);
        const win = (t>=lo && t<=hi);
        cb({ win });
      };
      if (autoMode) resolveAuto();
    }

    function runChoice(q, cb){
      const attrVal = (S.attrs && q.attr) ? (S.attrs[q.attr]||50) : 50;
      const attrName = q.attr || 'qualidade';
      // opção correta: sorteada, MAS se o jogador é bom na ação (ou tem Metavisão) ele "sente" e a certa é revelada
      const reveal = q.metaReveal || (attrVal >= 72);
      const correct = Math.floor(Math.random()*q.choices.length);
      qteEl.innerHTML = `
        <div class="qte qte-choice">
          <div class="qte-label">${q.label}</div>
          <div class="qte-choices">${q.choices.map((c,i)=>`<button class="btn qte-opt" data-i="${i}">${c}${reveal&&i===correct?' ✨':''}</button>`).join('')}</div>
          ${reveal?'<div class="qte-hint">Seu instinto ('+attrName+') aponta a opção ✨</div>':'<div class="qte-hint">Escolha a melhor jogada — sua '+attrName+' conta</div>'}
        </div>`;
      qteEl.querySelectorAll('.qte-opt').forEach(b=>{
        b.onclick = ()=>{
          const i = parseInt(b.dataset.i);
          const win = (i===correct);
          // feedback claro: mostra qual era a certa
          qteEl.querySelectorAll('.qte-opt').forEach(x=>{ x.disabled=true; if(parseInt(x.dataset.i)===correct) x.classList.add('qte-correct'); if(x===b && !win) x.classList.add('qte-wrong'); });
          const fb = document.createElement('div');
          fb.className = 'qte-feedback ' + (win?'ok':'no');
          fb.textContent = win ? '✅ Acertou a jogada!' : '❌ Errou — era: ' + q.choices[correct];
          qteEl.appendChild(fb);
          setTimeout(()=>cb({ win }), 850);
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
          // fase 2: timing (janela por estatística, centro aleatório, mais lento)
          const attrVal = (S.attrs && q.attr) ? (S.attrs[q.attr]||50) : 50;
          const sweetW = (0.12 + (attrVal/100)*0.16);
          const center = 0.2 + Math.random()*0.6;
          const lo = Math.max(0, center - sweetW/2), hi = Math.min(1, center + sweetW/2);
          let t=0, dir=1, raf=null, done=false;
          qteEl.innerHTML = `
            <div class="qte qte-timing">
              <div class="qte-label">${q.label} — DISPARAR ⚡</div>
              <div class="qte-bar"><div class="qte-sweet" style="left:${lo*100}%;width:${(hi-lo)*100}%"></div><div class="qte-mark" id="qte-mark"></div></div>
              <button class="btn btn-red qte-go" id="qte-go">DISPARAR ⚡</button>
            </div>`;
          const mark = qteEl.querySelector('#qte-mark');
          function step(){ if(done) return; t += 0.018*dir; if(t>1){t=1;dir=-1;} if(t<0){t=0;dir=1;} mark.style.left=(t*100)+'%'; raf=requestAnimationFrame(step); }
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
