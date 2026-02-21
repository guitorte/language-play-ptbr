/**
 * Search orchestration layer.
 * Loads manifest, fetches chunks on demand, and coordinates rhyme search.
 * Supports switching between compact (~39K) and full (~268K) dictionaries.
 */

import { analyze } from './analyzer.js';
import { rankCandidates } from './matcher.js';

let manifest = null;
let autocomplete = null;
const chunkCache = new Map(); // file path -> parsed JSON

// Dictionary paths: 'data' (compact, default), 'data-full', 'data-compact'
let currentDict = 'data';
let BASE = new URL('../data/', import.meta.url).href;

/**
 * Get the current dictionary name ('compact' or 'full').
 */
function getCurrentDict() {
  if (currentDict === 'data-full') return 'full';
  return 'compact';
}

/**
 * Switch dictionary and reinitialize.
 * @param {'compact'|'full'} dict
 * @returns {Promise<{totalWords: number}>}
 */
async function switchDict(dict) {
  const folder = dict === 'full' ? 'data-full' : 'data';
  if (folder === currentDict && manifest) {
    return { totalWords: manifest.totalWords };
  }
  currentDict = folder;
  BASE = new URL(`../${folder}/`, import.meta.url).href;
  // Clear cache since chunk paths changed
  chunkCache.clear();
  manifest = null;
  autocomplete = null;
  return init();
}

/**
 * Initialize: load manifest and autocomplete data.
 */
async function init() {
  const [mRes, aRes] = await Promise.all([
    fetch(BASE + 'manifest.json'),
    fetch(BASE + 'autocomplete.json'),
  ]);
  manifest = await mRes.json();
  autocomplete = await aRes.json();
  return { totalWords: manifest.totalWords };
}

/**
 * Fetch and cache a chunk file.
 * Injects rhyme key `r` into compact entries (stripped during build to save space).
 */
async function loadChunk(filePath) {
  const cacheKey = currentDict + ':' + filePath;
  if (chunkCache.has(cacheKey)) return chunkCache.get(cacheKey);
  const res = await fetch(BASE + filePath);
  const data = await res.json();
  // Inject rhyme key into entries that don't have it
  for (const [rk, entries] of Object.entries(data)) {
    if (Array.isArray(entries)) {
      for (const e of entries) {
        if (!e.r) e.r = rk;
      }
    }
  }
  chunkCache.set(cacheKey, data);
  return data;
}

/**
 * Look up a word's entry from the pre-computed index.
 * Returns the entry object or null.
 */
async function lookupWord(word) {
  if (!manifest) throw new Error('Not initialized');
  word = word.toLowerCase().trim();

  // Check every rhyme key in the manifest to find the word
  for (const [rhymeKey, info] of Object.entries(manifest.chunks)) {
    // We can't check without loading chunks, so we use a heuristic:
    // the word's ending should match the rhyme key
    if (word.endsWith(rhymeKey.slice(-2)) || rhymeKey.length <= 2) {
      const chunk = await loadChunk(info.f);
      if (chunk[rhymeKey]) {
        const found = chunk[rhymeKey].find(e => e.w === word);
        if (found) return { entry: found, rhymeKey };
      }
    }
  }
  return null;
}

/**
 * Search for rhymes of a given word.
 * Returns { perfect: [...], near: [...], motherEntry }
 */
async function searchRhymes(word, opts = {}) {
  if (!manifest) throw new Error('Not initialized');
  word = word.toLowerCase().trim();
  const maxResults = opts.maxResults || 50;
  const includeNear = opts.includeNear !== false;

  // Step 1: Analyze the input word (always use full analysis for motherEntry)
  const motherEntry = analyze(word);
  let rhymeKey = motherEntry.r;

  // Try to find in pre-computed index for a potentially more accurate rhyme key
  const inIndex = autocomplete && binarySearch(autocomplete, word);
  if (inIndex) {
    const result = await findWordInIndex(word);
    if (result) {
      rhymeKey = result.rhymeKey;
    }
  }

  // Step 2: Gather perfect rhyme candidates (same rhyme key)
  let perfectCandidates = [];
  const chunkInfo = manifest.chunks[rhymeKey];
  if (chunkInfo) {
    const chunk = await loadChunk(chunkInfo.f);
    if (chunk[rhymeKey]) {
      perfectCandidates = chunk[rhymeKey];
    }
  }

  // Step 3: Gather near-rhyme candidates
  let nearCandidates = [];
  if (includeNear && manifest.nearRhymeMap[rhymeKey]) {
    const nearKeys = manifest.nearRhymeMap[rhymeKey];
    const fetches = [];
    for (const nk of nearKeys) {
      const ni = manifest.chunks[nk];
      if (ni) {
        fetches.push(
          loadChunk(ni.f).then(chunk => {
            if (chunk[nk]) nearCandidates.push(...chunk[nk]);
          })
        );
      }
    }
    await Promise.all(fetches);
  }

  // Step 4: Also find similar rhyme keys by suffix matching
  if (perfectCandidates.length < 5 && rhymeKey.length >= 2) {
    const suffix = rhymeKey.slice(-2);
    for (const [rk, info] of Object.entries(manifest.chunks)) {
      if (rk !== rhymeKey && rk.endsWith(suffix) && !nearCandidates.some(c => c.r === rk)) {
        const chunk = await loadChunk(info.f);
        if (chunk[rk]) {
          nearCandidates.push(...chunk[rk]);
        }
        if (nearCandidates.length > 200) break;
      }
    }
  }

  // Step 5: Rank results
  const perfect = rankCandidates(motherEntry, perfectCandidates).slice(0, maxResults);
  const near = rankCandidates(motherEntry, nearCandidates)
    .filter(r => r.total >= 0.30)
    .slice(0, maxResults);

  return {
    motherEntry,
    rhymeKey,
    perfect,
    near,
    totalPerfect: perfectCandidates.length - 1, // minus the word itself
    totalNear: nearCandidates.length,
  };
}

/**
 * Find a word in the pre-computed index by scanning chunk metadata.
 */
async function findWordInIndex(word) {
  // Analyze the word to get its likely rhyme key
  const features = analyze(word);
  const guessedKey = features.r;

  // Try the guessed key first
  const info = manifest.chunks[guessedKey];
  if (info) {
    const chunk = await loadChunk(info.f);
    if (chunk[guessedKey]) {
      const found = chunk[guessedKey].find(e => e.w === word);
      if (found) return { entry: found, rhymeKey: guessedKey };
    }
  }

  // Fallback: scan chunks that might contain the word
  // Use the word's ending to narrow the search
  for (const [rk, rkInfo] of Object.entries(manifest.chunks)) {
    // Heuristic: rhyme key should appear at the end of the word
    if (word.endsWith(rk) || (rk.length >= 2 && word.endsWith(rk.slice(-Math.min(rk.length, 3))))) {
      const chunk = await loadChunk(rkInfo.f);
      if (chunk[rk]) {
        const found = chunk[rk].find(e => e.w === word);
        if (found) return { entry: found, rhymeKey: rk };
      }
    }
  }

  return null;
}

/**
 * Binary search in sorted array.
 */
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = arr[mid].localeCompare(target);
    if (cmp === 0) return true;
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

/**
 * Autocomplete: find words starting with prefix.
 */
function suggest(prefix, limit = 10) {
  if (!autocomplete || !prefix) return [];
  prefix = prefix.toLowerCase();
  const results = [];
  // Binary search for start position
  let lo = 0, hi = autocomplete.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (autocomplete[mid] < prefix) lo = mid + 1;
    else hi = mid - 1;
  }
  for (let i = lo; i < autocomplete.length && results.length < limit; i++) {
    if (autocomplete[i].startsWith(prefix)) results.push(autocomplete[i]);
    else if (autocomplete[i] > prefix + '\uffff') break;
  }
  return results;
}

/**
 * Return the full autocomplete word list (for similarity search).
 * Returns null if not yet initialized.
 */
function getAllWords() {
  return autocomplete;
}

/**
 * Return the loaded manifest (null if not yet initialized).
 */
function getManifest() {
  return manifest;
}

export { init, searchRhymes, suggest, getAllWords, getManifest, loadChunk, switchDict, getCurrentDict };
