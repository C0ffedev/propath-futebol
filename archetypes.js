// ===== archetypes.js — ProPath Futebol (Modelo 3 Camadas) =====
// (A) MENTAIS TRANSVERSais (Predador / Metavisão / Híbrido): qualidades MENTAIS da obra
//     Blue Lock — aparecem em QUALQUER posição (Kaiser ata tem metavisa; Aiku/Niko zag
//     têm metavisa; Sae era ata virou mei). Ficam TRANCADOS no início e só DESPERTAM por
//     marco de carreira (gating de balance — ver gate). Híbrido = Predador+Metavisão
//     (estilo "treinador da Inglaterra", não confirmado na obra).
// (B) ARQUÉTIPOS DE POSIÇÃO: 8+ por posição, acessíveis desde a criação.
// (C) COMBINAÇÃO: S.archetype (posição) + S.mental (mental desperto) -> engine combina.
// PI: Blue Lock = "inspirado em <personagem>"; reais = "inspirado em <jogador>";
//     Pânico/Obsessão = "inspirado em Pânico/Obsessão". Não vender sem renomear.

// ---------- (A) MENTAIS TRANSVERSais (gated) ----------
const MENTAL_ARCHETYPES = [
  {
    k: 'predador',
    n: 'Predador',
    insp: 'Barou / Shidou (Blue Lock)',
    mental: true,
    blurb: 'Devora qualquer espaço. Qualidade mental transversal — aparece em qualquer posição.',
    gate: { goalsCareer: 25 }, // desperta aos 25 gols de carreira
    signature: {
      type: 'active',
      name: 'Gol de Destaque',
      specialChance: 0.45,
      specialLabel: 'Gol de Destaque do Predador 👹',
      specialVerb: 'explode a rede com um chute impossível',
      missPenalty: 0.4
    },
    growthBias: { Finalização: 1.12, Cabeceio: 1.10, Passe: 0.97, Visão: 0.97 },
    mutate: { at: { goalsCareer: 50 }, k: 'predador_lider', n: 'Predador Líder',
      note: 'Virou líder do ataque: passa a armar os companheiros também.', bonus: { assists: 0.20 } },
    synergy: { likes: ['metavista','regista','devorador','kaiser','rin','bachira'], conflicts: [] },
    reveal: 'finish'
  },
  {
    k: 'metavista',
    n: 'Metavisão',
    insp: 'Isagi / Sae (Blue Lock)',
    mental: true,
    blurb: 'Lê o espaço antes de todos. Mental transversal — Kaiser (ata) e Aiku/Niko (zag) também a têm.',
    gate: { assistsCareer: 25 }, // desperta aos 25 assistências
    signature: {
      type: 'passive',
      name: 'Leitura de Jogo',
      assistBonus: 0.18,
      ratingBonus: 0.25,
      revealSpaces: true
    },
    growthBias: { Visão: 1.12, Passe: 1.10, Defesa: 1.05, Finalização: 1.02 },
    mutate: { at: { assistsCareer: 100 }, k: 'metavista_total', n: 'Metavisão Total',
      note: 'Passa a ler também a defesa adversária: raramente erra a decisão.', bonus: { ratingBonus: 0.20 } },
    synergy: { likes: ['predador','regista','medium','aiku','niko','charles','hiori'], conflicts: [] },
    reveal: 'spaces'
  },
  {
    k: 'hibrido',
    n: 'Híbrido',
    insp: 'inspirado no treinador da Inglaterra (não confirmado na obra)',
    mental: true,
    blurb: 'Fusão de Predador + Metavisão. Mistura rara — domina o espaço e devora a chance.',
    gate: { goalsCareer: 35, assistsCareer: 35 }, // desperta aos 35 gols E 35 assist
    signature: {
      type: 'hybrid',
      name: 'Domínio Total',
      specialChance: 0.30,
      specialLabel: 'Jogada de Domínio Total 🜂',
      specialVerb: 'lê, invade e finaliza num só movimento',
      assistBonus: 0.15,
      ratingBonus: 0.20,
      revealSpaces: true
    },
    growthBias: { Visão: 1.10, Finalização: 1.08, Passe: 1.06, Defesa: 1.02 },
    mutate: { at: { goalsCareer: 80, assistsCareer: 80 }, k: 'hibrido_absoluto', n: 'Híbrido Absoluto',
      note: 'Tornou-se a síntese perfeita: cérebro e instinto em um só corpo.', bonus: { ratingBonus: 0.25, specialChance: 0.20 } },
    synergy: { likes: ['predador','metavista','regista','kaiser','rin'], conflicts: [] },
    reveal: 'hybrid'
  }
];

// ---------- (B) ARQUÉTIPOS DE POSIÇÃO (8+ cada) ----------
const PLAYER_ARCHETYPES = [
  // ===================== ATA (8) =====================
  { k:'predador_ata', n:'Predador (Barou)', insp:'Barou (Blue Lock)', pos:['ATA'], blurb:'Matador de área. Finaliza qualquer chance no limite.',
    signature:{type:'active',name:'Gol de Destaque',specialChance:0.45,specialLabel:'Gol de Destaque 👹',specialVerb:'explode a rede',missPenalty:0.4},
    growthBias:{Finalização:1.30,Cabeceio:1.20,Passe:0.90,Visão:0.90},
    mutate:{at:{goalsCareer:50},k:'predador_lider',n:'Predador Líder',note:'Vira líder do ataque e passa a armar.',bonus:{assists:0.20}},
    synergy:{likes:['regista','metavista'],conflicts:[]}, reveal:'finish' },
  { k:'devorador', n:'Devorador', insp:'Kunigami (Blue Lock)', pos:['ATA'], blurb:'Força bruta e cabeceio. Ganha todas as disputas aéreas.',
    signature:{type:'active',name:'Cabeçada Devastadora',specialChance:0.35,specialLabel:'Testada do Devorador 💥',specialVerb:'desvia de cabeça imparável',neutralFloor:0.1},
    growthBias:{Cabeceio:1.35,Finalização:1.15,Defesa:1.05,Passe:0.95},
    mutate:{at:{goalsCareer:40},k:'devorador_titã',n:'Devorador Titã',note:'Vira muralha aérea dos dois lados.',bonus:{cleanAerial:1}},
    synergy:{likes:['regista','anchor'],conflicts:[]}, reveal:'finish' },
  { k:'ceifador', n:'Ceifador', insp:'inspirado em Pânico/Obsessão (Ghost)', pos:['ATA'], blurb:'Matador frio. Aparece do nada e finaliza sem piedade.',
    signature:{type:'active',name:'Aparição Fatal',specialChance:0.40,specialLabel:'Aparição Fatal 👻',specialVerb:'surge e mata',missPenalty:0.25},
    growthBias:{Finalização:1.25,Visão:1.10,Cabeceio:1.05,Defesa:0.90},
    mutate:{at:{goalsCareer:45},k:'ceifador_sombra',n:'Ceifador das Sombras',note:'A obsessão virou instinto em todas as jogadas.',bonus:{specialChance:0.25}},
    synergy:{likes:['medium','metavista'],conflicts:[]}, reveal:'finish' },
  { k:'kaiser', n:'Imperador', insp:'Kaiser (Blue Lock)', pos:['ATA'], blurb:'Ego imperial + meta-visão. Chuta de longe e decide com autoridade.',
    signature:{type:'active',name:'Imperador',specialChance:0.38,specialLabel:'Canhão do Imperador 👑',specialVerb:'solta uma bomba de longe',neutralFloor:0.15},
    growthBias:{Finalização:1.28,Visão:1.12,Passe:1.05,Defesa:0.85},
    mutate:{at:{goalsCareer:55},k:'kaiser_supremo',n:'Imperador Supremo',note:'Passa a ditar o jogo inteiro do ataque.',bonus:{assistBonus:0.15}},
    synergy:{likes:['metavista','regista','predador'],conflicts:[]}, reveal:'finish' },
  { k:'shidou', n:'Demônio', insp:'Shidou (Blue Lock)', pos:['ATA'], blurb:'Instinto animal. GolP de bicicleta e movimento caótico imprevisível.',
    signature:{type:'active',name:'Gol Acrobático',specialChance:0.42,specialLabel:'Gol Acrobático do Demônio 😈',specialVerb:'resolve de bicicleta',missPenalty:0.30},
    growthBias:{Finalização:1.32,Cabeceio:1.18,Visão:0.92,Passe:0.88},
    mutate:{at:{goalsCareer:48},k:'shidou_primordial',n:'Demônio Primordial',note:'O caos vira arte: gols de todos os ângulos.',bonus:{specialChance:0.20}},
    synergy:{likes:['predador','bachira'],conflicts:[]}, reveal:'finish' },
  { k:'bachira', n:'Pulso', insp:'Bachira (Blue Lock)', pos:['ATA'], blurb:'Drible alegre e imprevisível. Quebra a marcação com o corpo.',
    signature:{type:'active',name:'Drible da Fada',specialChance:0.30,specialLabel:'Drible da Fada 🧚',specialVerb:'passa por todos',neutralFloor:0.18},
    growthBias:{Finalização:1.20,Visão:1.10,Passe:1.05,Defesa:0.90},
    mutate:{at:{goalsCareer:42},k:'bachira_genio',n:'Pulso Genial',note:'Vira o caos organizado do ataque.',bonus:{assistBonus:0.15}},
    synergy:{likes:['shidou','predador'],conflicts:[]}, reveal:'finish' },
  { k:'chigiri', n:'Velocista', insp:'Chigiri (Blue Lock)', pos:['ATA','LAT'], blurb:'Velocidade explosiva. Deixa zagueiros para trás na corrida.',
    signature:{type:'active',name:'Arrancada',specialChance:0.33,specialLabel:'Arrancada do Velocista 💨',specialVerb:'sprinta e finaliza',neutralFloor:0.12},
    growthBias:{Finalização:1.22,Visão:1.05,Passe:1.00,Defesa:0.92},
    mutate:{at:{goalsCareer:44},k:'chigiri_relampago',n:'Velocista Relâmpago',note:'Vira o lado mais rápido do campo.',bonus:{specialChance:0.15}},
    synergy:{likes:['ala_invertido','otoya','relampago'],conflicts:[]}, reveal:'finish' },
  { k:'rin', n:'Predador Mudo', insp:'Rin (Blue Lock)', pos:['ATA'], blurb:'Duas faces: frieza calculista + sede de devorar. Perigo constante.',
    signature:{type:'active',name:'Predador Mudo',specialChance:0.43,specialLabel:'Gol do Predador Mudo 🔥',specialVerb:'fria e lethalmente finaliza',missPenalty:0.35},
    growthBias:{Finalização:1.30,Cabeceio:1.10,Visão:1.05,Passe:0.95},
    mutate:{at:{goalsCareer:52},k:'rin_devorador',n:'Devorador Absoluto',note:'As duas faces se fundiram: imperador do gol.',bonus:{specialChance:0.20}},
    synergy:{likes:['predador','kaiser','shidou'],conflicts:[]}, reveal:'finish' },

  // ===================== MEI (8) =====================
  { k:'metavista_mei', n:'Metavisão (Isagi)', insp:'Isagi / Sae (Blue Lock)', pos:['MEI'], blurb:'Cérebro de jogada. Lê o espaço e armava os companheiros.',
    signature:{type:'passive',name:'Leitura de Jogo',assistBonus:0.18,ratingBonus:0.25,revealSpaces:true},
    growthBias:{Visão:1.35,Passe:1.20,Defesa:1.10,Finalização:1.05},
    mutate:{at:{assistsCareer:100},k:'metavista_total',n:'Metavisão Total',note:'Lê a defesa adversária também.',bonus:{ratingBonus:0.20}},
    synergy:{likes:['regista','predador','kaiser'],conflicts:[]}, reveal:'spaces' },
  { k:'regista', n:'Regista', insp:'inspirado em Pirlo / Valverde', pos:['VOL','MEI'], blurb:'Comandante de meio. Controla o ritmo com a passe.',
    signature:{type:'active',name:'Linha de Passe Garantida',guaranteedAssist:1,specialLabel:'Enfiada de Genialidade 🧠',specialVerb:'solta enfiada'},
    growthBias:{Passe:1.30,Visão:1.25,Defesa:1.15,Finalização:0.85},
    mutate:{at:{gamesCareer:150},k:'regista_mestre',n:'Regista Mestre',note:'Dobra jogadas de classe.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['metavista','muralha','anchor'],conflicts:[]}, reveal:'lines' },
  { k:'medium', n:'Médium', insp:'inspirado em Obsessão (Orquestrador)', pos:['MEI'], blurb:'Orquestrador obcecado. Repete o passe até achar o ângulo.',
    signature:{type:'passive',name:'Loop Obsessivo',assistBonus:0.22,ratingBonus:0.15,revealSpaces:true},
    growthBias:{Passe:1.28,Visão:1.22,Defesa:1.05,Finalização:0.95},
    mutate:{at:{assistsCareer:80},k:'medium_absoluto',n:'Médium Absoluto',note:'Controle total do jogo.',bonus:{ratingBonus:0.20}},
    synergy:{likes:['regista','ceifador','metavista'],conflicts:[]}, reveal:'spaces' },
  { k:'charles', n:'Armador Prodigio', insp:'Charles (Blue Lock)', pos:['MEI'], blurb:'Visão de campo absurda. Enxerga passes que ninguém vê.',
    signature:{type:'passive',name:'Visão de Prodigio',assistBonus:0.20,ratingBonus:0.18,revealSpaces:true},
    growthBias:{Visão:1.32,Passe:1.28,Defesa:1.05,Finalização:0.95},
    mutate:{at:{assistsCareer:90},k:'charles_genio',n:'Armador Gênio',note:'Passa a ditar o ritmo do mundo.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['regista','metavista','hiori'],conflicts:[]}, reveal:'spaces' },
  { k:'hiori', n:'Calma', insp:'Hiori (Blue Lock)', pos:['MEI'], blurb:'Frieza absoluta. Organiza o caos e serve o melhor lance.',
    signature:{type:'passive',name:'Centro Calmo',assistBonus:0.19,ratingBonus:0.22,revealSpaces:true},
    growthBias:{Visão:1.28,Passe:1.26,Defesa:1.08,Finalização:0.98},
    mutate:{at:{assistsCareer:85},k:'hiori_fluxo',n:'Calma de Fluxo',note:'Vira o maestro imperturbável.',bonus:{ratingBonus:0.20}},
    synergy:{likes:['regista','metavista','charles'],conflicts:[]}, reveal:'spaces' },
  { k:'reo', n:'Camaleão', insp:'Reo (Blue Lock)', pos:['MEI','VOL'], blurb:'Versátil e copiador. Adapta o estilo ao que o time precisa.',
    signature:{type:'active',name:'Adaptação',guaranteedAssist:1,specialLabel:'Jogada Camaleão 🌀',specialVerb:'reproduz o lance ideal'},
    growthBias:{Visão:1.20,Passe:1.24,Defesa:1.12,Finalização:1.00},
    mutate:{at:{gamesCareer:130},k:'reo_monarca',n:'Camaleão Monarca',note:'Domina múltiplos estilos.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['regista','metavista','karasu'],conflicts:[]}, reveal:'lines' },
  { k:'nagi', n:'Genialidade', insp:'Nagi (Blue Lock)', pos:['MEI','ATA'], blurb:'Toque genial e preguiçoso. Resolve lances impossíveis no travo.',
    signature:{type:'passive',name:'Genialidade Trávo',assistBonus:0.16,ratingBonus:0.20,revealSpaces:true},
    growthBias:{Visão:1.22,Passe:1.18,Finalização:1.10,Defesa:0.95},
    mutate:{at:{goalsCareer:35},k:'nagi_estrela',n:'Genialidade Estrela',note:'A preguiça vira arte letal.',bonus:{specialChance:0.20}},
    synergy:{likes:['metavista','bachira'],conflicts:[]}, reveal:'spaces' },
  { k:'yukimiya', n:'Drible Vista', insp:'Yukimiya (Blue Lock)', pos:['MEI','ATA'], blurb:'Drible e visão de jogo. Carrega a bola e enxerga o gol.',
    signature:{type:'passive',name:'Drible-Vísão',assistBonus:0.15,ratingBonus:0.15,revealSpaces:true},
    growthBias:{Visão:1.24,Passe:1.16,Finalização:1.12,Defesa:0.95},
    mutate:{at:{assistsCareer:70},k:'yukimiya_luz',n:'Drible de Luz',note:'Vira o ponta-cérebro do time.',bonus:{assistBonus:0.15}},
    synergy:{likes:['metavista','bachira','charles'],conflicts:[]}, reveal:'spaces' },

  // ===================== VOL (8) =====================
  { k:'anchor', n:'Anchor', insp:'inspirado em Kanté', pos:['VOL'], blurb:'Cão de caça. Recupera todas as bolas e protege a zaga.',
    signature:{type:'passive',name:'Recuperação Implacável',ratingBonus:0.20,defAura:0.30},
    growthBias:{Defesa:1.35,Visão:1.15,Passe:1.05,Finalização:0.80},
    mutate:{at:{gamesCareer:200},k:'anchor_muro',n:'Anchor Muro',note:'Quase nada passa.',bonus:{defAura:0.20}},
    synergy:{likes:['regista','muralha','carcereiro'],conflicts:[]}, reveal:'lines' },
  { k:'tratador', n:'Tratador', insp:'inspirado em Pânico (Controlador)', pos:['VOL'], blurb:'Controlador frio. Sufoca o adversário sem pressa.',
    signature:{type:'passive',name:'Asfixia Tática',ratingBonus:0.18,defAura:0.25,cleanSheetChance:0.10},
    growthBias:{Defesa:1.25,Passe:1.20,Visão:1.10,Finalização:0.85},
    mutate:{at:{gamesCareer:120},k:'tratador_sombra',n:'Tratador da Sombra',note:'Domínio absoluto do ritmo.',bonus:{defAura:0.20,cleanSheetChance:0.10}},
    synergy:{likes:['medium','anchor','muralha'],conflicts:[]}, reveal:'lines' },
  { k:'karasu', n:'Corvo', insp:'Karasu (Blue Lock)', pos:['VOL','MEI'], blurb:'Rouba, imita e suga o jogo. Onipresente na marcação.',
    signature:{type:'passive',name:'Suga o Jogo',ratingBonus:0.18,defAura:0.28,cleanSheetChance:0.08},
    growthBias:{Defesa:1.30,Visão:1.20,Passe:1.10,Finalização:0.85},
    mutate:{at:{gamesCareer:140},k:'karasu_tiniebla',n:'Corvo das Tinieblas',note:'Vira a sombra que engole a bola.',bonus:{defAura:0.22}},
    synergy:{likes:['anchor','tratador','reo'],conflicts:[]}, reveal:'lines' },
  { k:'cavalo', n:'Cavalo', insp:'inspirado em Box-to-Box (real)', pos:['VOL'], blurb:'Corre o campo inteiro. Chega e volta, marca e arma.',
    signature:{type:'active',name:'Chegada',guaranteedAssist:1,specialLabel:'Cavalgada ⚡',specialVerb:'sobe e cruza'},
    growthBias:{Defesa:1.22,Passe:1.15,Visão:1.12,Finalização:1.05},
    mutate:{at:{gamesCareer:160},k:'cavalo_eterno',n:'Cavalo Eterno',note:'Inesgotável nas duas faixas.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['regista','anchor','reo'],conflicts:[]}, reveal:'lines' },
  { k:'sombra_vol', n:'Sombra', insp:'inspirado em Pânico (Sombra)', pos:['VOL'], blurb:'Marca como uma sombra. Some com o criativo adversário.',
    signature:{type:'passive',name:'Marcação Sombra',ratingBonus:0.16,defAura:0.30,cleanSheetChance:0.12},
    growthBias:{Defesa:1.30,Visão:1.10,Passe:1.00,Finalização:0.82},
    mutate:{at:{gamesCareer:130},k:'sombra_eterea',n:'Sombra Etérea',note:'Vira invisível para o atacante.',bonus:{defAura:0.20}},
    synergy:{likes:['anchor','tratador','karasu'],conflicts:[]}, reveal:'lines' },
  { k:'trincheira', n:'Trincheira', insp:'inspirado em volante-trincheira (real)', pos:['VOL'], blurb:'Muro à frente da zaga. Corto tudo de frente.',
    signature:{type:'passive',name:'Trincheira',ratingBonus:0.17,defAura:0.32,cleanSheetChance:0.10},
    growthBias:{Defesa:1.34,Visão:1.08,Passe:1.02,Finalização:0.80},
    mutate:{at:{gamesCareer:150},k:'trincheira_fort',n:'Trincheira Fortaleza',note:'Linha de frente intransponível.',bonus:{defAura:0.20}},
    synergy:{likes:['muralha','anchor','carcereiro'],conflicts:[]}, reveal:'lines' },
  { k:'polvo', n:'Polvo', insp:'inspirado em volante-polvo (real)', pos:['VOL'], blurb:'Braços longos, recupera onde não deveria alcançar.',
    signature:{type:'passive',name:'Tentáculo',ratingBonus:0.15,defAura:0.34,cleanSheetChance:0.09},
    growthBias:{Defesa:1.32,Visão:1.12,Passe:1.08,Finalização:0.85},
    mutate:{at:{gamesCareer:145},k:'polvo_abissal',n:'Polvo Abissal',note:'Alcance que engole o campo.',bonus:{defAura:0.20}},
    synergy:{likes:['anchor','tratador','karasu'],conflicts:[]}, reveal:'lines' },
  { k:'zantetsu', n:'Trem', insp:'Zantetsu (Blue Lock)', pos:['VOL','LAT'], blurb:'Velocidade bruta de reta. Sobe a linha como um trem.',
    signature:{type:'active',name:'Arrancada de Trem',guaranteedAssist:1,specialLabel:'Bala de Trem 🚄',specialVerb:'sprinta pela linha'},
    growthBias:{Defesa:1.18,Passe:1.12,Visão:1.05,Finalização:1.00},
    mutate:{at:{gamesCareer:135},k:'zantetsu_bala',n:'Trem Bala',note:'Vira a faixa mais rápida.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['ala_invertido','relampago','chigiri'],conflicts:[]}, reveal:'lines' },

  // ===================== ZAG (8) =====================
  { k:'muralha', n:'Muralha', insp:'inspirado em Van Dijk / Cannavaro', pos:['ZAG'], blurb:'Paredão. Ganha divididas e lê o atacante.',
    signature:{type:'passive',name:'Barreira Imponente',ratingBonus:0.22,defAura:0.35,cleanSheetChance:0.12},
    growthBias:{Defesa:1.35,Cabeceio:1.20,Passe:1.00,Finalização:0.80},
    mutate:{at:{gamesCareer:180},k:'muralha_intocavel',n:'Muralha Intocável',note:'Referência da retaguarda.',bonus:{defAura:0.20,cleanSheetChance:0.10}},
    synergy:{likes:['anchor','regista','tratador'],conflicts:[]}, reveal:'lines' },
  { k:'carcereiro', n:'Carcereiro', insp:'inspirado em Pânico (Tranca)', pos:['ZAG'], blurb:'Tranca e não solta. Marca por tabela e sufoca.',
    signature:{type:'passive',name:'Prisão Tática',ratingBonus:0.18,defAura:0.30,cleanSheetChance:0.14},
    growthBias:{Defesa:1.30,Cabeceio:1.15,Visão:1.05,Passe:0.90},
    mutate:{at:{gamesCareer:140},k:'carcereiro_eterno',n:'Carcereiro Eterno',note:'Nenhum atacante escapa.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['anchor','tratador','muralha'],conflicts:[]}, reveal:'lines' },
  { k:'aiku', n:'Líder Zag', insp:'Aiku (Blue Lock)', pos:['ZAG'], blurb:'Zagueiro com meta-visão. Lê o ataque e antecipa o lance.',
    signature:{type:'passive',name:'Meta-Leitura (Zag)',ratingBonus:0.20,defAura:0.33,cleanSheetChance:0.13,revealSpaces:true},
    growthBias:{Defesa:1.33,Cabeceio:1.18,Visão:1.15,Passe:1.00},
    mutate:{at:{cleanSheetsCareer:60},k:'aiku_capita',n:'Líder Capitão',note:'Vira o cérebro da defesa.',bonus:{ratingBonus:0.20}},
    synergy:{likes:['metavista','muralha','anchor'],conflicts:[]}, reveal:'hybrid' },
  { k:'niko', n:'Leitura', insp:'Niko (Blue Lock)', pos:['ZAG'], blurb:'Leitura de jogada cirúrgica. Sabe onde a bola vai cair.',
    signature:{type:'passive',name:'Leitura Cirúrgica',ratingBonus:0.19,defAura:0.32,cleanSheetChance:0.12,revealSpaces:true},
    growthBias:{Defesa:1.32,Cabeceio:1.16,Visão:1.18,Passe:0.98},
    mutate:{at:{cleanSheetsCareer:55},k:'niko_oraculo',n:'Leitura Oráculo',note:'Vira o oráculo da retaguarda.',bonus:{defAura:0.20}},
    synergy:{likes:['metavista','muralha','aiku'],conflicts:[]}, reveal:'hybrid' },
  { k:'lorenzo', n:'Muralha Viva', insp:'Lorenzo (Blue Lock)', pos:['ZAG','VOL'], blurb:'Onipresente na defesa. Antecipa e corta tudo.',
    signature:{type:'passive',name:'Onipresença',ratingBonus:0.21,defAura:0.36,cleanSheetChance:0.14},
    growthBias:{Defesa:1.36,Cabeceio:1.14,Visão:1.12,Passe:1.00},
    mutate:{at:{cleanSheetsCareer:65},k:'lorenzo_absoluto',n:'Muralha Absoluta',note:'Vira a defesa personificada.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['muralha','anchor','carcereiro'],conflicts:[]}, reveal:'lines' },
  { k:'aryu', n:'Estético', insp:'Aryu (Blue Lock)', pos:['ZAG'], blurb:'Altura e estética. Ganha tudo de cabeça com estilo.',
    signature:{type:'passive',name:'Cabeceio Estético',ratingBonus:0.16,defAura:0.30,cleanSheetChance:0.10},
    growthBias:{Defesa:1.30,Cabeceio:1.35,Visão:0.95,Passe:0.92},
    mutate:{at:{cleanSheetsCareer:50},k:'aryu_divino',n:'Estético Divino',note:'Vira o rei do jogo aéreo.',bonus:{defAura:0.20}},
    synergy:{likes:['muralha','anchor'],conflicts:[]}, reveal:'lines' },
  { k:'tranca', n:'Tranca', insp:'inspirado em Pânico (Fim)', pos:['ZAG'], blurb:'Fim de jogo. Tranca o espaço e não permite a virada.',
    signature:{type:'passive',name:'Fim de Jogo',ratingBonus:0.17,defAura:0.34,cleanSheetChance:0.15},
    growthBias:{Defesa:1.33,Cabeceio:1.16,Visão:1.05,Passe:0.90},
    mutate:{at:{cleanSheetsCareer:58},k:'tranca_eterno',n:'Tranca Eterno',note:'Vira a certeza da vitória.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['carcereiro','muralha','tratador'],conflicts:[]}, reveal:'lines' },
  { k:'colosso', n:'Colosso', insp:'inspirado em zagueiro-colosso (real)', pos:['ZAG'], blurb:'Corpo de gigante. Ganha quase toda disputa física.',
    signature:{type:'passive',name:'Corpo Colosso',ratingBonus:0.15,defAura:0.32,cleanSheetChance:0.11},
    growthBias:{Defesa:1.31,Cabeceio:1.30,Visão:0.95,Passe:0.88},
    mutate:{at:{cleanSheetsCareer:52},k:'colosso_titã',n:'Colosso Titã',note:'Vira a montanha da defesa.',bonus:{defAura:0.20}},
    synergy:{likes:['muralha','aryu','anchor'],conflicts:[]}, reveal:'lines' },

  // ===================== LAT (8) =====================
  { k:'ala_invertido', n:'Ala Invertido', insp:'inspirado em Roberto Carlos', pos:['LAT'], blurb:'Sobe e desce a linha. Cruzamento e chute de longe.',
    signature:{type:'active',name:'Cruzamento de Ouro',guaranteedAssist:1,specialLabel:'Cruzamento de Ouro ⚡',specialVerb:'mete bola na cabeça'},
    growthBias:{Passe:1.25,Visão:1.15,Defesa:1.10,Finalização:1.00},
    mutate:{at:{gamesCareer:160},k:'inverted_lenda',n:'Ala Lenda',note:'Arma de dois tempos.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['regista','predador','devorador'],conflicts:[]}, reveal:'lines' },
  { k:'ala_fantasma', n:'Ala-Fantasma', insp:'inspirado em Pânico (Espectro)', pos:['LAT'], blurb:'Sobreposições assombrosas. Aparece e some.',
    signature:{type:'active',name:'Sobreposição Fantasma',guaranteedAssist:1,specialLabel:'Sobreposição Fantasma 👻',specialVerb:'surge e cruza'},
    growthBias:{Passe:1.20,Visão:1.20,Defesa:1.05,Finalização:0.95},
    mutate:{at:{gamesCareer:130},k:'ala_etereo',n:'Ala Etéreo',note:'Onipresença na linha.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['medium','ceifador','metavista'],conflicts:[]}, reveal:'lines' },
  { k:'otoya', n:'Fantasma', insp:'Otoya (Blue Lock)', pos:['LAT','ATA'], blurb:'Infiltrador. Some da marcação e aparece nas costas.',
    signature:{type:'active',name:'Infiltração',guaranteedAssist:1,specialLabel:'Infiltração Fantasma 🕳️',specialVerb:'surge nas costas'},
    growthBias:{Passe:1.22,Visão:1.18,Defesa:1.05,Finalização:1.05},
    mutate:{at:{gamesCareer:125},k:'otoya_etereo',n:'Fantasma Etéreo',note:'Vira o pesadelo dos zagueiros.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['ala_fantasma','relampago','chigiri'],conflicts:[]}, reveal:'lines' },
  { k:'relampago', n:'Relâmpago', insp:'Loki (Blue Lock)', pos:['LAT','ATA'], blurb:'Velocidade absurda. Deixa todos para trás.',
    signature:{type:'active',name:'Arrancada Relâmpago',guaranteedAssist:1,specialLabel:'Relâmpago ⚡',specialVerb:'desparecia e cruza'},
    growthBias:{Passe:1.18,Visão:1.12,Defesa:1.02,Finalização:1.02},
    mutate:{at:{gamesCareer:140},k:'relampago_divino',n:'Relâmpago Divino',note:'Vira o lado mais rápido do mundo.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['chigiri','otoya','ala_invertido'],conflicts:[]}, reveal:'lines' },
  { k:'infiltrador', n:'Infiltrador', insp:'inspirado em Pânico (Caçador)', pos:['LAT'], blurb:'Sobe na surdina e aparece no contra-ataque.',
    signature:{type:'active',name:'Caçada',guaranteedAssist:1,specialLabel:'Caçada Silenciosa 🌑',specialVerb:'infiltra e cruza'},
    growthBias:{Passe:1.19,Visão:1.16,Defesa:1.04,Finalização:1.00},
    mutate:{at:{gamesCareer:120},k:'infiltrador_sombra',n:'Infiltrador da Sombra',note:'Vira o contra-ataque vivo.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['ala_fantasma','ceifador','otoya'],conflicts:[]}, reveal:'lines' },
  { k:'ala_motor', n:'Ala Motor', insp:'inspirado em lateral-motor (real)', pos:['LAT'], blurb:'Resistência de motor. Sobe e volta o jogo todo.',
    signature:{type:'active',name:'Motor',guaranteedAssist:1,specialLabel:'Subida de Motor 🔋',specialVerb:'sobe e cruza'},
    growthBias:{Passe:1.21,Visão:1.10,Defesa:1.14,Finalização:0.98},
    mutate:{at:{gamesCareer:155},k:'ala_motor_eterno',n:'Ala Motor Eterno',note:'Inesgotável na lateral.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['regista','ala_invertido','zantetsu'],conflicts:[]}, reveal:'lines' },
  { k:'sobreposicao', n:'Sobreposição', insp:'genérico — estilo de sobreposição', pos:['LAT'], blurb:'Abre o campo subindo pela linha e dá opção.',
    signature:{type:'active',name:'Abertura',guaranteedAssist:1,specialLabel:'Abertura Lateral 🔓',specialVerb:'abre e cruza'},
    growthBias:{Passe:1.20,Visão:1.12,Defesa:1.08,Finalização:0.97},
    mutate:{at:{gamesCareer:135},k:'sobreposicao_maestro',n:'Sobreposição Maestro',note:'Vira o pulmão tático.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['regista','ala_motor','relampago'],conflicts:[]}, reveal:'lines' },
  { k:'seta', n:'Seta', insp:'inspirado em lateral-setor (real)', pos:['LAT'], blurb:'Cruzamento milimetrado. Enche a área de bolas boas.',
    signature:{type:'active',name:'Cruzamento Seta',guaranteedAssist:1,specialLabel:'Cruzamento Seta 🎯',specialVerb:'enche a área'},
    growthBias:{Passe:1.26,Visão:1.14,Defesa:1.06,Finalização:0.96},
    mutate:{at:{gamesCareer:145},k:'seta_cirurgiao',n:'Seta Cirurgião',note:'Vira o cirurgião das bolas.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['predador','devorador','ala_invertido'],conflicts:[]}, reveal:'lines' },

  // ===================== GOL (8) =====================
  { k:'guardiao', n:'Guardião', insp:'inspirado em Neuer', pos:['GOL'], blurb:'Goleiro-líbero. Sai do gol e defende o improvável.',
    signature:{type:'passive',name:'Muralha Viva',ratingBonus:0.25,defAura:0.40,cleanSheetChance:0.18},
    growthBias:{Defesa:1.40,Visão:1.10,Passe:1.05,Finalização:0.70},
    mutate:{at:{gamesCareer:200},k:'guardiao_absoluto',n:'Guardião Absoluto',note:'Último homem intransponível.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['muralha','carcereiro','anchor'],conflicts:[]}, reveal:'lines' },
  { k:'paredao', n:'Paredão', insp:'inspirado em Obsessão (Muro)', pos:['GOL'], blurb:'Paredão impossível. Reflexo sobrenatural e presença.',
    signature:{type:'passive',name:'Muro Impossível',ratingBonus:0.20,defAura:0.45,cleanSheetChance:0.15},
    growthBias:{Defesa:1.38,Visão:1.05,Passe:0.95,Finalização:0.70},
    mutate:{at:{gamesCareer:170},k:'paredao_templo',n:'Paredão Templo',note:'Nada entra.',bonus:{defAura:0.20,cleanSheetChance:0.13}},
    synergy:{likes:['muralha','carcereiro','tratador'],conflicts:[]}, reveal:'lines' },
  { k:'gagamaru', n:'Instinto', insp:'Gagamaru (Blue Lock)', pos:['GOL'], blurb:'Goleiro atípico. Defende no instinto puro, sem técnica.',
    signature:{type:'passive',name:'Instinto Selvagem',ratingBonus:0.22,defAura:0.42,cleanSheetChance:0.16},
    growthBias:{Defesa:1.39,Visão:1.08,Passe:0.98,Finalização:0.72},
    mutate:{at:{gamesCareer:180},k:'gagamaru_fera',n:'Instinto Fera',note:'Vira o animal da meta.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['guardiao','paredao','muralha'],conflicts:[]}, reveal:'lines' },
  { k:'muro', n:'Muro', insp:'inspirado em goleiro-muro (real)', pos:['GOL'], blurb:'Posicionado e enorme. Fecha o ângulo.',
    signature:{type:'passive',name:'Fecha Ângulo',ratingBonus:0.19,defAura:0.40,cleanSheetChance:0.14},
    growthBias:{Defesa:1.37,Visão:1.06,Passe:0.94,Finalização:0.70},
    mutate:{at:{gamesCareer:165},k:'muro_fort',n:'Muro Fortaleza',note:'Vira a muralha da meta.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['muralha','carcereiro','guardiao'],conflicts:[]}, reveal:'lines' },
  { k:'relampago_g', n:'Relâmpago G', insp:'inspirado em Pânico (Reflexo)', pos:['GOL'], blurb:'Reflexos relâmpago. Defende o improvável de perna.',
    signature:{type:'passive',name:'Reflexo Relâmpago',ratingBonus:0.18,defAura:0.43,cleanSheetChance:0.15},
    growthBias:{Defesa:1.36,Visão:1.04,Passe:0.92,Finalização:0.68},
    mutate:{at:{gamesCareer:160},k:'relampago_muralha',n:'Relâmpago Muralha',note:'Vira o reflexo impossível.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['paredao','guardiao','muralha'],conflicts:[]}, reveal:'lines' },
  { k:'defensor_visao', n:'Visão de Goleiro', insp:'inspirado em goleiro-com-visão (real)', pos:['GOL'], blurb:'Sai jogando e arma o contra-ataque.',
    signature:{type:'passive',name:'Saída de Goleiro',ratingBonus:0.17,defAura:0.38,cleanSheetChance:0.13,revealSpaces:true},
    growthBias:{Defesa:1.34,Visão:1.18,Passe:1.15,Finalização:0.70},
    mutate:{at:{gamesCareer:175},k:'defensor_oraculo',n:'Goleiro Oráculo',note:'Vira o primeiro armador.',bonus:{guaranteedAssist:1}},
    synergy:{likes:['metavista','regista','guardiao'],conflicts:[]}, reveal:'hybrid' },
  { k:'paredao_muralha', n:'Paredão-Muralha', insp:'genérico — goleiro muralha', pos:['GOL'], blurb:'Segurança absoluta. Raramente é vencido.',
    signature:{type:'passive',name:'Segurança',ratingBonus:0.20,defAura:0.41,cleanSheetChance:0.16},
    growthBias:{Defesa:1.37,Visão:1.03,Passe:0.93,Finalização:0.69},
    mutate:{at:{gamesCareer:168},k:'paredao_intocavel',n:'Paredão Intocável',note:'Vira a meta intransponível.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['muralha','carcereiro','guardiao'],conflicts:[]}, reveal:'lines' },
  { k:'farol', n:'Farol', insp:'inspirado em goleiro-farol (real)', pos:['GOL'], blurb:'Comanda a defesa com a voz e a posição.',
    signature:{type:'passive',name:'Comando de Área',ratingBonus:0.18,defAura:0.39,cleanSheetChance:0.14},
    growthBias:{Defesa:1.35,Visão:1.12,Passe:1.02,Finalização:0.70},
    mutate:{at:{gamesCareer:172},k:'farol_eterno',n:'Farol Eterno',note:'Vira o general da retaguarda.',bonus:{defAura:0.20,cleanSheetChance:0.12}},
    synergy:{likes:['muralha','anchor','carcereiro'],conflicts:[]}, reveal:'lines' }
];

// ---------- helpers ----------
function archetypeById(k){
  if (!k) return null;
  return [...PLAYER_ARCHETYPES, ...MENTAL_ARCHETYPES].find(a => a.k === k || (a.mutate && a.mutate.k === k)) || null;
}
function archetypesForPos(pos){
  // só arquétipos de POSIÇÃO elegíveis (mentais não entram aqui)
  return PLAYER_ARCHETYPES.filter(a => (a.pos||[]).includes(pos));
}
function mentalArchetypes(){
  return MENTAL_ARCHETYPES;
}
function isMental(k){
  return MENTAL_ARCHETYPES.some(a => a.k === k || (a.mutate && a.mutate.k === k));
}
function resolveArchetype(k){
  const base = archetypeById(k);
  if (!base) return null;
  const isMutated = base.mutate && base.mutate.k === k;
  if (isMutated){
    return Object.assign({}, base, {
      n: base.mutate.n,
      blurb: base.mutate.note,
      signature: Object.assign({}, base.signature, base.mutate.bonus || {}),
      _mutated: true
    });
  }
  return base;
}

if (typeof module !== 'undefined' && module.exports){
  module.exports = { PLAYER_ARCHETYPES, MENTAL_ARCHETYPES, archetypeById, archetypesForPos, mentalArchetypes, isMental, resolveArchetype };
}
if (typeof window !== 'undefined'){
  window.PLAYER_ARCHETYPES = PLAYER_ARCHETYPES;
  window.MENTAL_ARCHETYPES = MENTAL_ARCHETYPES;
  window.archetypesForPos = archetypesForPos;
  window.mentalArchetypes = mentalArchetypes;
  window.isMental = isMental;
  window.resolveArchetype = resolveArchetype;
  window.archetypeById = archetypeById;
}
