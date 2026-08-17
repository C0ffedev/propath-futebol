// ===== archetypes.js — Arquétipos de HABILIDADE (Modelo B, evolutivos por posição) =====
// Estende o sistema de "estilos" (SKILLS) já existente em data.js.
// Cada arquétipo destrava: growthBias (viés de treino), signature (habilidade especial),
// mutate (mutação por marco de carreira) e synergy (química com outros arquétipos).
// Revela também uma camada no minimapa (ver main.js -> renderMinimap).
// Mix: jogadores reais (inspirado em), Blue Lock e criações inspiradas em Pânico/Obsessão.

const PLAYER_ARCHETYPES = [
  // ===================== ATA =====================
  {
    k: 'predador',
    n: 'Predador',
    insp: 'Barou / Shidou (Blue Lock)',
    pos: ['ATA'],
    blurb: 'Matador de área. Finaliza qualquer chance — mas vive no limite: alto prêmio, alto risco.',
    signature: {
      type: 'active',
      name: 'Gol de Destaque',
      specialChance: 0.45,
      specialLabel: 'Gol de Destaque do Predador 👹',
      specialVerb: 'explode a rede com um chute impossível',
      missPenalty: 0.4 // se não marca, leva -rating (pressão de não decide)
    },
    growthBias: { Finalização: 1.30, Cabeceio: 1.20, Passe: 0.90, Visão: 0.90 },
    mutate: { at: { goalsCareer: 50 }, k: 'predador_lider', n: 'Predador Líder',
      note: 'Virou líder do ataque: passa a armar os companheiros também.',
      bonus: { assists: 0.20 } }, // ~+20% assist após mutar
    synergy: { likes: ['metavista', 'regista'], conflicts: ['predador'] },
    reveal: 'finish'
  },
  {
    k: 'devorador',
    n: 'Devorador',
    insp: 'Kunigami (Blue Lock)',
    pos: ['ATA'],
    blurb: 'Força bruta e cabeceio. Ganha todas as disputas aéreas e bombeia o time.',
    signature: {
      type: 'active',
      name: 'Cabeçada Devastadora',
      specialChance: 0.35,
      specialLabel: 'Testada do Devorador 💥',
      specialVerb: 'desvia de cabeça imparável',
      // devorador não tem o risco do predador: leve bonus se não marca
      neutralFloor: 0.1
    },
    growthBias: { Cabeceio: 1.35, Finalização: 1.15, Defesa: 1.05, Passe: 0.95 },
    mutate: { at: { goalsCareer: 40 }, k: 'devorador_titã', n: 'Devorador Titã',
      note: 'Virou muralha aérea: domina o jogo aéreo dos dois lados.',
      bonus: { cleanAerial: 1 } },
    synergy: { likes: ['regista', 'anchor'], conflicts: [] },
    reveal: 'finish'
  },
  {
    k: 'ceifador',
    n: 'Ceifador',
    insp: 'inspirado em Pânico/Obsessão (o Ghost)',
    pos: ['ATA'],
    blurb: 'Matador frio e implacável. Aparece do nada e finaliza sem piedade — silencioso, letal.',
    signature: {
      type: 'active',
      name: 'Aparição Fatal',
      specialChance: 0.40,
      specialLabel: 'Aparição Fatal 👻',
      specialVerb: 'surge nas costas da zaga e mata',
      missPenalty: 0.25 // obsessão cobra caro quando erra o alvo
    },
    growthBias: { Finalização: 1.25, Visão: 1.10, Cabeceio: 1.05, Defesa: 0.90 },
    mutate: { at: { goalsCareer: 45 }, k: 'ceifador_sombra', n: 'Ceifador das Sombras',
      note: 'A obsessão virou instinto: aparece em TODAS as jogadas decisivas.',
      bonus: { specialChance: 0.25 } }, // +25% chance de aparição após mutar
    synergy: { likes: ['medium', 'metavista'], conflicts: [] },
    reveal: 'finish'
  },

  // ===================== MEI =====================
  {
    k: 'metavista',
    n: 'Metavisão',
    insp: 'Isagi / Sae (Blue Lock)',
    pos: ['MEI'],
    blurb: 'Cérebro de jogada. Lê o espaço antes de todos e armava os companheiros.',
    signature: {
      type: 'passive',
      name: 'Leitura de Jogo',
      assistBonus: 0.18,
      ratingBonus: 0.25,
      revealSpaces: true
    },
    growthBias: { Visão: 1.35, Passe: 1.20, Defesa: 1.10, Finalização: 1.05 },
    mutate: { at: { assistsCareer: 100 }, k: 'metavista_total', n: 'Metavisão Total',
      note: 'Passa a ler também a defesa adversária: raramente erra a decisão.',
      bonus: { ratingBonus: 0.20 } },
    synergy: { likes: ['regista', 'predador', 'devorador'], conflicts: [] },
    reveal: 'spaces'
  },
  {
    k: 'regista',
    n: 'Regista',
    insp: 'inspirado em Pirlo / Valverde',
    pos: ['VOL', 'MEI'],
    blurb: 'Comandante de meio. Controla o ritmo e destrava o jogo com a passe.',
    signature: {
      type: 'active',
      name: 'Linha de Passe Garantida',
      guaranteedAssist: 1, // 1 assistência garantida por jogo
      specialLabel: 'Enfiada de Genialidade 🧠',
      specialVerb: 'solta uma enfiada que quebra a linha'
    },
    growthBias: { Passe: 1.30, Visão: 1.25, Defesa: 1.15, Finalização: 0.85 },
    mutate: { at: { gamesCareer: 150 }, k: 'regista_mestre', n: 'Regista Mestre',
      note: 'Dobra a frequência de jogadas de classe — meio campo intocável.',
      bonus: { guaranteedAssist: 1 } }, // passa a 2/jogo
    synergy: { likes: ['metavista', 'muralha', 'anchor'], conflicts: [] },
    reveal: 'lines'
  },
  {
    k: 'medium',
    n: 'Médium',
    insp: 'inspirado em Obsessão (o Orquestrador)',
    pos: ['MEI'],
    blurb: 'Orquestrador obcecado. Repete o passe milimetricamente até achar o ângulo perfeito.',
    signature: {
      type: 'passive',
      name: 'Loop Obsessivo',
      assistBonus: 0.22,
      ratingBonus: 0.15,
      revealSpaces: true
    },
    growthBias: { Passe: 1.28, Visão: 1.22, Defesa: 1.05, Finalização: 0.95 },
    mutate: { at: { assistsCareer: 80 }, k: 'medium_absoluto', n: 'Médium Absoluto',
      note: 'A obsessão virou controle total: dita o jogo do primeiro ao último minuto.',
      bonus: { ratingBonus: 0.20 } },
    synergy: { likes: ['regista', 'ceifador', 'metavista'], conflicts: [] },
    reveal: 'spaces'
  },

  // ===================== VOL =====================
  {
    k: 'anchor',
    n: 'Anchor',
    insp: 'inspirado em Kanté',
    pos: ['VOL'],
    blurb: 'Cão de caça. Recupera todas as bolas e protege a zaga sem descanso.',
    signature: {
      type: 'passive',
      name: 'Recuperação Implacável',
      ratingBonus: 0.20,
      defAura: 0.30 // 30% de chance de anular 1 gol sofrido
    },
    growthBias: { Defesa: 1.35, Visão: 1.15, Passe: 1.05, Finalização: 0.80 },
    mutate: { at: { gamesCareer: 200 }, k: 'anchor_muro', n: 'Anchor Muro',
      note: 'Virou um muro: quase nada passa. Recuperação onipresente.',
      bonus: { defAura: 0.20 } }, // sobe a aura defensiva p/ 0.50
    synergy: { likes: ['regista', 'muralha', 'carcereiro'], conflicts: [] },
    reveal: 'lines'
  },
  {
    k: 'tratador',
    n: 'Tratador',
    insp: 'inspirado em Pânico (o Controlador)',
    pos: ['VOL'],
    blurb: 'Controlador frio. Segura a bola, dita o ritmo e sufoca o adversário sem pressa.',
    signature: {
      type: 'passive',
      name: 'Asfixia Tática',
      ratingBonus: 0.18,
      defAura: 0.25,
      cleanSheetChance: 0.10
    },
    growthBias: { Defesa: 1.25, Passe: 1.20, Visão: 1.10, Finalização: 0.85 },
    mutate: { at: { gamesCareer: 120 }, k: 'tratador_sombra', n: 'Tratador da Sombra',
      note: 'A paciência virou domínio absoluto: o jogo acontece onde ele quer.',
      bonus: { defAura: 0.20, cleanSheetChance: 0.10 } },
    synergy: { likes: ['medium', 'anchor', 'muralha'], conflicts: [] },
    reveal: 'lines'
  },

  // ===================== ZAG =====================
  {
    k: 'muralha',
    n: 'Muralha',
    insp: 'inspirado em Van Dijk / Cannavaro',
    pos: ['ZAG'],
    blurb: 'Paredão. Ganha todas as divididas e lê o atacante antes dele pensar.',
    signature: {
      type: 'passive',
      name: 'Barreira Imponente',
      ratingBonus: 0.22,
      defAura: 0.35,
      cleanSheetChance: 0.12
    },
    growthBias: { Defesa: 1.35, Cabeceio: 1.20, Passe: 1.00, Finalização: 0.80 },
    mutate: { at: { gamesCareer: 180 }, k: 'muralha_intocavel', n: 'Muralha Intocável',
      note: 'Ninguém passa: vira referência absoluta da retaguarda.',
      bonus: { defAura: 0.20, cleanSheetChance: 0.10 } },
    synergy: { likes: ['anchor', 'regista', 'tratador'], conflicts: [] },
    reveal: 'lines'
  },
  {
    k: 'carcereiro',
    n: 'Carcereiro',
    insp: 'inspirado em Pânico (o Tranca)',
    pos: ['ZAG'],
    blurb: 'Tranca e não solta. Marca por tabela e sufoca o atacante no bolso.',
    signature: {
      type: 'passive',
      name: 'Prisão Tática',
      ratingBonus: 0.18,
      defAura: 0.30,
      cleanSheetChance: 0.14
    },
    growthBias: { Defesa: 1.30, Cabeceio: 1.15, Visão: 1.05, Passe: 0.90 },
    mutate: { at: { gamesCareer: 140 }, k: 'carcereiro_eterno', n: 'Carcereiro Eterno',
      note: 'Nenhum atacante escapa: a marcação vira sentença.',
      bonus: { defAura: 0.20, cleanSheetChance: 0.12 } },
    synergy: { likes: ['anchor', 'tratador', 'muralha'], conflicts: [] },
    reveal: 'lines'
  },

  // ===================== LAT =====================
  {
    k: 'inverted_wing',
    n: 'Ala Invertido',
    insp: 'inspirado em Roberto Carlos',
    pos: ['LAT'],
    blurb: 'Sobe e desce a linha inteira. Cruzamento e chute de longe são armas.',
    signature: {
      type: 'active',
      name: 'Cruzamento de Ouro',
      guaranteedAssist: 1,
      specialLabel: 'Cruzamento de Ouro ⚡',
      specialVerb: 'mete uma bola na cabeça do companheiro'
    },
    growthBias: { Passe: 1.25, Visão: 1.15, Defesa: 1.10, Finalização: 1.00 },
    mutate: { at: { gamesCareer: 160 }, k: 'inverted_wing_lenda', n: 'Ala Lenda',
      note: 'Vira arma de dois tempos: defende, sobe e decide.',
      bonus: { guaranteedAssist: 1 } },
    synergy: { likes: ['regista', 'predador', 'devorador'], conflicts: [] },
    reveal: 'lines'
  },
  {
    k: 'ala_fantasma',
    n: 'Ala-Fantasma',
    insp: 'inspirado em Pânico (o Espectro)',
    pos: ['LAT'],
    blurb: 'Sobreposições assombrosas. Aparece no ataque do nada e some na defesa.',
    signature: {
      type: 'active',
      name: 'Sobreposição Fantasma',
      guaranteedAssist: 1,
      specialLabel: 'Sobreposição Fantasma 👻',
      specialVerb: 'surge na linha de fundo e cruza'
    },
    growthBias: { Passe: 1.20, Visão: 1.20, Defesa: 1.05, Finalização: 0.95 },
    mutate: { at: { gamesCareer: 130 }, k: 'ala_fantasma_etereo', n: 'Ala Etéreo',
      note: 'A assombração vira onipresença: está em todo lance.',
      bonus: { guaranteedAssist: 1 } },
    synergy: { likes: ['medium', 'ceifador', 'metavista'], conflicts: [] },
    reveal: 'lines'
  },

  // ===================== GOL =====================
  {
    k: 'guardiao',
    n: 'Guardião',
    insp: 'inspirado em Neuer',
    pos: ['GOL'],
    blurb: 'Goleiro-líbero. Sai do gol, comanda a área e defende o improvável.',
    signature: {
      type: 'passive',
      name: 'Muralha Viva',
      ratingBonus: 0.25,
      defAura: 0.40, // goleiro com maior aura
      cleanSheetChance: 0.18
    },
    growthBias: { Defesa: 1.40, Visão: 1.10, Passe: 1.05, Finalização: 0.70 },
    mutate: { at: { gamesCareer: 200 }, k: 'guardiao_absoluto', n: 'Guardião Absoluto',
      note: 'Vira o último homem intransponível: defesas milagrosas toda semana.',
      bonus: { defAura: 0.20, cleanSheetChance: 0.12 } },
    synergy: { likes: ['muralha', 'carcereiro', 'anchor'], conflicts: [] },
    reveal: 'lines'
  },
  {
    k: 'paredao',
    n: 'Paredão',
    insp: 'inspirado em Obsessão (o Muro Impossível)',
    pos: ['GOL'],
    blurb: 'Paredão impossível. Reflexo sobrenatural e presença que intimida.',
    signature: {
      type: 'passive',
      name: 'Muro Impossível',
      ratingBonus: 0.20,
      defAura: 0.45,
      cleanSheetChance: 0.15
    },
    growthBias: { Defesa: 1.38, Visão: 1.05, Passe: 0.95, Finalização: 0.70 },
    mutate: { at: { gamesCareer: 170 }, k: 'paredao_templo', n: 'Paredão Templo',
      note: 'A obsessão virou santuario: nada entra.',
      bonus: { defAura: 0.20, cleanSheetChance: 0.13 } },
    synergy: { likes: ['muralha', 'carcereiro', 'tratador'], conflicts: [] },
    reveal: 'lines'
  }
];

// helper: acha arquétipo por chave (base ou mutado)
function archetypeById(k){
  if (!k) return null;
  return PLAYER_ARCHETYPES.find(a => a.k === k || (a.mutate && a.mutate.k === k)) || null;
}
// helper: arquétipos elegíveis para uma posição
function archetypesForPos(pos){
  return PLAYER_ARCHETYPES.filter(a => (a.pos||[]).includes(pos));
}
// helper: se o arquétipo sofreu mutação, devolve a forma mutada (merge)
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
