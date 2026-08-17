// ===== archetypes.js — Arquétipos de HABILIDADE (Modelo B, evolutivos por posição) =====
// Estende o sistema de "estilos" (SKILLS) já existente em data.js.
// Cada arquétipo destrava: growthBias (viés de treino), signature (habilidade especial),
// mutate (mutação por marco de carreira) e synergy (química com outros arquétipos).
// Revela também uma camada no minimapa (ver main.js -> renderMinimap).

const PLAYER_ARCHETYPES = [
  {
    k: 'predador',
    n: 'Predador',
    insp: 'Barou / Shidou (Blue Lock)',
    pos: ['ATA'],
    blurb: 'Matador de área. Finaliza qualquer chance — mas vive no limite: alto prêmio, alto risco.',
    signature: {
      type: 'active',
      name: 'Gol de Destaque',
      // chance extra (por jogo) de gerar um gol especial "golaco"
      specialChance: 0.45,
      specialLabel: 'Gol de Destaque do Predador 👹',
      specialVerb: 'explode a rede com um chute impossível',
      // contraponto: se não marca, leva -rating leve (pressão de não decide)
      missPenalty: 0.4,
      cooldown: 1 // no máx 1 por jogo garantido; o extra é probabilístico
    },
    growthBias: { Finalização: 1.30, Cabeceio: 1.20, Passe: 0.90, Visão: 0.90 },
    mutate: { at: { goalsCareer: 50 }, k: 'predador_lider', n: 'Predador Líder',
      note: 'Virou líder do ataque: ganha +assistências e recupera de jogos sem gol.',
      bonus: { assists: 0.15 } },
    synergy: { likes: ['metavista'], conflicts: ['predador'] },
    reveal: 'finish' // minimapa destaca a zona de finalização
  },
  {
    k: 'metavista',
    n: 'Metavisão',
    insp: 'Isagi / Sae (Blue Lock)',
    pos: ['MEI'],
    blurb: 'Cérebro de jogada. Lê o espaço antes de todos e armava os companheiros.',
    signature: {
      type: 'passive',
      name: 'Leitura de Jogo',
      // +leitura: sobe assist e rating todo jogo
      assistBonus: 0.18,
      ratingBonus: 0.25,
      // revela espaços no minimapa
      revealSpaces: true
    },
    growthBias: { Visão: 1.35, Passe: 1.20, Defesa: 1.10, Finalização: 1.05 },
    mutate: { at: { assistsCareer: 100 }, k: 'metavista_total', n: 'Metavisão Total',
      note: 'Passa a ler também a defesa adversária: raramente erra a decisão.',
      bonus: { ratingBonus: 0.20, errCut: 0.5 } },
    synergy: { likes: ['regista', 'predador'], conflicts: [] },
    reveal: 'spaces' // minimapa mostra os vãos da defesa
  },
  {
    k: 'regista',
    n: 'Regista',
    insp: 'Pirlo / Valverde (real)',
    pos: ['VOL', 'MEI'],
    blurb: 'Comandante de meio. Controla o ritmo e destrava o jogo com a passe.',
    signature: {
      type: 'active',
      name: 'Linha de Passe Garantida',
      // 1 assistência garantida por jogo (se ainda não tiver assistido)
      guaranteedAssist: 1,
      specialLabel: 'Enfiada de Genialidade 🧠',
      specialVerb: 'solta uma enfiada que quebra a linha'
    },
    growthBias: { Passe: 1.30, Visão: 1.25, Defesa: 1.15, Finalização: 0.85 },
    mutate: { at: { gamesCareer: 150 }, k: 'regista_mestre', n: 'Regista Mestre',
      note: 'Dobra a frequência de jogadas de classe — meio campo intocável.',
      bonus: { guaranteedAssist: 1 } }, // passa a 2/jogo
    synergy: { likes: ['metavista', 'muralha'], conflicts: [] },
    reveal: 'lines' // minimapa desenha linhas de passe
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
  // se k é a forma mutada, devolve ela com os dados da base + bonus
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
