/**
 * PT-BR Phonetic Matcher
 * Multi-criteria scoring engine with reasoning and context-aware weights.
 * Ported from src/matchers/reasoning_matcher.py with full transparency.
 */

import { isVowel, isConsonant, extractVowels, extractConsonants } from './analyzer.js';

// --- Context weight presets ---

const WEIGHT_PRESETS = {
  general: {
    label: 'Geral',
    prosodic: 0.25,
    tonic_core: 0.45,
    phonetic: 0.20,
    morphological: 0.10,
  },
  strict_rhyme: {
    label: 'Rima Estrita',
    prosodic: 0.20,
    tonic_core: 0.50,
    phonetic: 0.25,
    morphological: 0.05,
  },
  assonance: {
    label: 'Assonância',
    prosodic: 0.20,
    tonic_core: 0.35,
    phonetic: 0.35,
    morphological: 0.10,
  },
  hip_hop: {
    label: 'Hip-Hop',
    prosodic: 0.30,
    tonic_core: 0.30,
    phonetic: 0.25,
    morphological: 0.15,
  },
};

// --- Similar suffix pairs (morphological near-matches) ---

const SIMILAR_SUFFIX_PAIRS = [
  ['ado', 'ato'], ['ada', 'ata'],
  ['ido', 'ito'], ['ida', 'ita'],
  ['oso', 'osa'], ['dor', 'dora'],
  ['eiro', 'eira'], ['ção', 'são'],
];

function areSimilarSuffixes(a, b) {
  if (!a || !b) return false;
  return SIMILAR_SUFFIX_PAIRS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x)
  );
}

// --- Scoring level thresholds ---

function getLevel(score) {
  if (score >= 0.90) return 'perfect';
  if (score >= 0.75) return 'strong';
  if (score >= 0.60) return 'good';
  if (score >= 0.40) return 'weak';
  if (score >= 0.20) return 'poor';
  return 'none';
}

function getLevelLabel(level) {
  const labels = {
    perfect: 'Perfeita',
    strong: 'Forte',
    good: 'Boa',
    weak: 'Fraca',
    poor: 'Pobre',
    none: 'Nenhuma',
  };
  return labels[level] || level;
}

// --- Utility: sequence similarity ---

function sequenceSimilarity(a, b) {
  if (!a.length || !b.length) return 0;
  let matches = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

// --- Dimension 1: Prosodic ---

function scoreProsody(m, c) {
  let score = 0;
  const checks = [];

  // Stress type match
  if (m.stressType === c.stressType) {
    score += 0.4;
    checks.push({ pass: true, text: `Mesmo tipo: ${m.stressType}` });
  } else if (m.t === c.t) {
    // Fallback: compact stress type
    score += 0.4;
    checks.push({ pass: true, text: `Mesmo tipo acentual` });
  } else {
    const mType = m.stressType || m.t;
    const cType = c.stressType || c.t;
    checks.push({ pass: false, text: `Tipo diferente: ${mType} vs ${cType}` });
  }

  // Syllable count
  const mN = m.n, cN = c.n;
  if (mN === cN) {
    score += 0.3;
    checks.push({ pass: true, text: `Mesma contagem silábica (${mN})` });
  } else {
    const diff = Math.abs(mN - cN);
    const partial = 0.3 / (1 + diff);
    score += partial;
    checks.push({ pass: null, text: `Sílabas: ${mN} vs ${cN}` });
  }

  // Stress position from end
  const mPos = m.stressFromEnd || m.n - (m.stressIndex ?? (m.n - 1));
  const cPos = c.stressFromEnd || c.n - (c.stressIndex ?? (c.n - 1));
  if (mPos === cPos) {
    score += 0.3;
    checks.push({ pass: true, text: `Mesma posição tônica (${mPos}a do fim)` });
  } else {
    const diff = Math.abs(mPos - cPos);
    const partial = 0.3 / (1 + diff);
    score += partial;
    checks.push({ pass: null, text: `Posição tônica: ${mPos}a vs ${cPos}a do fim` });
  }

  return { score: Math.min(score, 1), checks };
}

// --- Dimension 2: Tonic Core ---

function scoreTonic(m, c) {
  let score = 0;
  const checks = [];

  // Full tonic syllable match = jackpot
  const mTonic = m.tonicSyllable || (m.s && m.s[m.stressIndex]);
  const cTonic = c.tonicSyllable || (c.s && c.s[c.stressIndex]);

  if (mTonic && cTonic && mTonic === cTonic) {
    checks.push({ pass: true, text: `Sílaba tônica idêntica: "${mTonic}"` });
    return { score: 1.0, checks };
  }

  // Rhyme key match = very strong
  if (m.r === c.r) {
    score = 0.95;
    checks.push({ pass: true, text: `Chave de rima idêntica: "-${m.r}"` });
    return { score, checks };
  }

  // Tonic vowel match
  if (m.v === c.v) {
    score += 0.45;
    checks.push({ pass: true, text: `Vogal tônica: "${m.v}"` });
  } else {
    checks.push({ pass: false, text: `Vogais tônicas diferentes: "${m.v}" vs "${c.v}"` });
  }

  // Ending similarity (rhyme key suffix)
  const mEnd3 = m.r ? m.r.slice(-3) : '';
  const cEnd3 = c.r ? c.r.slice(-3) : '';
  const mEnd2 = m.r ? m.r.slice(-2) : '';
  const cEnd2 = c.r ? c.r.slice(-2) : '';
  const mEnd1 = m.r ? m.r.slice(-1) : '';
  const cEnd1 = c.r ? c.r.slice(-1) : '';

  if (mEnd3.length >= 3 && mEnd3 === cEnd3) {
    score += 0.4;
    checks.push({ pass: true, text: `Terminação idêntica: "-${mEnd3}"` });
  } else if (mEnd2.length >= 2 && mEnd2 === cEnd2) {
    score += 0.3;
    checks.push({ pass: true, text: `Terminação parcial: "-${mEnd2}"` });
  } else if (mEnd1 === cEnd1) {
    score += 0.1;
    checks.push({ pass: null, text: `Letra final: "${mEnd1}"` });
  } else {
    checks.push({ pass: false, text: `Terminações diferentes: "-${mEnd2}" vs "-${cEnd2}"` });
  }

  // Tonic consonant
  const mC = m.tonicConsonant;
  const cC = c.tonicConsonant;
  if (mC && cC && mC === cC) {
    score += 0.1;
    checks.push({ pass: true, text: `Consoante tônica: "${mC}"` });
  } else if (mC && cC) {
    checks.push({ pass: null, text: `Consoantes tônicas: "${mC}" vs "${cC}"` });
  }

  return { score: Math.min(score, 1), checks };
}

// --- Dimension 3: Phonetic Patterns ---

function scorePhonetic(m, c) {
  let score = 0;
  const checks = [];

  // Word ending match (last 2-3 chars of word)
  const mw = m.w, cw = c.w;
  if (mw.length >= 3 && cw.length >= 3 && mw.slice(-3) === cw.slice(-3)) {
    score += 0.35;
    checks.push({ pass: true, text: `Terminação: "-${mw.slice(-3)}"` });
  } else if (mw.length >= 2 && cw.length >= 2 && mw.slice(-2) === cw.slice(-2)) {
    score += 0.25;
    checks.push({ pass: true, text: `Terminação: "-${mw.slice(-2)}"` });
  } else if (mw.slice(-1) === cw.slice(-1)) {
    score += 0.1;
    checks.push({ pass: null, text: `Letra final: "${mw.slice(-1)}"` });
  } else {
    checks.push({ pass: false, text: `Terminações diferentes: "-${mw.slice(-2)}" vs "-${cw.slice(-2)}"` });
  }

  // Vowel pattern similarity
  const mVowels = m.vowelSequence || extractVowels(mw);
  const cVowels = c.vowelSequence || extractVowels(cw);
  const vSim = sequenceSimilarity(mVowels, cVowels);
  score += vSim * 0.35;
  checks.push({
    pass: vSim >= 0.5 ? true : vSim >= 0.25 ? null : false,
    text: `Padrão vocálico: ${mVowels.join('')} vs ${cVowels.join('')} (${Math.round(vSim * 100)}%)`,
  });

  // Consonant overlap
  const mCons = new Set(m.consonantSequence || extractConsonants(mw));
  const cCons = new Set(c.consonantSequence || extractConsonants(cw));
  if (mCons.size > 0 && cCons.size > 0) {
    let overlap = 0;
    for (const ch of mCons) if (cCons.has(ch)) overlap++;
    const ratio = overlap / Math.max(mCons.size, cCons.size);
    score += ratio * 0.3;
    checks.push({
      pass: ratio >= 0.5 ? true : ratio >= 0.25 ? null : false,
      text: `Sobreposição consonantal: ${overlap}/${Math.max(mCons.size, cCons.size)} (${Math.round(ratio * 100)}%)`,
    });
  }

  return { score: Math.min(score, 1), checks };
}

// --- Dimension 4: Morphological ---

function scoreMorphology(m, c) {
  let score = 0;
  const checks = [];

  // Prefix match
  const mPre = m.prefix, cPre = c.prefix;
  if (mPre && cPre && mPre === cPre) {
    score += 0.5;
    checks.push({ pass: true, text: `Prefixo compartilhado: "${mPre}-"` });
  } else if (mPre || cPre) {
    checks.push({ pass: null, text: `Prefixos: "${mPre || '—'}" vs "${cPre || '—'}"` });
  }

  // Suffix match
  const mSuf = m.suffix, cSuf = c.suffix;
  if (mSuf && cSuf && mSuf === cSuf) {
    score += 0.5;
    checks.push({ pass: true, text: `Sufixo compartilhado: "-${mSuf}"` });
  } else if (mSuf && cSuf && areSimilarSuffixes(mSuf, cSuf)) {
    score += 0.3;
    checks.push({ pass: null, text: `Sufixos semelhantes: "-${mSuf}" vs "-${cSuf}"` });
  } else if (mSuf || cSuf) {
    checks.push({ pass: false, text: `Sufixos: "-${mSuf || '—'}" vs "-${cSuf || '—'}"` });
  }

  // If neither word has morphological features
  if (checks.length === 0) {
    checks.push({ pass: null, text: 'Sem traços morfológicos detectados' });
  }

  return { score: Math.min(score, 1), checks };
}

// --- Main scoring function ---

/**
 * Score how well two word entries match phonetically.
 * Both entries should be the full analysis objects from analyze().
 * Pre-indexed entries (compact format) are also supported via fallbacks.
 *
 * @param {object} mother - analyzed mother word
 * @param {object} candidate - analyzed candidate word
 * @param {string} context - weight preset key (default: 'general')
 * @returns {object} full match result with dimensions, reasoning, score
 */
function scorePair(mother, candidate, context = 'general') {
  const weights = WEIGHT_PRESETS[context] || WEIGHT_PRESETS.general;

  const prosodic = scoreProsody(mother, candidate);
  const tonic = scoreTonic(mother, candidate);
  const phonetic = scorePhonetic(mother, candidate);
  const morphological = scoreMorphology(mother, candidate);

  const total = Math.min(1,
    prosodic.score * weights.prosodic +
    tonic.score * weights.tonic_core +
    phonetic.score * weights.phonetic +
    morphological.score * weights.morphological
  );

  const level = getLevel(total);

  return {
    word: candidate.w,
    total: Math.round(total * 1000) / 1000,
    level,
    levelLabel: getLevelLabel(level),
    context,
    contextLabel: weights.label,
    dimensions: [
      {
        name: 'Prosódica',
        key: 'prosodic',
        description: 'Ritmo e acentuação',
        score: Math.round(prosodic.score * 1000) / 1000,
        weight: weights.prosodic,
        weighted: Math.round(prosodic.score * weights.prosodic * 1000) / 1000,
        checks: prosodic.checks,
      },
      {
        name: 'Núcleo Tônico',
        key: 'tonic_core',
        description: 'Sílaba tônica e terminação',
        score: Math.round(tonic.score * 1000) / 1000,
        weight: weights.tonic_core,
        weighted: Math.round(tonic.score * weights.tonic_core * 1000) / 1000,
        checks: tonic.checks,
      },
      {
        name: 'Padrões Fonéticos',
        key: 'phonetic',
        description: 'Sequências vocálicas e consonantais',
        score: Math.round(phonetic.score * 1000) / 1000,
        weight: weights.phonetic,
        weighted: Math.round(phonetic.score * weights.phonetic * 1000) / 1000,
        checks: phonetic.checks,
      },
      {
        name: 'Morfológica',
        key: 'morphological',
        description: 'Prefixos e sufixos',
        score: Math.round(morphological.score * 1000) / 1000,
        weight: weights.morphological,
        weighted: Math.round(morphological.score * weights.morphological * 1000) / 1000,
        checks: morphological.checks,
      },
    ],
  };
}

/**
 * Rank candidates by match score against a mother word.
 * Uses 'general' context for ranking (Compare view uses per-pair context).
 */
function rankCandidates(mother, candidates, context = 'general') {
  return candidates
    .filter(c => c.w !== mother.w)
    .map(c => scorePair(mother, c, context))
    .sort((a, b) => b.total - a.total);
}

export { scorePair, rankCandidates, getLevel, getLevelLabel, WEIGHT_PRESETS };
