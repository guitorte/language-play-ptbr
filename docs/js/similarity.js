/**
 * Word Similarity Engine
 * Multi-criteria scoring that combines orthographic, phonetic, structural,
 * and morphological similarity — fundamentally different from rhyme matching.
 *
 * The rhyme matcher optimizes for tonic core / ending match.
 * This module optimizes for overall word resemblance: edit distance,
 * shared character sequences, structural shape, and sound patterns.
 */

import { analyze, isVowel, isConsonant } from './analyzer.js';

// --- Weights for composite similarity scoring ---

const SIM_WEIGHTS = {
  orthographic: 0.40,   // Edit distance + n-gram overlap
  phonetic:     0.25,   // Vowel/consonant pattern similarity
  structural:   0.20,   // Length, syllable count, stress type
  morphological: 0.15,  // Shared prefix/suffix
};

// --- Levenshtein edit distance ---

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP for memory efficiency
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Normalized edit distance: 0 = identical, 1 = completely different.
 * Inverted for similarity: 1 = identical, 0 = completely different.
 */
function editSimilarity(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// --- Character n-gram overlap (Jaccard similarity) ---

function ngrams(word, n) {
  const set = new Set();
  for (let i = 0; i <= word.length - n; i++) {
    set.add(word.slice(i, i + n));
  }
  return set;
}

function ngramJaccard(a, b, n) {
  const setA = ngrams(a, n);
  const setB = ngrams(b, n);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const g of setA) if (setB.has(g)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// --- Longest Common Substring ratio ---

function lcsLength(a, b) {
  const m = a.length, n = b.length;
  if (m === 0 || n === 0) return 0;

  let maxLen = 0;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
        if (curr[j] > maxLen) maxLen = curr[j];
      } else {
        curr[j] = 0;
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }
  return maxLen;
}

function lcsRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return lcsLength(a, b) / maxLen;
}

// --- Sequence similarity (positional match ratio) ---

function sequenceSimilarity(a, b) {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  let matches = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

// --- Cheap pre-filter score (strings only, no phonetic analysis) ---

/**
 * Fast approximate similarity for pre-filtering.
 * Only uses string operations — no syllabification or analysis needed.
 * Returns 0-1 where higher = more similar.
 */
function quickSimilarity(a, b) {
  if (a === b) return 1;

  // 1. Bigram Jaccard (fast, captures shared substrings)
  const bigram = ngramJaccard(a, b, 2);

  // 2. Length ratio (penalize large length differences)
  const lenRatio = Math.min(a.length, b.length) / Math.max(a.length, b.length);

  // 3. Shared prefix bonus
  let prefixLen = 0;
  const minLen = Math.min(a.length, b.length);
  while (prefixLen < minLen && a[prefixLen] === b[prefixLen]) prefixLen++;
  const prefixRatio = prefixLen / Math.max(a.length, b.length);

  // 4. Shared suffix bonus
  let suffixLen = 0;
  while (suffixLen < minLen && a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]) suffixLen++;
  const suffixRatio = suffixLen / Math.max(a.length, b.length);

  // Weighted combination
  return bigram * 0.45 + lenRatio * 0.20 + prefixRatio * 0.20 + suffixRatio * 0.15;
}

// --- Full multi-dimensional similarity scoring ---

/**
 * Dimension 1: Orthographic similarity
 * Edit distance, n-gram overlap, longest common substring.
 */
function scoreOrthographic(wa, wb) {
  const checks = [];
  let score = 0;

  // Edit distance
  const editDist = levenshtein(wa, wb);
  const editSim = editSimilarity(wa, wb);
  score += editSim * 0.40;
  checks.push({
    pass: editDist <= 1 ? true : editDist <= 3 ? null : false,
    text: `Distância de edição: ${editDist} (${Math.round(editSim * 100)}% similar)`,
  });

  // Bigram overlap
  const bg = ngramJaccard(wa, wb, 2);
  score += bg * 0.25;
  checks.push({
    pass: bg >= 0.5 ? true : bg >= 0.25 ? null : false,
    text: `Bigramas compartilhados: ${Math.round(bg * 100)}%`,
  });

  // Longest common substring
  const lcs = lcsRatio(wa, wb);
  score += lcs * 0.20;
  const lcsLen = lcsLength(wa, wb);
  checks.push({
    pass: lcs >= 0.5 ? true : lcs >= 0.3 ? null : false,
    text: `Maior substring comum: ${lcsLen} caracteres (${Math.round(lcs * 100)}%)`,
  });

  // Trigram overlap
  const tg = ngramJaccard(wa, wb, 3);
  score += tg * 0.15;
  checks.push({
    pass: tg >= 0.4 ? true : tg >= 0.2 ? null : false,
    text: `Trigramas compartilhados: ${Math.round(tg * 100)}%`,
  });

  return { score: Math.min(score, 1), checks };
}

/**
 * Dimension 2: Phonetic similarity
 * Vowel sequence, consonant overlap, tonic vowel.
 */
function scorePhonetic(a, b) {
  const checks = [];
  let score = 0;

  // Vowel sequence similarity
  const aVowels = a.vowelSequence || [];
  const bVowels = b.vowelSequence || [];
  const vSim = sequenceSimilarity(aVowels, bVowels);
  score += vSim * 0.35;
  checks.push({
    pass: vSim >= 0.6 ? true : vSim >= 0.3 ? null : false,
    text: `Padrão vocálico: ${aVowels.join('')} vs ${bVowels.join('')} (${Math.round(vSim * 100)}%)`,
  });

  // Consonant set overlap
  const aCons = new Set(a.consonantSequence || []);
  const bCons = new Set(b.consonantSequence || []);
  if (aCons.size > 0 && bCons.size > 0) {
    let overlap = 0;
    for (const c of aCons) if (bCons.has(c)) overlap++;
    const ratio = overlap / Math.max(aCons.size, bCons.size);
    score += ratio * 0.30;
    checks.push({
      pass: ratio >= 0.6 ? true : ratio >= 0.3 ? null : false,
      text: `Consoantes compartilhadas: ${overlap}/${Math.max(aCons.size, bCons.size)} (${Math.round(ratio * 100)}%)`,
    });
  } else {
    checks.push({ pass: null, text: 'Sem consoantes para comparar' });
  }

  // Tonic vowel match
  if (a.v && b.v) {
    if (a.v === b.v) {
      score += 0.20;
      checks.push({ pass: true, text: `Vogal tônica: "${a.v}"` });
    } else {
      checks.push({ pass: false, text: `Vogais tônicas: "${a.v}" vs "${b.v}"` });
    }
  }

  // Consonant sequence positional similarity
  const aConsSeq = a.consonantSequence || [];
  const bConsSeq = b.consonantSequence || [];
  const cSeqSim = sequenceSimilarity(aConsSeq, bConsSeq);
  score += cSeqSim * 0.15;
  checks.push({
    pass: cSeqSim >= 0.5 ? true : cSeqSim >= 0.25 ? null : false,
    text: `Sequência consonantal: ${aConsSeq.join('')} vs ${bConsSeq.join('')} (${Math.round(cSeqSim * 100)}%)`,
  });

  return { score: Math.min(score, 1), checks };
}

/**
 * Dimension 3: Structural similarity
 * Length ratio, syllable count, stress type.
 */
function scoreStructural(a, b) {
  const checks = [];
  let score = 0;

  // Length ratio
  const lenRatio = Math.min(a.w.length, b.w.length) / Math.max(a.w.length, b.w.length);
  score += lenRatio * 0.35;
  checks.push({
    pass: lenRatio >= 0.8 ? true : lenRatio >= 0.6 ? null : false,
    text: `Comprimento: ${a.w.length} vs ${b.w.length} caracteres (${Math.round(lenRatio * 100)}%)`,
  });

  // Syllable count
  if (a.n === b.n) {
    score += 0.30;
    checks.push({ pass: true, text: `Mesma contagem silábica (${a.n})` });
  } else {
    const diff = Math.abs(a.n - b.n);
    const partial = 0.30 / (1 + diff);
    score += partial;
    checks.push({
      pass: diff <= 1 ? null : false,
      text: `Sílabas: ${a.n} vs ${b.n}`,
    });
  }

  // Stress type match
  const aType = a.stressType || a.t;
  const bType = b.stressType || b.t;
  if (aType === bType || a.t === b.t) {
    score += 0.35;
    checks.push({ pass: true, text: `Mesmo tipo acentual: ${aType}` });
  } else {
    checks.push({ pass: false, text: `Acentuação: ${aType} vs ${bType}` });
  }

  return { score: Math.min(score, 1), checks };
}

/**
 * Dimension 4: Morphological similarity
 * Shared prefix, suffix.
 */
function scoreMorphological(a, b) {
  const checks = [];
  let score = 0;

  // Shared prefix (raw character prefix, not just detected morphological prefix)
  let prefixLen = 0;
  const minLen = Math.min(a.w.length, b.w.length);
  while (prefixLen < minLen && a.w[prefixLen] === b.w[prefixLen]) prefixLen++;
  if (prefixLen >= 3) {
    const prefixRatio = prefixLen / Math.max(a.w.length, b.w.length);
    score += Math.min(prefixRatio * 0.6, 0.40);
    checks.push({
      pass: prefixLen >= 4 ? true : null,
      text: `Prefixo comum: "${a.w.slice(0, prefixLen)}" (${prefixLen} caracteres)`,
    });
  } else if (prefixLen >= 1) {
    checks.push({ pass: null, text: `Início comum: "${a.w.slice(0, prefixLen)}" (${prefixLen} car.)` });
  } else {
    checks.push({ pass: false, text: 'Sem prefixo comum' });
  }

  // Shared suffix (raw character suffix)
  let suffixLen = 0;
  while (suffixLen < minLen && a.w[a.w.length - 1 - suffixLen] === b.w[b.w.length - 1 - suffixLen]) suffixLen++;
  if (suffixLen >= 3) {
    const suffixRatio = suffixLen / Math.max(a.w.length, b.w.length);
    score += Math.min(suffixRatio * 0.6, 0.40);
    checks.push({
      pass: suffixLen >= 4 ? true : null,
      text: `Sufixo comum: "-${a.w.slice(-suffixLen)}" (${suffixLen} caracteres)`,
    });
  } else if (suffixLen >= 1) {
    score += 0.05;
    checks.push({ pass: null, text: `Final comum: "-${a.w.slice(-suffixLen)}" (${suffixLen} car.)` });
  } else {
    checks.push({ pass: false, text: 'Sem sufixo comum' });
  }

  // Morphological prefix/suffix (detected by analyzer)
  if (a.prefix && b.prefix && a.prefix === b.prefix) {
    score += 0.15;
    checks.push({ pass: true, text: `Prefixo morfológico: "${a.prefix}-"` });
  }
  if (a.suffix && b.suffix && a.suffix === b.suffix) {
    score += 0.15;
    checks.push({ pass: true, text: `Sufixo morfológico: "-${a.suffix}"` });
  }

  return { score: Math.min(score, 1), checks };
}

// --- Similarity level thresholds ---

function getSimLevel(score) {
  if (score >= 0.80) return 'very_high';
  if (score >= 0.60) return 'high';
  if (score >= 0.45) return 'moderate';
  if (score >= 0.30) return 'low';
  if (score >= 0.15) return 'very_low';
  return 'none';
}

function getSimLevelLabel(level) {
  const labels = {
    very_high: 'Muito Alta',
    high: 'Alta',
    moderate: 'Moderada',
    low: 'Baixa',
    very_low: 'Muito Baixa',
    none: 'Nenhuma',
  };
  return labels[level] || level;
}

// --- Main scoring entry point ---

/**
 * Compute full similarity between two analyzed words.
 * Both should be results of analyze().
 */
function scoreSimilarity(a, b) {
  const orthographic = scoreOrthographic(a.w, b.w);
  const phonetic = scorePhonetic(a, b);
  const structural = scoreStructural(a, b);
  const morphological = scoreMorphological(a, b);

  const total = Math.min(1,
    orthographic.score * SIM_WEIGHTS.orthographic +
    phonetic.score * SIM_WEIGHTS.phonetic +
    structural.score * SIM_WEIGHTS.structural +
    morphological.score * SIM_WEIGHTS.morphological
  );

  const level = getSimLevel(total);

  return {
    word: b.w,
    total: Math.round(total * 1000) / 1000,
    level,
    levelLabel: getSimLevelLabel(level),
    dimensions: [
      {
        name: 'Ortográfica',
        key: 'orthographic',
        description: 'Distância de edição e n-gramas',
        score: Math.round(orthographic.score * 1000) / 1000,
        weight: SIM_WEIGHTS.orthographic,
        weighted: Math.round(orthographic.score * SIM_WEIGHTS.orthographic * 1000) / 1000,
        checks: orthographic.checks,
      },
      {
        name: 'Fonética',
        key: 'phonetic',
        description: 'Padrões vocálicos e consonantais',
        score: Math.round(phonetic.score * 1000) / 1000,
        weight: SIM_WEIGHTS.phonetic,
        weighted: Math.round(phonetic.score * SIM_WEIGHTS.phonetic * 1000) / 1000,
        checks: phonetic.checks,
      },
      {
        name: 'Estrutural',
        key: 'structural',
        description: 'Comprimento, sílabas, acentuação',
        score: Math.round(structural.score * 1000) / 1000,
        weight: SIM_WEIGHTS.structural,
        weighted: Math.round(structural.score * SIM_WEIGHTS.structural * 1000) / 1000,
        checks: structural.checks,
      },
      {
        name: 'Morfológica',
        key: 'morphological',
        description: 'Prefixos e sufixos compartilhados',
        score: Math.round(morphological.score * 1000) / 1000,
        weight: SIM_WEIGHTS.morphological,
        weighted: Math.round(morphological.score * SIM_WEIGHTS.morphological * 1000) / 1000,
        checks: morphological.checks,
      },
    ],
  };
}

/**
 * Two-phase similarity search over a word list.
 *
 * Phase 1: Fast pre-filter using cheap string metrics (no analysis needed).
 *          Scans the full autocomplete array (~40k words). ~5ms on modern browsers.
 * Phase 2: Full multi-dimensional scoring for top candidates using analyze().
 *          Only ~200 words get the expensive treatment.
 *
 * @param {string} queryWord - input word
 * @param {string[]} allWords - the autocomplete array
 * @param {object} opts - { maxResults, prefilterSize }
 * @returns {object} { query, results }
 */
function searchSimilar(queryWord, allWords, opts = {}) {
  const maxResults = opts.maxResults || 30;
  const prefilterSize = opts.prefilterSize || 200;

  queryWord = queryWord.toLowerCase().trim();
  const queryAnalysis = analyze(queryWord);

  // Phase 1: Pre-filter using cheap string similarity
  const candidates = [];
  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i];
    if (w === queryWord) continue;

    // Quick length pre-check: skip words that are wildly different in length
    const lenDiff = Math.abs(w.length - queryWord.length);
    if (lenDiff > 6) continue;

    const qs = quickSimilarity(queryWord, w);
    if (qs > 0.10) { // minimum threshold to even consider
      candidates.push({ word: w, quick: qs });
    }
  }

  // Sort by quick score, take top N
  candidates.sort((a, b) => b.quick - a.quick);
  const topCandidates = candidates.slice(0, prefilterSize);

  // Phase 2: Full multi-dimensional scoring
  const results = topCandidates.map(({ word }) => {
    const candidateAnalysis = analyze(word);
    return scoreSimilarity(queryAnalysis, candidateAnalysis);
  });

  // Sort by full score
  results.sort((a, b) => b.total - a.total);

  return {
    query: queryAnalysis,
    results: results.slice(0, maxResults),
    totalScanned: allWords.length,
    totalPrefiltered: candidates.length,
  };
}

export {
  searchSimilar,
  scoreSimilarity,
  quickSimilarity,
  levenshtein,
  editSimilarity,
  ngramJaccard,
  lcsRatio,
  getSimLevel,
  getSimLevelLabel,
  SIM_WEIGHTS,
};
