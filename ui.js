// ===== ui.js — ProPath Futebol (render das telas) =====
const UI = {};
UI.S = null;

UI.esc = s => String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

UI.attrRows = function(pos, attrs){
  return POSITIONS[pos].attrs.map(k=>`<div class="attr-row"><div class="lab"><span>${k}</span><b>${Math.round(attrs[k])}</b></div><div class="attr-bar"><div class="attr-fill" style="width:${attrs[k]}%"></div></div></div>`).join('');
};

UI.spark = function(pts, color){
  if (!pts || pts.length<2) return `<div class="spark" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px">Jogue para gerar sua curva</div>`;
  const ws = pts.map(p=>p.s), vs = pts.map(p=>p.o), rs = pts.map(p=>p.r);
  const min=Math.min(...vs, ...rs, 50), max=Math.max(...vs, ...rs, 99);
  const W=300,H=54; const x=i=>10+i*(W-20)/(ws.length-1);
  const y=v=>H-6-((v-min)/((max-min)||1))*(H-14);
  const line=arr=>arr.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <path d="${line(vs)}" fill="none" stroke="${color}" stroke-width="2"/>
    <path d="${line(rs)}" fill="none" stroke="var(--obsession)" stroke-width="1.5" stroke-dasharray="3 3" opacity=".8"/></svg>`;
};

UI.topbar = function(){
  const S=UI.S; if(!S) return '';
  return `<span class="ovr">${S.ovr}</span> OVR · <b>${S.name}</b> (${POSITIONS[S.pos].label}) · <b>${S.teamName}</b> · Temp ${S.season} · Sem ${S.week}`;
};

UI.render = function(){
  const S=UI.S; if(!S) return;
  document.getElementById('topbar-info').innerHTML = UI.topbar();
  const tabs=[['carreira','Carreira'],['ficha','Ficha'],['estatisticas','Estatísticas'],['temporada','Temporada'],['liga','Liga'],['ligas','Ligas'],['mercado','Mercado'],['conquistas','Conquistas'],['ranking','Ranking']];
  document.getElementById('tabs').innerHTML = tabs.map(t=>`<button class="tab ${UI.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('');
  const app=document.getElementById('app');
  const map={carreira:UI.carreira, ficha:UI.ficha, estatisticas:UI.estatisticas, temporada:UI.temporada, liga:UI.liga, ligas:UI.ligas, mercado:UI.mercado, conquistas:UI.conquistas, ranking:UI.ranking};
  const out = (map[UI.tab]||UI.carreira)();
  app.innerHTML = out;
  return out;
};

UI.carreira = function(){
  const S=UI.S;
  const next = S.calendar[S.calIdx];
  const nextTxt = next?(next.type==='match'?`Jogo vs ${next.opp.n}${next.cup?' (COPA)':''}`:`Treino — clique em "Avançar" para escolher o foco`):'Fim da temporada';
  const feed = S.career.slice(-6).map(c=>`<p class="muted">${UI.esc(c)}</p>`).join('');
  const foot = FOOT_LABEL[S.foot]||'Destro';
  const footNote = FOOT_INFO[S.foot] ? FOOT_INFO[S.foot].note : '';
  const skills = (S.skills||[]).map(k=>SKILLS.find(s=>s.k===k)).filter(Boolean).map(s=>s.n);
  return `<div class="panel"><h2><span class="ic">🔥</span> Modo Carreira — ${UI.esc(LEAGUE_BY_ID(S.leagueId).name)}</h2>
    <div class="row">
      <div class="col card"><div class="muted">Próximo evento (Semana ${S.week})</div><div style="font-size:18px;font-weight:800;margin:6px 0">${UI.esc(nextTxt)}</div>
        <div class="actions"><button class="big-btn" id="btn-advance">▶ Avançar Semana</button></div></div>
      <div class="col card"><div class="muted">Resumo do Jogador</div>
        <div class="mini-row"><span>OVR</span><b>${S.ovr}</b></div>
        <div class="mini-row"><span>Potencial</span><b>${S.pot}</b></div>
        <div class="mini-row"><span>Pé</span><b>${foot}</b></div>
        <div class="mini-row"><span>Idade</span><b>${S.age}</b></div>
        <div class="mini-row"><span>Clube</span><b>${UI.esc(S.teamName)}</b></div>
        ${skills.length?`<div class="mini-skills">${skills.map(s=>`<span class="pill">${s}</span>`).join('')}</div>`:''}
        <div class="muted" style="margin-top:6px;font-size:11px">${UI.esc(footNote)}</div>
        <div class="actions" style="margin-top:8px"><button class="btn" id="btn-clubhall">🏛️ Hall do Clube</button></div>
      </div>
    </div></div>
    <div class="panel"><h2><span class="ic">📈</span> Evolução na carreira (OVR ● / Nota ◌)</h2>
      ${UI.spark(S.sMeEvo, 'var(--accent)')}
      <div style="margin-top:10px">${feed}</div></div>`;
};

UI.estatisticas = function(){
  const S=UI.S;
  const card = (label, val, sub) => `<div class="stat-card"><div class="stat-val">${val}</div><div class="stat-lab">${label}</div>${sub?`<div class="stat-sub">${sub}</div>`:''}</div>`;
  const block = (c, title) => {
    const games=c.games||0, wins=c.wins||0, draws=c.draws||0, losses=c.losses||0;
    const goals=c.goals||0, assists=c.assists||0;
    const winPct = games? Math.round(wins/games*100):0;
    return `<div class="stat-block"><h3 class="stat-block-h">${title}</h3>
      <div class="stat-grid">
        ${card('Jogos', games)} ${card('Vitórias', wins, winPct+'%')} ${card('Gols', goals, (games? (goals/games).toFixed(2):'0.00')+' g/j')}
        ${card('Assistências', assists)} ${card('Empates', draws)} ${card('Derrotas', losses)}
        ${card('Clean Sheets', c.cleanSheets||0)} ${card('Homem do Jogo', c.mom||0)} ${card('Hat-tricks', c.hatTricks||0)}
        ${card('Gols Sofridos', c.goalsConceded||0)} ${card('Melhor Nota', (+((c.bestRating)||0)).toFixed(1))} ${card('Maior Vitória', (c.biggestWin||0)>0?c.biggestWin+' gols':'—')}
        ${card('Jogos de Copa', c.cupGames||0)} ${card('Temporadas', S.season||1)}
      </div>
      <div class="res-bar" style="margin-top:8px"><div class="res-w" style="width:${winPct}%"></div><div class="res-l" style="width:${100-winPct}%"></div></div>
      <div class="muted" style="margin-top:4px">${wins}V · ${draws}E · ${losses}D em ${games} jogos</div>
    </div>`;
  };
  const clubs = S.careerStats && S.careerStats.teamsPlayed ? Object.keys(S.careerStats.teamsPlayed) : [S.teamName];
  return `<div class="panel"><h2><span class="ic">📊</span> Estatísticas — ${UI.esc(S.name)}</h2>
    ${block(S.seasonStats, 'Temporada Atual (Temp '+S.season+')')}
    ${block(S.careerStats, 'Carreira Toda')}
    <div class="stat-block"><h3 class="stat-block-h">Clubes na Carreira</h3>
      <div class="club-list">${clubs.map(c=>`<span class="pill club">${UI.esc(c)}</span>`).join(' ')}</div>
    </div>
  </div>`;
};

UI.ficha = function(){
  const S=UI.S;
  const foot = FOOT_LABEL[S.foot]||'Destro';
  const arch = ARCHETYPES.find(a=>a.k===S.archetype);
  const skills = (S.skills||[]).map(k=>SKILLS.find(s=>s.k===k)).filter(Boolean);
  const clubs = S.careerStats && S.careerStats.teamsPlayed ? Object.keys(S.careerStats.teamsPlayed) : [S.teamName];
  return `<div class="panel"><h2><span class="ic">👤</span> Ficha de ${UI.esc(S.name)}</h2>
    <div class="row">
      <div class="col card"><div class="muted">Atributos (${POSITIONS[S.pos].label})</div>${UI.attrRows(S.pos,S.attrs)}
        <div class="attr-row"><div class="lab"><span><b>OVERALL</b></span><b>${S.ovr}</b></div><div class="attr-bar"><div class="attr-fill ov" style="width:${S.ovr}%"></div></div></div>
        <div class="attr-row"><div class="lab"><span>Potencial</span><b>${S.pot}</b></div><div class="attr-bar"><div class="attr-fill ov" style="width:${S.pot}%"></div></div></div></div>
      <div class="col card"><div class="muted">Dados</div>
        <div class="data-grid">
          <div><span>Nacionalidade</span><b>${UI.esc(S.nation)}</b></div>
          <div><span>Idade</span><b>${S.age}</b></div>
          <div><span>Posição</span><b>${POSITIONS[S.pos].label}</b></div>
          <div><span>Pé</span><b>${foot}</b></div>
          <div><span>Arquétipo</span><b>${arch?arch.n:'—'}</b></div>
          <div><span>Clube</span><b>${UI.esc(S.teamName)}</b> <i>(OVR ${S.teamOvr})</i></div>
          <div><span>Temporada</span><b>${S.season}</b></div>
          <div><span>Troféus</span><b>${S.trophies.length}</b></div>
        </div>
        ${skills.length?`<div class="muted" style="margin-top:8px">Skills</div><div class="mini-skills">${skills.map(s=>`<span class="pill">${s.n}</span>`).join('')}</div>`:''}
      </div>
    </div>
    <div class="panel" style="margin-top:12px"><h2><span class="ic">🏟️</span> Clubes na carreira</h2>
      <div class="club-list">${clubs.map(c=>`<span class="pill club">${UI.esc(c)}</span>`).join(' ')}</div>
    </div>
  </div>`;
};

UI.temporada = function(){
  const S=UI.S;
  const midIdx = Math.floor((S.calendar||[]).length/2); // janela na metade da temporada
  const midWeek = midIdx + 1; // semana 1-based
  const rows=[]; let mi=0;
  S.calendar.forEach((c,i)=>{
    // linha destacada da janela de transferências na posição do calendário
    if (i === midIdx){
      const state = (S.calIdx > midIdx) ? 'já ocorreu' : (S.calIdx === midIdx || S.pendingTransfer) ? 'ABERTA AGORA' : `Semana ${midWeek}`;
      rows.push(`<tr class="tf-window"><td>🔔</td><td class="rd">JAN</td><td style="text-align:left"><b>JANELA DE TRANSFERÊNCIAS</b> — ${state}</td><td></td></tr>`);
    }
    if (c.type!=='match') return;
    const done = i < S.calIdx;
    const isCur = i === S.calIdx;
    const m = S.seasonMatches[mi]; mi++;
    const t = (c.cup?'🏆 ':'')+`vs ${c.opp.n}`+(c.home?' (CASA)':' (FORA)');
    const sp = (m&&m.specials&&m.specials.length)?` · 🌟${m.specials.join(', ')}`:'';
    const r = m?`${m.gf}x${m.ga} (${m.res}) ⭐${m.rating}${m.goals?' G'+m.goals:''}${m.assists?' A'+m.assists:''}${sp}`:'';
    const round = c.cup ? 'COPA' : ('R'+(c.round||(done?'?':'')));
    rows.push(`<tr class="${isCur?'pos':''}"><td>${done?'✓':(isCur?'▶':'')}</td><td class="rd">${round}</td><td style="text-align:left">${UI.esc(t)}</td><td>${r}</td></tr>`);
  });
  let tfBanner;
  if (S.pendingTransfer) tfBanner = `<div class="tf-banner open">🔔 JANELA DE TRANSFERÊNCIAS ABERTA — decida seu futuro na aba Mercado/Carreira.</div>`;
  else if (S.calIdx > midIdx) tfBanner = `<div class="tf-banner done">A janela de transferências da temporada ${S.season} já ocorreu (metade da temporada).</div>`;
  else tfBanner = `<div class="tf-banner">🔔 Próxima janela de transferências: <b>Semana ${midWeek}</b> (metade da temporada ${S.season}).</div>`;
  return `<div class="panel"><h2><span class="ic">📅</span> Calendário de Jogos — Temporada ${S.season}</h2>
    ${tfBanner}
    <table class="tbl"><tr><th></th><th class="rd">Rod</th><th class="l">Jogo</th><th>Resultado</th></tr>${rows.join('')}</table>
    <div class="muted" style="margin-top:8px">CASA/FORA definem mando; COPA = mata-mata extra. A tabela da liga (aba Liga) reflete estes resultados + os rivais simulados.</div>
    <div class="actions"><button class="big-btn purple" id="btn-plan">⚙ Definir Plano de Treino</button></div></div>`;
};

UI.liga = function(){
  const S=UI.S;
  const td = LEAGUE_BY_ID(S.leagueId);
  const table = E.getLeagueTable(S);
  const played = S.table.w + S.table.d + S.table.l;
  const myRow = table.find(r=>r.me) || {p:0,w:0,d:0,l:0,gf:0,ga:0,sg:0,pts:0};
  const n = table.length;
  let body = '';
  table.forEach(function(r,i){
    let zone = '';
    if (i===0) zone=' zone-champ';
    else if (i >= n-2) zone=' zone-rel';
    const meTag = r.me ? ' ⬅️' : '';
    body += '<tr class="'+(r.me?'me':'')+zone+'"><td class="pos-n">'+(i+1)+'</td><td class="l">'+UI.esc(r.n)+meTag+'</td><td>'+r.p+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td>'+r.gf+'</td><td>'+r.ga+'</td><td>'+(r.sg>0?'+'+r.sg:r.sg)+'</td><td><b>'+r.pts+'</b></td></tr>';
  });
  const scorers = E.getTopScorers(S);
  let scoreBody = '';
  if (scorers.length){
    scorers.forEach(function(s,i){
      const youTag = s.you ? ' ⭐' : '';
      scoreBody += '<tr class="'+(s.you?'me':'')+'"><td>'+(i+1)+'</td><td class="l">'+UI.esc(s.name)+youTag+'</td><td>'+UI.esc(s.team)+'</td><td><b>'+s.goals+'</b></td></tr>';
    });
  } else {
    scoreBody = '<tr><td colspan="4" class="muted">Sem gols ainda.</td></tr>';
  }
  return '<div class="panel"><h2><span class="ic">🏟️</span> '+UI.esc(td.name)+' — Tabela Real (Rodada '+played+')</h2>'
    + '<table class="tbl"><tr><th>#</th><th class="l">Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th></tr>'+body+'</table>'
    + '<div class="muted" style="margin-top:6px">🟢 líder = campeão · 🔴 últimas 2 posições = rebaixamento</div>'
    + '<div class="muted" style="margin-top:10px">Você: <b>'+myRow.w+'V '+myRow.d+'E '+myRow.l+'D</b> · '+myRow.pts+' pts · '+myRow.gf+'x'+myRow.ga+' (SG '+(myRow.sg>0?'+'+myRow.sg:myRow.sg)+')</div>'
    + '<div class="panel" style="margin-top:14px"><h2><span class="ic">⚽</span> Artilharia</h2>'
    + '<table class="tbl"><tr><th>#</th><th class="l">Jogador</th><th>Clube</th><th>Gols</th></tr>'+scoreBody+'</table>'
    + '</div></div>';
};

UI.mercado = function(){
  const S=UI.S;
  if (!S.offers.length) return `<div class="panel"><h2><span class="ic">💱</span> Mercado de Transferências</h2>
    <p class="muted">Sem ofertas agora. Conquiste boas atuações e o fim da temporada trará propostas...</p></div>`;
  const list = S.offers.map((o,i)=>`<div class="offer"><div><div class="ot">${UI.esc(o.team)}<span class="pill">${LEAGUE_BY_ID(o.tier).short}</span></div><div class="od">OVR ${o.ovr} · R$ ${o.salary.toLocaleString('pt-BR')}/mês · ${o.cond}</div></div><button class="btn btn-purple" data-offer="${i}">Assinar (única)</button></div>`).join('');
  return `<div class="panel"><h2><span class="ic">💱</span> Mercado — ${S.offers.length} oferta(s)</h2>
    <p class="muted">Atenção: ao assinar 1 contrato, as outras ofertas somem.</p>${list}</div>`;
};

UI.conquistas = function(){
  const S=UI.S;
  const t = S.trophies.length?S.trophies.map(x=>`<span class="trophy">${UI.esc(x)}</span>`).join(' '):'<p class="muted">Nenhum troféu ainda. Seja campeão.</p>';
  const carr = S.career.slice(-12).map(c=>`<p class="muted">• ${UI.esc(c)}</p>`).join('');
  return `<div class="panel"><h2><span class="ic">🏆</span> Conquistas</h2><div>${t}</div></div>
    <div class="panel"><h2><span class="ic">📜</span> Histórico da carreira</h2>${carr}</div>`;
};


// Perfil de um clube: info básica + honours (dados reais) + estatísticas
UI.clubProfile = function(teamName, leagueId){
  const lg = LEAGUE_BY_ID(leagueId);
  const team = lg && lg.teams.find(t=>t.n===teamName);
  if (!team){ modal('<h3>'+UI.esc(teamName)+'</h3><p class="muted">Clube não encontrado.</p>'); return; }
  const h = team.honours || {};
  const hon = (h.ligas||h.copasNac||h.copasInt)
    ? '<div class="club-hon">'+
        (h.ligas? '<span class="hon">🏆 '+h.ligas+' títulos nacionais</span>':'')+
        (h.copasNac? '<span class="hon">🥇 '+h.copasNac+' copas nacionais</span>':'')+
        (h.copasInt? '<span class="hon">🌍 '+h.copasInt+' títulos internacionais</span>':'')+
      '</div>'
    : '<div class="muted">Sem títulos registrados (ou clube em ascensão).</div>';
  const stars = (team.stars||[]).length ? team.stars.map(s=>'<span class="pill">'+UI.esc(s)+'</span>').join(' ') : '<span class="muted">—</span>';
  modal('<div class="club-profile">'+
    '<h3>'+UI.esc(team.n)+'</h3>'+
    '<div class="club-meta">'+UI.esc(lg.name)+' · '+UI.esc(lg.country)+' · OVR média <b>'+team.o+'</b></div>'+
    '<div class="club-sec"><div class="club-sec-h">Estrelas</div><div class="club-stars">'+stars+'</div></div>'+
    '<div class="club-sec"><div class="club-sec-h">Títulos (históricos)</div>'+hon+'</div>'+
    '</div>');
};

// Hall do clube atual: troféus do JOGADOR no clube + estatísticas básicas
UI.clubHall = function(){
  const S = UI.S; const lg = LEAGUE_BY_ID(S.leagueId);
  const trophies = (S.trophies||[]).filter(t=>t.includes(lg.name));
  const clubGames = (S.seasonMatches||[]).length + (S.careerStats.games||0);
  const body = trophies.length
    ? trophies.map(t=>'<div class="trophy">'+UI.esc(t)+'</div>').join('')
    : '<div class="muted">Você ainda não conquistou títulos no '+UI.esc(S.teamName)+'. Mono a sua obsessão! 🔥</div>';
  modal('<div class="club-hall"><h3>🏛️ Hall do '+UI.esc(S.teamName)+'</h3>'+
    '<div class="club-sec-h">Troféus com este clube</div>'+body+
    '<div class="club-sec-h" style="margin-top:10px">Estatísticas básicas</div>'+
    '<div class="mini-row"><span>Jogos pelo clube</span><b>'+(S.careerStats.teamsPlayed && S.careerStats.teamsPlayed[S.teamName] || 0)+'</b></div>'+
    '<div class="mini-row"><span>Gols na carreira</span><b>'+(S.careerStats.goals||0)+'</b></div>'+
    '<div class="mini-row"><span>Assistências na carreira</span><b>'+(S.careerStats.assists||0)+'</b></div>'+
    '<div class="mini-row"><span>Temporadas</span><b>'+(S.season||1)+'</b></div>'+
    '<div class="mini-row"><span>OVR atual</span><b>'+S.ovr+'</b></div>'+
    '</div>');
};

UI.ligas = function(){
  const S=UI.S;
  let html = '';
  TIERS.forEach(function(td, ti){
    const isMe = td.id === S.leagueId;
    const teams = td.teams.map(function(t){
      const meTeam = t.n === S.teamName;
      return `<span class="pill ${meTeam?'club me':''}" data-club="${UI.esc(t.n)}" data-league="${td.id}" style="cursor:pointer" title="${t.c} · OVR ${t.o} — clique para ver o clube">${UI.esc(t.n)}<i style="opacity:.6;font-style:normal;margin-left:5px">${t.o}</i></span>`;
    }).join(' ');
    html += `<div class="panel" style="${isMe?'border-color:var(--accent)':''}">
      <h2><span class="ic">${isMe?'🟢':'🏳️'}</span> ${UI.esc(td.name)} <span class="pill" style="${isMe?'background:var(--accent);color:#0a0607':''}">${td.short}</span>${isMe?' <span class="muted" style="font-size:12px">— sua divisão</span>':''}</h2>
      <div class="muted" style="margin-bottom:8px">${UI.esc(td.desc)}</div>
      <div class="club-list">${teams}</div>
    </div>`;
  });
  // aviso de sincronização
  html += `<div class="muted" style="margin-top:8px">As partidas da sua liga (aba Liga) são simuladas em sincronia com os seus jogos: cada rodada que você disputa, os rivais da mesma rodada também jogam. Todos os clubes acima participam do campeonato da respectiva divisão.</div>`;
  return html;
};

// Hall da Fama é preenchido de forma assíncrona em UI.loadRankSaves() (no boot),
// para que a aba Ranking possa renderizar de forma síncrona e sem flicker.
UI.rankSaves = [];
UI.loadRankSaves = function(){
  fetch('/api/saves').then(r=>r.json()).then(async list=>{
    const out = [];
    for (const it of (list||[]).slice(0,12)){
      try {
        const sv = await fetch('/api/save/'+it.id).then(r=>r.json());
        if (!sv || !sv.name) continue;
        window.E.normalizeSave(sv);
        out.push({ name:sv.name, ovr:sv.ovr, trophies:sv.trophies.length, goals:sv.careerStats.goals, team:sv.teamName, season:sv.season });
      } catch(e){}
    }
    UI.rankSaves = out;
  }).catch(()=>{ UI.rankSaves = []; });
};

UI.ranking = function(){
  const S=UI.S;
  // ---- 1) HALL DA FAMA (jogadores salvos localmente) ----
  const hall = (UI.rankSaves||[]).slice().sort((a,b)=> b.trophies-a.trophies || b.ovr-a.ovr);
  const hallBody = hall.length
    ? hall.map((h,i)=>`<tr class="${h.name===S.name?'me':''}"><td>${i+1}</td><td class="l">${UI.esc(h.name)}</td><td>${UI.esc(h.team)}</td><td><b>${h.ovr}</b></td><td>🏆 ${h.trophies}</td><td>${h.goals} gols</td></tr>`).join('')
    : '<tr><td colspan="6" class="muted">Nenhum jogador salvo ainda. Crie e salve carreiras!</td></tr>';

  // ---- 2) SEUS RECORDES ----
  const rec = S.records || {};
  const cs = S.careerStats || {};
  const recRows = [
    ['Maior OVR alcançado', S.ovr],
    ['Títulos conquistados', S.trophies.length],
    ['Recorde de gols em uma temporada', rec.bestSeasonGoals||0],
    ['Maior invencibilidade (jogos)', rec.bestStreak||0],
    ['Mais gols num jogo', rec.mostGoalsGame||0],
    ['Mais assistências num jogo', rec.mostAssistsGame||0],
    ['Melhor nota em jogo', (rec.bestRating||cs.bestRating||0)],
    ['Gols na carreira', cs.goals||0],
    ['Jogos na carreira', cs.games||0],
    ['Temporadas jogadas', cs.seasons||S.season]
  ].map(r=>`<div class="mini-row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');

  // ---- 3) RANKING DE CLUBES (todos os times da pirâmide por OVR) ----
  let clubRows = [];
  TIERS.forEach(td=> td.teams.forEach(t=> clubRows.push({tier:td.name, n:t.n, o:t.o})));
  clubRows.sort((a,b)=> b.o-a.o);
  clubRows = clubRows.slice(0,40);
  const clubBody = clubRows.map((c,i)=>`<tr class="${c.n===S.teamName?'me':''}"><td>${i+1}</td><td class="l">${UI.esc(c.n)}</td><td class="muted">${UI.esc(c.tier)}</td><td><b>${c.o}</b></td></tr>`).join('');

  return `<div class="panel"><h2><span class="ic">🏆</span> Hall da Fama (local)</h2>
    <table class="tbl"><tr><th>#</th><th class="l">Jogador</th><th>Clube</th><th>OVR</th><th>Títulos</th><th>Carreira</th></tr>${hallBody}</table>
    <div class="muted" style="margin-top:6px">Ranqueia os jogadores salvos neste navegador (offline).</div></div>

  <div class="panel"><h2><span class="ic">⭐</span> Seus Recordes</h2><div class="data-grid">${recRows}</div></div>

  <div class="panel"><h2><span class="ic">🏟️</span> Ranking de Clubes (OVR)</h2>
    <table class="tbl"><tr><th>#</th><th class="l">Clube</th><th>Divisão</th><th>OVR</th></tr>${clubBody}</table></div>

  <div class="panel"><h2><span class="ic">🎯</span> Desafio do Escalador</h2>
    <div class="muted">Simula 8 carreiras-rivais do zero e ranqueia você contra elas (por OVR e títulos).</div>
    <div class="actions"><button class="big-btn purple" id="btn-escalador">⚡ Simular rivais e ranquear</button></div>
    <div id="escalador-out"></div></div>`;
};

// Desafio do Escalador: simula N rivais e ranqueia o jogador atual
UI.runEscalador = function(){
  const S=UI.S; const N=8;
  const rivais = [];
  for (let i=0;i<N;i++){
    const pos = ['ATA','MEI','VOL','ZAG','GOL','LAT'][Math.floor(Math.random()*6)];
    const R = window.E.createPlayer({name:'Rival '+(i+1), nation:'Brasil', pos, age:19});
    let g=0; while (R.season<=3 && g<4000) window.E.advanceWeek(R), g++;
    rivais.push({ name:R.name, ovr:R.ovr, trophies:R.trophies.length });
  }
  const todos = [{name:S.name, ovr:S.ovr, trophies:S.trophies.length, you:true}].concat(rivais);
  todos.sort((a,b)=> (b.trophies-a.trophies) || (b.ovr-a.ovr));
  const pos = todos.findIndex(x=>x.you)+1;
  const out = todos.map((t,i)=>`<div class="mini-row ${t.you?'me':''}"><span>${i+1}º ${t.you?'⭐':'·'} ${UI.esc(t.name)}</span><b>OVR ${t.ovr} · 🏆 ${t.trophies}</b></div>`).join('');
  const el = document.getElementById('escalador-out');
  if (el) el.innerHTML = `<div style="margin-top:10px">Você ficou em <b>${pos}º</b> de ${N+1}.</div><div class="data-grid" style="margin-top:8px">${out}</div>`;
};

UI.onboardHTML = function(){
  return `<div class="ob-card"><h1>Crie sua <span>LENDA</span></h1>
    <div class="ob-sub">ProPath Futebol — do barro da várzea ao Panteão Mundial. Tema Pânico × Obsessão.</div>
    <div class="ob-step" id="ob-step">Passo 1 / 5 — Identidade</div>
    <div id="ob-body"></div>
    <div class="ob-nav"><button class="btn btn-ghost" id="ob-back" disabled>← Voltar</button><button class="btn btn-red" id="ob-next">Próximo →</button></div>
  </div>`;
};

window.UI = UI;
