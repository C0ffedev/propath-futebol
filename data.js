// ===== data.js — ProPath Futebol =====
// LIGAS DO MUNDO (modelo "Opção A"): cada entrada de TIERS é uma LIGA real.
// O jogador escolhe um país/liga de início e sobe DENTRO do seu país.
// Liga vizinha (tier acima/abaixo do mesmo país) = promoção/rebaixamento.
// Ofertas de outros países = transferência internacional (joinTeam regera o calendário).
// Teams: n=nome, o=overall(elencо), c=país, stars=destaque (2). honours só nos grandes.
const NATIONS = ['Brasil','Argentina','Uruguai','Colômbia','Chile','Paraguai','Peru','Portugal','Espanha','França','Inglaterra','Itália','Alemanha','Holanda','México','Japão'];
const TIERS = [
  // ---------- BRASIL ----------
  { id:'bra-varzea', country:'Brasil', code:'BR', continent:'SAM', tier:0, name:'Várzea Amadora', short:'VÁRZEA', cup:null,
    desc:'Peladas de bairro. Gramado de terra, juiz de inconsúcia. Onde tudo começa.',
    teams:[
      {n:'EC Pânico', o:58, c:'BR', stars:['Pânico','Caos']}, {n:'Club da Sombra', o:57, c:'BR', stars:['Sombrio','Névoa']},
      {n:'Operário do Brejo', o:56, c:'BR', stars:['Tião do Brejo','Louro']}, {n:'Atlético Caverna', o:59, c:'BR', stars:['Morcego','Toinho']},
      {n:'Riacho FC', o:55, c:'BR', stars:['Tatu do Brejo','Sombra']}, {n:'Vila Oculta', o:58, c:'BR', stars:['Zé do Escuro','Caolho']},
      {n:'Juventude do Vale', o:54, c:'BR', stars:['Valentinho','Pé de Chumbo']}, {n:'União Soturna', o:57, c:'BR', stars:['Meia-Noite','Bruxo']}
    ] },
  { id:'bra-sb', country:'Brasil', code:'BR', continent:'SAM', tier:1, name:'Brasileirão Série B', short:'SÉRIE B', cup:'bra-copa',
    desc:'O caldeirão da Série B. Um ponto separa o sonho do pesadelo. Subir é tudo.',
    teams:[
      {n:'CRB', o:70, c:'BR', stars:['Wesley Phelps','Anselmo'], honours:{}},
      {n:'Coritiba', o:74, c:'BR', stars:['Robson','Marcelinho'], honours:{ligas:1, copasNac:2}},
      {n:'Goiás', o:73, c:'BR', stars:['Dadá','Saimon'], honours:{ligas:1, copasNac:1}},
      {n:'Sport Recife', o:75, c:'BR', stars:['Lucas Lima','Gonzalez'], honours:{ligas:1, copasNac:3}},
      {n:'Mirassol', o:71, c:'BR', stars:['Cavi','Gabriel'], honours:{}},
      {n:'Vila Nova', o:72, c:'BR', stars:['Clayton','Willian'], honours:{}},
      {n:'Novorizontino', o:72, c:'BR', stars:['Aylon','Léo'], honours:{}},
      {n:'Guarani', o:70, c:'BR', stars:['Bruno Mendes','Matheus'], honours:{ligas:1}},
      {n:'Ponte Preta', o:71, c:'BR', stars:['Jeorge','Paulo'], honours:{copasNac:1}},
      {n:'Ituano', o:69, c:'BR', stars:['Thonny','Eduardo'], honours:{copasNac:1}},
      {n:'Amazonas', o:69, c:'BR', stars:['Cauan','Rafael'], honours:{}},
      {n:'Avaí', o:71, c:'BR', stars:['Waguininho','Jonathan'], honours:{copasNac:1}},
      {n:'Operário-PR', o:70, c:'BR', stars:['Rafael',"Fernandão"], honours:{}},
      {n:'Paysandu', o:70, c:'BR', stars:['Mário','Martiny'], honours:{copasNac:2}},
      {n:'Botafogo-SP', o:68, c:'BR', stars:['Dudu','Wallace'], honours:{}},
      {n:'Chapecoense', o:70, c:'BR', stars:['Laércio','Mário'], honours:{ligas:1, copasInt:1}},
      {n:'Ceará', o:73, c:'BR', stars:['Luvannor','Saulo'], honours:{copasNac:1}},
      {n:'Brusque', o:67, c:'BR', stars:['Rodolfo','Paulo'], honours:{}},
      {n:'Santos', o:76, c:'BR', stars:['Neymar','Guilherme'], honours:{ligas:8, copasInt:1}},
      {n:'Athletico-PR', o:79, c:'BR', stars:['Pablo','Vitinho'], honours:{ligas:1, copasInt:2}}
    ] },
  { id:'bra-sa', country:'Brasil', code:'BR', continent:'SAM', tier:2, name:'Brasileirão Série A', short:'SÉRIE A', cup:'bra-copa',
    desc:'A elite nacional. Estrelas, televisão e a obrigação de ser campeão.',
    teams:[
      {n:'Palmeiras', o:82, c:'BR', stars:['Estêvão','Paulinho'], honours:{ligas:12, copasInt:3, copasNac:1}},
      {n:'Flamengo', o:83, c:'BR', stars:['Pedro','Gerson'], honours:{ligas:7, copasInt:3, copasNac:5}},
      {n:'Botafogo', o:81, c:'BR', stars:['Tiquinho','Savarino'], honours:{ligas:3, copasInt:1}},
      {n:'Atlético-MG', o:80, c:'BR', stars:['Hulk','Paulinho'], honours:{ligas:3, copasInt:1, copasNac:2}},
      {n:'São Paulo', o:78, c:'BR', stars:['Calleri','Luciano'], honours:{ligas:6, copasInt:3}},
      {n:'Fluminense', o:78, c:'BR', stars:['Cano','Arias'], honours:{ligas:1, copasInt:1}},
      {n:'Grêmio', o:77, c:'BR', stars:['Suárez','Galoppo'], honours:{ligas:2, copasInt:1}},
      {n:'Internacional', o:77, c:'BR', stars:['Wanderson','Valência'], honours:{ligas:3, copasInt:2}},
      {n:'Athletico-PR', o:79, c:'BR', stars:['Pablo','Vitinho'], honours:{ligas:1, copasInt:2}},
      {n:'Corinthians', o:79, c:'BR', stars:['Yuri Alberto','Memphis'], honours:{ligas:7, copasInt:1, copasNac:3}},
      {n:'Bahia', o:74, c:'BR', stars:['Everaldo','Rildo'], honours:{ligas:1, copasNac:3}},
      {n:'Bragantino', o:76, c:'BR', stars:['Sasha','Helinho'], honours:{}},
      {n:'Cruzeiro', o:76, c:'BR', stars:['Jairo','Dinenno'], honours:{ligas:4, copasNac:6}},
      {n:'Vasco', o:75, c:'BR', stars:['Vegetti','Payet'], honours:{ligas:4, copasNac:1}},
      {n:'Santos', o:74, c:'BR', stars:['Neymar','Guilherme'], honours:{ligas:8, copasInt:1}},
      {n:'Fortaleza', o:75, c:'BR', stars:['Lucero','Moisés'], honours:{}},
      {n:'Criciúma', o:68, c:'BR', stars:['Éder','Marcelinho'], honours:{copasNac:1}},
      {n:'Vitória', o:73, c:'BR', stars:['Léo','Osvaldo'], honours:{ligas:1, copasNac:1}},
      {n:'Juventude', o:72, c:'BR', stars:['Erick','Rodrigo'], honours:{}}
    ] },
  // ---------- INGLATERRA ----------
  { id:'eng-pl', country:'Inglaterra', code:'ENG', continent:'UEFA', tier:1, name:'Premier League', short:'PREMIER', cup:'eng-facup',
    desc:'A liga mais rica do mundo. Ritmo alucinante, inglês tradicional.',
    teams:[
      {n:'Manchester City', o:88, c:'ENG', stars:['Haaland','Foden'], honours:{ligas:9, copasInt:1, copasNac:7}},
      {n:'Liverpool', o:88, c:'ENG', stars:['Salah','Van Dijk'], honours:{ligas:19, copasInt:6, copasNac:8}},
      {n:'Arsenal', o:87, c:'ENG', stars:['Saka','Ødegaard'], honours:{ligas:13, copasInt:0, copasNac:14}},
      {n:'Chelsea', o:84, c:'ENG', stars:['Palmer','Jackson'], honours:{ligas:6, copasInt:2, copasNac:8}},
      {n:'Manchester Utd', o:81, c:'ENG', stars:['Bruno','Højlund'], honours:{ligas:20, copasInt:3, copasNac:12}},
      {n:'Newcastle', o:82, c:'ENG', stars:['Isak','Gordon'], honours:{ligas:4, copasInt:0, copasNac:6}},
      {n:'Aston Villa', o:82, c:'ENG', stars:['Watkins','Rodgers'], honours:{ligas:7, copasInt:1, copasNac:7}},
      {n:'Tottenham', o:81, c:'ENG', stars:['Son','Maddison'], honours:{ligas:2, copasInt:0, copasNac:8}},
      {n:'Brighton', o:79, c:'ENG', stars:['Mitoma','Pedro'], honours:{}},
      {n:'West Ham', o:78, c:'ENG', stars:['Bowen','Kudus'], honours:{ligas:3, copasInt:1, copasNac:3}},
      {n:'Brentford', o:78, c:'ENG', stars:['Mbeumo','Wissa'], honours:{}},
      {n:'Fulham', o:77, c:'ENG', stars:['Jiménez','Palhinha'], honours:{copasNac:0}},
      {n:'Bournemouth', o:77, c:'ENG', stars:['Solanke','Tavernier'], honours:{}},
      {n:'Crystal Palace', o:77, c:'ENG', stars:['Eze','Olise'], honours:{copasNac:0}},
      {n:'Wolves', o:77, c:'ENG', stars:['Cunha','Neto'], honours:{ligas:3, copasNac:4}},
      {n:'Everton', o:76, c:'ENG', stars:['Calvert-Lewin','Onana'], honours:{ligas:9, copasNac:5}},
      {n:'Nottingham Forest', o:78, c:'ENG', stars:['Gibbs-White','Wood'], honours:{ligas:1, copasInt:1, copasNac:2}},
      {n:'Leicester City', o:76, c:'ENG', stars:['Vardy','Ndidi'], honours:{ligas:1, copasNac:1}},
      {n:'Southampton', o:75, c:'ENG', stars:['Armstrong','Sulemana'], honours:{ligas:1, copasNac:1}},
      {n:'Ipswich Town', o:74, c:'ENG', stars:['Delap','Burns'], honours:{ligas:1, copasNac:0}}
    ] },
  // ---------- ESPANHA ----------
  { id:'esp-laliga', country:'Espanha', code:'ESP', continent:'UEFA', tier:1, name:'La Liga', short:'LA LIGA', cup:'esp-copa',
    desc:'El Clásico, técnica e pressão. O futebol mais estilizado do planeta.',
    teams:[
      {n:'Real Madrid', o:90, c:'ESP', stars:['Vinícius Jr.','Bellingham'], honours:{ligas:36, copasInt:15, copasNac:20}},
      {n:'Barcelona', o:88, c:'ESP', stars:['Lewandowski','Gavi'], honours:{ligas:27, copasInt:5, copasNac:31}},
      {n:'Atlético Madrid', o:85, c:'ESP', stars:['Griezmann','Morata'], honours:{ligas:11, copasInt:3, copasNac:10}},
      {n:'Girona', o:80, c:'ESP', stars:['Dovbyk','Pérez'], honours:{}},
      {n:'Athletic Bilbao', o:81, c:'ESP', stars:['Williams','Sancet'], honours:{ligas:8, copasNac:25}},
      {n:'Real Sociedad', o:81, c:'ESP', stars:['Oyarzabal','Zubimendi'], honours:{ligas:2, copasNac:3}},
      {n:'Villarreal', o:80, c:'ESP', stars:['Moreno','Pino'], honours:{copasInt:1, copasNac:0}},
      {n:'Real Betis', o:79, c:'ESP', stars:['Isco','Ávila'], honours:{ligas:1, copasInt:1, copasNac:3}},
      {n:'Valencia', o:78, c:'ESP', stars:['Pérez','Mamardashvili'], honours:{ligas:6, copasInt:1, copasNac:8}},
      {n:'Sevilla', o:79, c:'ESP', stars:['En-Nesyri','Ocampos'], honours:{ligas:1, copasInt:7, copasNac:5}},
      {n:'Getafe', o:77, c:'ESP', stars:['Mayoral','Greenwood'], honours:{}},
      {n:'Celta Vigo', o:77, c:'ESP', stars:['Aspas','Swedberg'], honours:{copasNac:1}},
      {n:'Osasuna', o:77, c:'ESP', stars:['Budimir','Garcés'], honours:{copasNac:1}},
      {n:'Mallorca', o:76, c:'ESP', stars:['Muriqi','Larín'], honours:{copasNac:1}},
      {n:'Rayo Vallecano', o:75, c:'ESP', stars:['De Tomás','Palazón'], honours:{copasNac:1}},
      {n:'Las Palmas', o:75, c:'ESP', stars:['Sandro','Muni'], honours:{ligas:1}},
      {n:'Leganés', o:74, c:'ESP', stars:['Cruz','Raba'], honours:{}},
      {n:'Alavés', o:75, c:'ESP', stars:['Guridi','Kike'], honours:{copasNac:1}},
      {n:'Valladolid', o:74, c:'ESP', stars:['Jurić','Plano'], honours:{ligas:1}},
      {n:'Espanyol', o:75, c:'ESP', stars:['Puado','Carreras'], honours:{ligas:0, copasNac:4}}
    ] },
  // ---------- ITÁLIA ----------
  { id:'ita-seriea', country:'Itália', code:'ITA', continent:'UEFA', tier:1, name:'Serie A', short:'SERIE A', cup:'ita-coppa',
    desc:'A defesa de ferro, a tática. O catenaccio evoluiu para o belo jogo.',
    teams:[
      {n:'Inter de Milão', o:86, c:'ITA', stars:['Lautaro','Thuram'], honours:{ligas:20, copasInt:3, copasNac:9}},
      {n:'Juventus', o:84, c:'ITA', stars:['Vlahovic','Chiesa'], honours:{ligas:36, copasInt:2, copasNac:15}},
      {n:'Milan', o:84, c:'ITA', stars:['Leão','Pulisic'], honours:{ligas:19, copasInt:7, copasNac:5}},
      {n:'Atalanta', o:83, c:'ITA', stars:['Scamacca','Lookman'], honours:{ligas:0, copasInt:1, copasNac:1}},
      {n:'Napoli', o:83, c:'ITA', stars:['Osimhen','Kvaratskhelia'], honours:{ligas:3, copasNac:6}},
      {n:'Roma', o:82, c:'ITA', stars:['Dybala','Llorente'], honours:{ligas:3, copasInt:1, copasNac:9}},
      {n:'Lazio', o:81, c:'ITA', stars:['Immobile','Zaccagni'], honours:{ligas:2, copasInt:1, copasNac:7}},
      {n:'Fiorentina', o:81, c:'ITA', stars:['Beltrán','González'], honours:{ligas:2, copasNac:6}},
      {n:'Bologna', o:81, c:'ITA', stars:['Zirkzee','Ferguson'], honours:{ligas:7, copasNac:2}},
      {n:'Torino', o:78, c:'ITA', stars:['Zapata','Ricci'], honours:{ligas:7, copasNac:5}},
      {n:'Genoa', o:77, c:'ITA', stars:['Retegui','Gudmundsson'], honours:{ligas:1, copasNac:1}},
      {n:'Udinese', o:77, c:'ITA', stars:['Lucca','Payero'], honours:{}},
      {n:'Parma', o:76, c:'ITA', stars:['Çelik','Cjon'], honours:{ligas:3, copasNac:3}},
      {n:'Monza', o:76, c:'ITA', stars:['Pessina','Mota'], honours:{}},
      {n:'Cagliari', o:75, c:'ITA', stars:['Lapadula','Zortea'], honours:{ligas:1}},
      {n:'Lecce', o:75, c:'ITA', stars:['Krstovic','Rafael'], honours:{}},
      {n:'Como', o:77, c:'ITA', stars:['Cutrone','Nico Paz'], honours:{ligas:2}},
      {n:'Empoli', o:75, c:'ITA', stars:['Pellegri','Fazzini'], honours:{}},
      {n:'Verona', o:76, c:'ITA', stars:['Djuric','Suslov'], honours:{ligas:1}},
      {n:'Venezia', o:74, c:'ITA', stars:['Pohjanpalo','Candela'], honours:{ligas:1}}
    ] },
  // ---------- ALEMANHA ----------
  { id:'ger-bundes', country:'Alemanha', code:'GER', continent:'UEFA', tier:1, name:'Bundesliga', short:'BUNDESLIGA', cup:'ger-dfb',
    desc:'A máquina alemã. Posse, transição e estádios lotados.',
    teams:[
      {n:'Bayern München', o:89, c:'GER', stars:['Kane','Musiala'], honours:{ligas:33, copasInt:6, copasNac:20}},
      {n:'Bayer Leverkusen', o:86, c:'GER', stars:['Wirtz','Boniface'], honours:{ligas:1, copasNac:1}},
      {n:'RB Leipzig', o:84, c:'GER', stars:['Xavi Simons','Openda'], honours:{ligas:0, copasNac:2}},
      {n:'Borussia Dortmund', o:84, c:'GER', stars:['Adeyemi','Brandt'], honours:{ligas:5, copasInt:1, copasNac:5}},
      {n:'VfB Stuttgart', o:83, c:'GER', stars:['Undav','Guirassy'], honours:{ligas:3, copasNac:3}},
      {n:'Eintracht Frankfurt', o:81, c:'GER', stars:['Marmoush','Ekitike'], honours:{ligas:1, copasInt:1, copasNac:5}},
      {n:'Borussia M\'gladbach', o:80, c:'GER', stars:['Plea','Hofmann'], honours:{ligas:5, copasNac:3}},
      {n:'SC Freiburg', o:80, c:'GER', stars:['Grifo','Dōan'], honours:{copasNac:1}},
      {n:'TSG Hoffenheim', o:79, c:'GER', stars:['Beier','Kramaric'], honours:{}},
      {n:'1. FSV Mainz 05', o:79, c:'GER', stars:['Burkardt','Lee'], honours:{}},
      {n:'Union Berlin', o:79, c:'GER', stars:['Becker','Volland'], honours:{}},
      {n:'VfL Wolfsburg', o:80, c:'GER', stars:['Wind','Maehle'], honours:{ligas:1, copasNac:1}},
      {n:'FC Augsburg', o:77, c:'GER', stars:['Tietz','Demirovic'], honours:{}},
      {n:'VfL Bochum', o:75, c:'GER', stars:['Hofmann','Asano'], honours:{}},
      {n:'1. FC Heidenheim', o:76, c:'GER', stars:['Kleindienst','Beste'], honours:{}},
      {n:'Holstein Kiel', o:74, c:'GER', stars:['Machino','Pichler'], honours:{}},
      {n:'FC St. Pauli', o:75, c:'GER', stars:['Eggestein','Saad'], honours:{}},
      {n:'Werder Bremen', o:78, c:'GER', stars:['Ducksch','Schmid'], honours:{ligas:4, copasNac:6}}
    ] },
  // ---------- FRANÇA ----------
  { id:'fra-ligue1', country:'França', code:'FRA', continent:'UEFA', tier:1, name:'Ligue 1', short:'LIGUE 1', cup:'fra-coupe',
    desc:'A escola francesa: talento cru, contragolpe letal.',
    teams:[
      {n:'Paris Saint-Germain', o:89, c:'FRA', stars:['Mbappé','Dembélé'], honours:{ligas:12, copasInt:0, copasNac:15}},
      {n:'AS Monaco', o:82, c:'FRA', stars:['Embolo','Golovin'], honours:{ligas:8, copasNac:5}},
      {n:'LOSC Lille', o:80, c:'FRA', stars:['David','Zhegrova'], honours:{ligas:4, copasNac:6}},
      {n:'Olympique Lyon', o:79, c:'FRA', stars:['Lacazette','Cherki'], honours:{ligas:7, copasInt:1, copasNac:5}},
      {n:'Marseille', o:80, c:'FRA', stars:['Aubameyang','Harit'], honours:{ligas:9, copasInt:1, copasNac:10}},
      {n:'Stade Rennais', o:79, c:'FRA', stars:['Kalimuendo','Bourigeaud'], honours:{copasNac:3}},
      {n:'Nice', o:79, c:'FRA', stars:['Guessand','Clauss'], honours:{ligas:4, copasNac:3}},
      {n:'Stade Reims', o:78, c:'FRA', stars:['Itō','Nakamura'], honours:{ligas:6, copasNac:2}},
      {n:'Strasbourg', o:77, c:'FRA', stars:['Emegha','Diarra'], honours:{copasNac:3}},
      {n:'FC Nantes', o:77, c:'FRA', stars:['Muani','Abline'], honours:{ligas:8, copasNac:4}},
      {n:'Stade Brestois', o:78, c:'FRA', stars:['Del Castillo','Camara'], honours:{}},
      {n:'Toulouse', o:76, c:'FRA', stars:['Magri','Cásseres'], honours:{copasNac:1}},
      {n:'AJ Auxerre', o:75, c:'FRA', stars:['Onaiwu','Perrin'], honours:{ligas:1}},
      {n:'Angers SCO', o:74, c:'FRA', stars:['Abdelli','Lepaul'], honours:{}},
      {n:'Saint-Étienne', o:75, c:'FRA', stars:['Cardona','Sissoko'], honours:{ligas:10, copasNac:6}},
      {n:'Le Havre', o:74, c:'FRA', stars:['Alioui','Sabbi'], honours:{}},
      {n:'RC Lens', o:80, c:'FRA', stars:['Sotoca','Thomasson'], honours:{ligas:1, copasNac:5}},
      {n:'Montpellier', o:75, c:'FRA', stars:['Adams','Savanier'], honours:{ligas:1, copasNac:2}}
    ] }
];

// Copas (mata-mata extra). scope = países/continentes participantes.
const CUPS = [
  { id:'bra-copa', name:'Copa do Brasil', short:'COPA BR', scope:['BR'], type:'national' },
  { id:'eng-facup', name:'FA Cup', short:'FA CUP', scope:['ENG'], type:'national' },
  { id:'esp-copa', name:'Copa del Rey', short:'COPA REY', scope:['ESP'], type:'national' },
  { id:'ita-coppa', name:'Coppa Italia', short:'COPPA', scope:['ITA'], type:'national' },
  { id:'ger-dfb', name:'DFB-Pokal', short:'DFB', scope:['GER'], type:'national' },
  { id:'fra-coupe', name:'Coupe de France', short:'COUPE', scope:['FRA'], type:'national' },
  { id:'uefa-cl', name:'UEFA Champions League', short:'UCL', scope:['UEFA'], type:'continental',
    desc:'Os gigantes da Europa. O topo do futebol de clubes.' },
  { id:'uefa-el', name:'UEFA Europa League', short:'UEL', scope:['UEFA'], type:'continental' },
  { id:'sam-lib', name:'Copa Libertadores', short:'LIBERTADORES', scope:['SAM'], type:'continental',
    desc:'O continente inteiro. Gigantes da América do Sul famintos por glória.' },
  { id:'world-club', name:'Mundial de Clubes', short:'MUNDIAL', scope:['ALL'], type:'world',
    desc:'O Panteão. Campeões de cada continente brigando pelo mundo.' }
];

// ---------- helpers de liga/copa ----------
// índice de liga por id
function LEAGUE_BY_ID(id){ return TIERS.find(t=>t.id===id); }
// ligas do mesmo país ordenadas por tier
function LEAGUES_OF_COUNTRY(code){ return TIERS.filter(t=>t.code===code).sort((a,b)=>a.tier-b.tier); }
// liga vizinha (promoção: tier+1; rebaixamento: tier-1) do mesmo país
function ADJ_LEAGUE(league, dir){ // dir=+1 sobe, -1 desce
  const same = LEAGUES_OF_COUNTRY(league.code);
  const cur = same.findIndex(t=>t.id===league.id);
  const idx = cur + dir;
  return (idx>=0 && idx<same.length) ? same[idx] : null;
}
// times da copa para um save S (nacional se tiver; senão continental do continente; senão mundial)
function CUP_TEAMS(S){
  const lg = LEAGUE_BY_ID(S.leagueId);
  if (!lg) return [];
  const myTeams = (S.leagueTeams && S.leagueTeams.length) ? S.leagueTeams : null;
  const cup = CUPS.find(c=>c.id===lg.cup);
  if (cup && cup.type==='national'){
    // todos os times das ligas do país (simula a copa nacional); usa elenco evoluído do seu país se aplicável
    return TIERS.filter(t=>t.code===lg.code).flatMap(t=> (t.id===S.leagueId && myTeams ? myTeams : t.teams)).filter(t=>t.n!==S.teamName);
  }
  if (cup && cup.scope && cup.scope[0]==='UEFA'){
    return TIERS.filter(t=>t.continent==='UEFA').flatMap(t=> (t.id===S.leagueId && myTeams ? myTeams : t.teams)).filter(t=>t.n!==S.teamName).slice(0,32);
  }
  return [];
}

// Posições + atributos (estilo FIFA, 10 por posição)
const POSITIONS = {
  GOL:{label:'Goleiro', attrs:['Reflexos','Saída','Posicionamento','Chute','Velocidade','Força','Anticipação','Salto','Braços Longos','Jogo com os Pés']},
  ZAG:{label:'Zagueiro', attrs:['Marcação','Cabeceio','Velocidade','Força','Passe','Posicionamento','Ritmo','Interceptação','Desarme','Físico']},
  LAT:{label:'Lateral', attrs:['Velocidade','Cruzamento','Marcação','Resistência','Passe','Força','Ritmo','Drible','Interceptação','Físico']},
  VOL:{label:'Volante', attrs:['Marcação','Passe','Resistência','Força','Posicionamento','Velocidade','Ritmo','Drible','Interceptação','Físico']},
  MEI:{label:'Meia', attrs:['Passe','Visão','Drible','Finalização','Resistência','Velocidade','Ritmo','Cruzamento','Físico','Posicionamento']},
  ATA:{label:'Atacante', attrs:['Finalização','Drible','Velocidade','Cabeceio','Posicionamento','Força','Ritmo','Passe','Físico','Chute de Longa']}
};

// Perfil de pé (chances reais de jogadores comuns: 90% destro, 9% canhoto, 1% ambidestro)
const FOOT_CHANCE = {dir:0.90, esq:0.09, amb:0.01};
const FOOT_LABEL = {dir:'Destro', esq:'Canhoto', amb:'Ambidestro'};
const FOOT_INFO = {
  dir:{boost:0, note:'Comum. Sem bônus, sem pena.'},
  esq:{boost:0, note:'Canhoto: surpresa e posicionamento superiores (leitura de jogo favorecida).'},
  amb:{boost:3, note:'Ambidestro: o mais completo. +3 em todos os atributos desde o início.'}
};

// Skills (perks estilo FIFA) — afetam atributos e aumentam a chance de JOGADAS ESPECIAIS
const SKILLS = [
  {k:'finalizador', n:'Finalizador de Elite', d:'+Finalização e mais gols comuns', cat:{}, attr:{Finalização:5}},
  {k:'armador', n:'Armador Visionário', d:'+Visão/Passe e mais assistências', cat:{}, attr:{Visão:5,Passe:4}},
  {k:'velocista', n:'Velocista', d:'+Ritmo/Velocidade', cat:{}, attr:{Ritmo:5,Velocidade:4}},
  {k:'muralha', n:'Muralha', d:'+Marcação/Interceptação (defesa)', cat:{}, attr:{Marcação:5,Interceptação:4}},
  {k:'cabeceador', n:'Cabeceador', d:'Aumenta muito gols de cabeça/cruzamento', cat:{cabeca:3.0}, attr:{Cabeceio:5}},
  {k:'batista', n:'Mestre da Bola Parada', d:'Aumenta gols de falta e escanteio', cat:{falta:3.0, escanteio:3.0}, attr:{Chute:3}},
  {k:'plastico', n:'Plástico', d:'Aumenta gols de bicicleta/rabona/chapéu', cat:{bicicleta:3.0, chapeu:3.0}, attr:{Drible:4}},
  {k:'ambidestro', n:'Ambidestro', d:'+1 em todos os atributos (além do pé)', cat:{}, attrAll:1},
  {k:'visor', n:'Visão de Jogo', d:'+Visão e leitura', cat:{}, attr:{Visão:4,Posicionamento:3}}
];

// Arquétipos estilo FIFA (criação de personagem)
const ARCHETYPES = [
  {k:'expectativas', n:'Altas Expectativas', d:'Jogador pronto: OVR alto, potencial moderado. Estreia brilhando.', age:[20,26], ovr:72, pot:84, pts:0},
  {k:'escalada', n:'Escalada até o Topo', d:'Projeto: OVR baixo, potencial estratosférico. Cresce jogando.', age:[16,19], ovr:56, pot:95, pts:0},
  {k:'retorno', n:'O Retorno à Glória', d:'Veterano voltando: OVR Bom, idade alta, potencial decente.', age:[29,34], ovr:70, pot:82, pts:0},
  {k:'branco', n:'Página em Branco', d:'Novato puro: OVR baixo, potencial alto, bem jovem.', age:[16,18], ovr:60, pot:90, pts:0},
  {k:'personalizada', n:'Personalizada', d:'Distribua 120 pontos pelos atributos (máx 95 por um).', age:[16,38], ovr:null, pot:null, pts:120}
];

// Planos de treino (cada um foca em 2 atributos)
const TRAIN_PLANS = [
  {k:'fisico', n:'Físico Brutal', d:'Força + Resistência', a:['Força','Resistência']},
  {k:'tecnico', n:'Técnica Obsessiva', d:'Finalização + Drible', a:['Finalização','Drible']},
  {k:'velocidade', n:'Velocidade do Pânico', d:'Velocidade + Resistência', a:['Velocidade','Resistência']},
  {k:'criativo', n:'Visão doentia', d:'Passe + Visão', a:['Passe','Visão']},
  {k:'defensivo', n:'Paredão', d:'Marcação + Posicionamento', a:['Marcação','Posicionamento']},
  {k:'aereo', n:'Domínio Aéreo', d:'Cabeceio + Força', a:['Cabeceio','Força']},
  {k:'mental', n:'Frieza', d:'Reflexos + Saída', a:['Reflexos','Saída']},
  {k:'cruzamento', n:'Cruzamentos', d:'Cruzamento + Passe', a:['Cruzamento','Passe']},
  {k:'finalizador', n:'Finalização Fina', d:'Finalização + Chute de Longa', a:['Finalização','Chute de Longa']},
  {k:'velocista', n:'Explosão', d:'Ritmo + Velocidade', a:['Ritmo','Velocidade']}
];

// Jogadas especiais raras (categorizadas por skill). 'base' = chance base de acontecer
// quando o jogador marca; 'k' é a chave da skill que multiplica a chance.
const SPECIAL_GOALS = [
  {k:'cabeceador', base:0.12, label:'Gol de cabeça ⚡'},
  {k:'finalizador', base:0.10, label:'Finalização de classe 🎯'},
  {k:'drible', base:0.08, label:'Drible e gol 🌀'},
  {k:'criativo', base:0.07, label:'Enfiada de bola e gol 🧠'},
  {k:'velocista', base:0.07, label:'Arrancada e gol 💨'},
  {k:'mental', base:0.06, label:'Gol de pênalti/falta 🥶'},
  {k:'cruzamento', base:0.05, label:'Cruzamento e gol 📐'},
  {k:'aereo', base:0.05, label:'Cabeceio dominante ⬆️'}
];

// ============================================================================
// CATÁLOGO DE COMPETIÇÕES (modelo do Guia: pirâmide + paralelo)
// Cada competição tem nível, tipo de formato e regras de classificação.
// 'id' casa com a liga/copa correspondente em TIERS/CUPS quando aplicável.
// NÍVEIS: estadual < regional < nacional < continental < mundial
// TIPOS:   pontos (liga), mata (copa/playoff), decisao (supercopa/recopa)
// ============================================================================
const COMP_LEVEL = { estadual:0, regional:1, nacional:2, continental:3, mundial:4 };
const COMPETITIONS = [
  // ---- ESTADUAIS (BR) ----
  { id:'bra-paulista', name:'Campeonato Paulista', short:'PAULISTA', level:'estadual', type:'pontos', scope:'BR', state:'SP', teams:12, desc:'O mais disputado estadual do país.' },
  { id:'bra-carioca',  name:'Campeonato Carioca',  short:'CARIOCA',  level:'estadual', type:'pontos', scope:'BR', state:'RJ', teams:12, desc:'A rivalidade fluminense em campo.' },
  { id:'bra-mineiro',  name:'Campeonato Mineiro',  short:'MINEIRO',  level:'estadual', type:'pontos', scope:'BR', state:'MG', teams:12, desc:'Tradicionalíssimo. O galo e a massa.' },
  { id:'bra-gaucho',   name:'Campeonato Gaúcho',   short:'GAÚCHO',   level:'estadual', type:'pontos', scope:'BR', state:'RS', teams:12, desc:'Gre-Nal e muito mais.' },
  // ---- REGIONAIS (BR) ----
  { id:'bra-nordeste', name:'Copa do Nordeste',   short:'NORDESTE', level:'regional', type:'mata', scope:'BR', region:'NE', teams:16, desc:'O Nordeste unido em jogo.' },
  { id:'bra-verde',    name:'Copa Verde',          short:'VERDE',    level:'regional', type:'mata', scope:'BR', region:'NC', teams:16, desc:'Norte + Centro-Oeste brigando.' },
  { id:'bra-sulse',    name:'Copa Sul-Sudeste',   short:'SUL-SUD',  level:'regional', type:'mata', scope:'BR', region:'SS', teams:16, desc:'As duas regiões mais fortes.' },
  // ---- NACIONAIS (pirâmide SÉRIES + COPA + SUPERCOPA) ----
  { id:'bra-sa', name:'Brasileirão Série A', short:'SÉRIE A', level:'nacional', type:'pontos', scope:'BR', desc:'A elite. 20 clubes, pontos corridos.' },
  { id:'bra-sb', name:'Brasileirão Série B', short:'SÉRIE B', level:'nacional', type:'pontos', scope:'BR', desc:'O caldeirão. Subir é tudo.' },
  { id:'bra-sc', name:'Brasileirão Série C', short:'SÉRIE C', level:'nacional', type:'pontos', scope:'BR', desc:'Divisão de acesso à Série B.' },
  { id:'bra-sd', name:'Brasileirão Série D', short:'SÉRIE D', level:'nacional', type:'pontos', scope:'BR', desc:'A base da pirâmide. Grupos + mata-mata.' },
  { id:'bra-copa', name:'Copa do Brasil', short:'COPA BR', level:'nacional', type:'mata', scope:'BR', desc:'Mata-mata nacional. Campeão vai à Libertadores.' },
  { id:'bra-super', name:'Supercopa do Brasil', short:'SUPERCOPA', level:'nacional', type:'decisao', scope:'BR', needs:['bra-sa','bra-copa'], desc:'Campeão do Brasileirão × Campeão da Copa do Brasil.' },
  // ---- CONTINENTAIS ----
  { id:'sam-lib', name:'Copa Libertadores', short:'LIBERTADORES', level:'continental', type:'mata', scope:'SAM', desc:'O continente inteiro. O campeão da América.' },
  { id:'sam-sula', name:'Copa Sul-Americana', short:'SUL-AMERICANA', level:'continental', type:'mata', scope:'SAM', desc:'A segunda principal da CONMEBOL.' },
  { id:'sam-recopa', name:'Recopa Sul-Americana', short:'RECOPA', level:'continental', type:'decisao', scope:'SAM', needs:['sam-lib','sam-sula'], desc:'Libertadores × Sul-Americana.' },
  // ---- MUNDIAIS ----
  { id:'world-inter', name:'Copa Intercontinental da FIFA', short:'INTERCONTINENTAL', level:'mundial', type:'decisao', scope:'ALL', needs:['sam-lib'], desc:'Campeão continental vs campeões do mundo.' },
  { id:'world-club', name:'Mundial de Clubes da FIFA', short:'MUNDIAL', level:'mundial', type:'mata', scope:'ALL', desc:'32 clubes. Ciclo de 4 anos.' }
];
function COMP_BY_ID(id){ return COMPETITIONS.find(c=>c.id===id); }
function COMPS_OF_LEVEL(level){ return COMPETITIONS.filter(c=>c.level===level); }

// Liga/copa "real" correspondente em TIERS/CUPS (quando existir elenco real).
function COMP_LEAGUE_ID(comp){
  if (!comp) return null;
  if (['bra-sa','bra-sb','bra-sc','bra-sd'].includes(comp.id)) return comp.id;
  if (comp.id==='bra-copa') return 'bra-copa';
  if (comp.id==='sam-lib') return 'sam-lib';
  return null;
}

