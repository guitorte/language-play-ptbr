/**
 * Categorized Rhyme Search Engine
 *
 * Searches for rhymes categorized by phonetic relationship type:
 * - Perfeitas (consoantes): exact rhyme key match (full sound from tonic onward)
 * - Toantes (assonância):   same vowel pattern from tonic, different consonants
 * - Consonantais:           same consonant pattern from tonic, different vowels
 * - Aproximadas (slant):    partial phonetic similarity (shared tonic vowel + ending vowel)
 *
 * Reuses the manifest and chunk cache from search.js.
 */

import { analyze, isVowel, isConsonant } from './analyzer.js';
import { getManifest, loadChunk } from './search.js';
import { rankCandidates } from './matcher.js';

/**
 * Extract ordered vowels from a rhyme key string.
 * e.g., "ado" -> ["a", "o"], "arro" -> ["a", "o"], "ção" -> ["ão"]
 */
function rhymeKeyVowels(rk) {
  const vowels = [];
  for (let i = 0; i < rk.length; i++) {
    const ch = rk[i];
    // Treat nasal diphthongs as single vowel units
    if ((ch === 'ã' || ch === 'õ') && i + 1 < rk.length && isVowel(rk[i + 1])) {
      vowels.push(ch + rk[i + 1]);
      i++; // skip next
    } else if (isVowel(ch)) {
      vowels.push(ch);
    }
  }
  return vowels;
}

/**
 * Extract ordered consonants from a rhyme key string.
 * e.g., "ado" -> ["d"], "arro" -> ["r", "r"], "ção" -> ["ç"]
 */
function rhymeKeyConsonants(rk) {
  return [...rk].filter(c => isConsonant(c));
}

/**
 * Normalize accented vowels to their base form for looser matching.
 * á->a, é->e, í->i, ó->o, ú->u, â->a, ê->e, ô->o, ã->a, õ->o
 */
function normalizeVowel(v) {
  const map = {
    'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i',
    'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u',
  };
  return map[v] || v;
}

/**
 * Normalize a vowel pattern for comparison.
 * Handles multi-char nasal diphthongs too.
 */
function normalizeVowelPattern(vowels) {
  return vowels.map(v => {
    if (v.length === 1) return normalizeVowel(v);
    // Nasal diphthong like "ão" -> normalize each char
    return [...v].map(c => normalizeVowel(c)).join('');
  });
}

/**
 * Check if two vowel patterns match (normalized).
 */
function vowelPatternsMatch(a, b) {
  const na = normalizeVowelPattern(a);
  const nb = normalizeVowelPattern(b);
  if (na.length !== nb.length) return false;
  return na.every((v, i) => v === nb[i]);
}

/**
 * Check if two consonant patterns match exactly.
 */
function consonantPatternsMatch(a, b) {
  if (a.length !== b.length) return false;
  return a.every((c, i) => c === b[i]);
}

/**
 * Categorize all rhyme keys from the manifest relative to a query rhyme key.
 * Returns object with arrays of { rk, info, wordCount } for each category.
 */
function categorizeRhymeKeys(queryRhymeKey) {
  const manifest = getManifest();
  if (!manifest) return null;

  const qVowels = rhymeKeyVowels(queryRhymeKey);
  const qConsonants = rhymeKeyConsonants(queryRhymeKey);

  const categories = {
    perfect: [],
    toante: [],
    consonantal: [],
    approximate: [],
  };

  const categorized = new Set();

  for (const [rk, info] of Object.entries(manifest.chunks)) {
    if (rk === queryRhymeKey) {
      categories.perfect.push({ rk, info, wordCount: info.c || 0 });
      categorized.add(rk);
      continue;
    }

    const rkVowels = rhymeKeyVowels(rk);
    const rkConsonants = rhymeKeyConsonants(rk);

    const vMatch = qVowels.length > 0 && vowelPatternsMatch(qVowels, rkVowels);
    const cMatch = qConsonants.length > 0 && consonantPatternsMatch(qConsonants, rkConsonants);

    if (vMatch && cMatch) {
      // Both match but key is different → accent variant, treat as perfect
      categories.perfect.push({ rk, info, wordCount: info.c || 0 });
      categorized.add(rk);
    } else if (vMatch) {
      categories.toante.push({ rk, info, wordCount: info.c || 0 });
      categorized.add(rk);
    } else if (cMatch) {
      categories.consonantal.push({ rk, info, wordCount: info.c || 0 });
      categorized.add(rk);
    }
  }

  // Add nearRhymeMap entries to approximate (if not already categorized)
  const nearKeys = manifest.nearRhymeMap[queryRhymeKey] || [];
  for (const nrk of nearKeys) {
    if (!categorized.has(nrk) && manifest.chunks[nrk]) {
      categories.approximate.push({
        rk: nrk,
        info: manifest.chunks[nrk],
        wordCount: manifest.chunks[nrk].c || 0,
      });
      categorized.add(nrk);
    }
  }

  // Also find approximate: same tonic vowel + same ending vowel but different pattern length
  if (qVowels.length > 0) {
    const qTonicNorm = normalizeVowel(qVowels[0].charAt(0));
    const qEndNorm = normalizeVowel(qVowels[qVowels.length - 1].charAt(
      qVowels[qVowels.length - 1].length - 1
    ));

    for (const [rk, info] of Object.entries(manifest.chunks)) {
      if (categorized.has(rk)) continue;

      const rkVowels = rhymeKeyVowels(rk);
      if (rkVowels.length === 0) continue;

      const rkTonicNorm = normalizeVowel(rkVowels[0].charAt(0));
      const rkEndNorm = normalizeVowel(rkVowels[rkVowels.length - 1].charAt(
        rkVowels[rkVowels.length - 1].length - 1
      ));

      // Same tonic vowel AND same ending vowel → approximate rhyme
      if (rkTonicNorm === qTonicNorm && rkEndNorm === qEndNorm) {
        categories.approximate.push({ rk, info, wordCount: info.c || 0 });
        categorized.add(rk);
      }
    }
  }

  // Sort each category by word count (most common rhyme keys first)
  for (const cat of Object.values(categories)) {
    cat.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
  }

  return categories;
}

/**
 * Main search function: find categorized rhymes for a word.
 *
 * @param {string} word - input word
 * @param {object} opts - { maxPerCategory, maxChunksPerCategory }
 * @returns {Promise<object>} { motherEntry, rhymeKey, categories }
 */
async function searchCategorizedRhymes(word, opts = {}) {
  const manifest = getManifest();
  if (!manifest) throw new Error('Search not initialized');

  word = word.toLowerCase().trim();
  const maxPerCategory = opts.maxPerCategory || 60;
  const maxChunks = opts.maxChunksPerCategory || 25;

  // Analyze input word
  const motherEntry = analyze(word);
  const rhymeKey = motherEntry.r;

  // Categorize all manifest rhyme keys
  const keyCategories = categorizeRhymeKeys(rhymeKey);
  if (!keyCategories) throw new Error('Manifest not loaded');

  const result = {
    motherEntry,
    rhymeKey,
    vowelPattern: rhymeKeyVowels(rhymeKey),
    consonantPattern: rhymeKeyConsonants(rhymeKey),
    categories: {},
  };

  // Load chunks and rank candidates for each category
  const categoryNames = ['perfect', 'toante', 'consonantal', 'approximate'];

  for (const category of categoryNames) {
    const keyInfos = keyCategories[category] || [];
    const chunksToLoad = keyInfos.slice(0, maxChunks);
    let candidates = [];

    // Load chunks in parallel
    await Promise.all(chunksToLoad.map(async ({ rk, info }) => {
      try {
        const chunk = await loadChunk(info.f);
        if (chunk[rk]) {
          candidates.push(...chunk[rk]);
        }
      } catch (e) {
        // Skip failed chunks silently
      }
    }));

    // Rank candidates using the existing multi-criteria matcher
    // Use appropriate context for scoring
    const context = category === 'toante' ? 'assonance' :
                    category === 'approximate' ? 'hip_hop' : 'general';

    const minScore = category === 'perfect' ? 0.10 :
                     category === 'toante' ? 0.10 :
                     category === 'consonantal' ? 0.10 :
                     0.15;

    const ranked = rankCandidates(motherEntry, candidates, context)
      .filter(r => r.total >= minScore)
      .slice(0, maxPerCategory);

    result.categories[category] = {
      items: ranked,
      totalKeys: keyInfos.length,
      totalCandidates: candidates.length,
      rhymeKeys: chunksToLoad.map(e => e.rk),
    };
  }

  return result;
}

export {
  searchCategorizedRhymes,
  categorizeRhymeKeys,
  rhymeKeyVowels,
  rhymeKeyConsonants,
};
