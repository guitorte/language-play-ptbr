/**
 * PT-BR Rhyme Matcher (JavaScript port)
 * Scores and ranks rhyme candidates using multi-criteria analysis.
 */

import { isVowel, isConsonant } from './analyzer.js';

/**
 * Score how well two word entries rhyme.
 * Both entries use the compact format: { w, s, n, t, v, r }
 * Returns a score object with total, breakdown, and level.
 */
function scorePair(mother, candidate) {
  const prosodic = scoreProsody(mother, candidate);
  const tonic = scoreTonic(mother, candidate);
  const phonetic = scorePhonetic(mother, candidate);

  // Weights tuned for Brazilian Portuguese rhyme
  const total = Math.min(1,
    prosodic.score * 0.20 +
    tonic.score * 0.50 +
    phonetic.score * 0.30
  );

  let level;
  if (total >= 0.90) level = 'perfect';
  else if (total >= 0.75) level = 'strong';
  else if (total >= 0.60) level = 'good';
  else if (total >= 0.40) level = 'weak';
  else level = 'poor';

  return { word: candidate.w, total, level, prosodic, tonic, phonetic };
}

function scoreProsody(m, c) {
  let score = 0;
  // Stress type match
  if (m.t === c.t) score += 0.5;
  // Syllable count similarity
  if (m.n === c.n) score += 0.3;
  else score += 0.3 / (1 + Math.abs(m.n - c.n));
  // Same tonic vowel gives a bonus
  if (m.v === c.v) score += 0.2;
  return { score: Math.min(score, 1) };
}

function scoreTonic(m, c) {
  let score = 0;

  // Identical rhyme key = jackpot
  if (m.r === c.r) return { score: 1.0 };

  // Tonic vowel match
  if (m.v === c.v) score += 0.45;

  // Ending similarity (compare last N chars of rhyme key)
  const mEnd = m.r.slice(-3);
  const cEnd = c.r.slice(-3);
  if (mEnd === cEnd) score += 0.4;
  else if (m.r.slice(-2) === c.r.slice(-2)) score += 0.3;
  else if (m.r.slice(-1) === c.r.slice(-1)) score += 0.1;

  return { score: Math.min(score, 1) };
}

function scorePhonetic(m, c) {
  let score = 0;
  const mw = m.w, cw = c.w;

  // Word ending match (last 2-3 chars of actual word)
  if (mw.length >= 3 && cw.length >= 3 && mw.slice(-3) === cw.slice(-3)) {
    score += 0.5;
  } else if (mw.length >= 2 && cw.length >= 2 && mw.slice(-2) === cw.slice(-2)) {
    score += 0.35;
  } else if (mw.slice(-1) === cw.slice(-1)) {
    score += 0.1;
  }

  // Vowel pattern similarity
  const mVowels = extractVowels(mw);
  const cVowels = extractVowels(cw);
  const vSim = sequenceSimilarity(mVowels, cVowels);
  score += vSim * 0.3;

  // Consonant overlap
  const mCons = new Set(extractConsonants(mw));
  const cCons = new Set(extractConsonants(cw));
  if (mCons.size > 0 && cCons.size > 0) {
    let overlap = 0;
    for (const c of mCons) if (cCons.has(c)) overlap++;
    score += (overlap / Math.max(mCons.size, cCons.size)) * 0.2;
  }

  return { score: Math.min(score, 1) };
}

function extractVowels(word) {
  return [...word].filter(c => isVowel(c));
}

function extractConsonants(word) {
  return [...word].filter(c => isConsonant(c));
}

function sequenceSimilarity(a, b) {
  if (!a.length || !b.length) return 0;
  let matches = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

/**
 * Rank candidates by rhyme quality against a mother word entry.
 */
function rankCandidates(mother, candidates) {
  return candidates
    .filter(c => c.w !== mother.w) // exclude self
    .map(c => scorePair(mother, c))
    .sort((a, b) => b.total - a.total);
}

export { scorePair, rankCandidates };
