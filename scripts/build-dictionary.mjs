/**
 * Build script: Process palavras.txt into search data files.
 *
 * Reads upload/palavras.txt, analyzes each word phonetically,
 * and generates:
 *   - docs/data/autocomplete.json (sorted word list for autocomplete + similarity)
 *   - docs/data/manifest.json     (index mapping rhyme keys to chunk files)
 *   - docs/data/chunks/chunk_NNN.json (word entries grouped by rhyme key)
 *
 * Chunk entries use compact format: { w, n, t, v } (no syllables, no r).
 * The rhyme key `r` is injected at load time from the chunk key name.
 * The matcher falls back gracefully for missing extended fields.
 *
 * Usage: node scripts/build-dictionary.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ===== Inline analyzer (ported from docs/js/analyzer.js) =====

const VOWELS = new Set('aeiouáéíóúâêôãõàèìòù');
const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyzç');

const INSEPARABLE_CLUSTERS = new Set([
  'bl','br','cl','cr','dr','fl','fr','gl','gr',
  'pl','pr','tl','tr','vr','ch','lh','nh','qu','gu'
]);

const DIGRAPHS = new Set(['ch','lh','nh','rr','ss','qu','gu','sc','sç','xc']);

const DIPHTHONGS = new Set([
  'ai','ei','oi','ui','au','eu','iu','ou','ãe','ão','õe','ói',
  'ia','ie','io','ua','ue','uo'
]);

function isVowel(c) { return VOWELS.has(c); }
function isConsonant(c) { return CONSONANTS.has(c); }

function syllabify(word) {
  if (!word) return [];
  word = word.toLowerCase().trim();
  if (word.length <= 2) return [word];

  const syllables = [];
  let current = '';
  let i = 0;

  while (i < word.length) {
    const char = word[i];
    current += char;

    if (i < word.length - 1) {
      const next = word[i + 1];
      const pair = char + next;

      if (DIGRAPHS.has(pair)) {
        current += next;
        i += 2;
        continue;
      }

      if (isVowel(char) && isVowel(next)) {
        if (DIPHTHONGS.has(pair)) {
          current += next;
          i += 2;
          syllables.push(current);
          current = '';
          continue;
        } else {
          syllables.push(current);
          current = '';
          i += 1;
          continue;
        }
      }

      if (isVowel(char) && isConsonant(next) && i + 2 < word.length && isVowel(word[i + 2])) {
        if (i + 3 < word.length) {
          const cluster = next + word[i + 2];
          if (INSEPARABLE_CLUSTERS.has(cluster)) {
            syllables.push(current);
            current = '';
            i += 1;
            continue;
          }
        }
        syllables.push(current);
        current = '';
        i += 1;
        continue;
      }

      if (isVowel(char) && i + 3 < word.length &&
          isConsonant(next) && isConsonant(word[i + 2]) && isVowel(word[i + 3])) {
        const cluster = next + word[i + 2];
        if (INSEPARABLE_CLUSTERS.has(cluster)) {
          syllables.push(current);
          current = '';
          i += 1;
          continue;
        } else {
          current += next;
          syllables.push(current);
          current = '';
          i += 2;
          continue;
        }
      }
    }
    i += 1;
  }

  if (current) {
    syllables.push(current);
  }

  return syllables.length > 0 ? syllables : [word];
}

function detectStress(word, syllables) {
  let pos = -1;

  for (let i = 0; i < syllables.length; i++) {
    if (/[áéíóúâêô]/.test(syllables[i])) {
      pos = i;
      break;
    }
  }

  if (pos === -1) {
    if (syllables.length === 1) {
      pos = 0;
    } else if (/[aeo]s?$|am$|em$/.test(word)) {
      pos = Math.max(syllables.length - 2, 0);
    } else {
      pos = syllables.length - 1;
    }
  }

  const fromEnd = syllables.length - pos;
  let type;
  if (fromEnd === 1) type = 'ox';
  else if (fromEnd === 2) type = 'pa';
  else type = 'pr';

  return { index: pos, type, fromEnd };
}

function extractRhymeKey(word, syllables, stressIdx) {
  const tail = syllables.slice(stressIdx).join('');
  for (let i = 0; i < tail.length; i++) {
    if (isVowel(tail[i])) return tail.slice(i);
  }
  return word.length >= 2 ? word.slice(-2) : word;
}

function extractTonicVowel(syllable) {
  for (const c of syllable) {
    if (isVowel(c)) return c;
  }
  return '';
}

function analyzeWord(word) {
  word = word.toLowerCase().trim();
  const syllables = syllabify(word);
  const stress = detectStress(word, syllables);
  const tonicSyl = syllables[stress.index] || '';
  const tonicVowel = extractTonicVowel(tonicSyl);
  const rhymeKey = extractRhymeKey(word, syllables, stress.index);

  // Compact entry: no syllables array, no rhyme key (injected from chunk key)
  return {
    w: word,
    n: syllables.length,
    t: stress.type,
    v: tonicVowel,
    r: rhymeKey,
  };
}

// ===== Near rhyme map generation =====

function rhymeKeyVowels(rk) {
  const vowels = [];
  for (let i = 0; i < rk.length; i++) {
    const ch = rk[i];
    if ((ch === 'ã' || ch === 'õ') && i + 1 < rk.length && isVowel(rk[i + 1])) {
      vowels.push(ch + rk[i + 1]);
      i++;
    } else if (isVowel(ch)) {
      vowels.push(ch);
    }
  }
  return vowels;
}

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

function generateNearRhymeMap(allRhymeKeys, wordCounts) {
  const map = {};
  const keysByTonic = {};

  // Only process rhyme keys that have at least 3 words
  const significantKeys = allRhymeKeys.filter(rk => (wordCounts[rk] || 0) >= 3);

  for (const rk of significantKeys) {
    const vowels = rhymeKeyVowels(rk);
    if (vowels.length === 0) continue;
    const tonic = normalizeVowel(vowels[0].charAt(0));
    if (!keysByTonic[tonic]) keysByTonic[tonic] = [];
    keysByTonic[tonic].push(rk);
  }

  for (const rk of significantKeys) {
    const vowels = rhymeKeyVowels(rk);
    if (vowels.length === 0) continue;
    const tonic = normalizeVowel(vowels[0].charAt(0));
    const endVowel = normalizeVowel(vowels[vowels.length - 1].charAt(
      vowels[vowels.length - 1].length - 1
    ));

    const candidates = keysByTonic[tonic] || [];
    const near = [];

    for (const other of candidates) {
      if (other === rk) continue;
      const otherVowels = rhymeKeyVowels(other);
      if (otherVowels.length === 0) continue;
      const otherEnd = normalizeVowel(otherVowels[otherVowels.length - 1].charAt(
        otherVowels[otherVowels.length - 1].length - 1
      ));
      if (otherEnd === endVowel) {
        near.push(other);
      }
    }

    // Limit to 10 near rhyme keys per key, prioritize by word count
    if (near.length > 0) {
      near.sort((a, b) => (wordCounts[b] || 0) - (wordCounts[a] || 0));
      map[rk] = near.slice(0, 10);
    }
  }

  return map;
}

// ===== Main build logic =====

function main() {
  console.log('Reading palavras.txt...');
  const rawText = readFileSync(join(ROOT, 'upload', 'palavras.txt'), 'utf-8');
  const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log(`  Total raw lines: ${rawLines.length}`);

  // Filter to valid words: lowercase Portuguese letters only, 2-25 chars
  const validPattern = /^[a-záéíóúâêôãõàèìòùüç]+$/;
  const validWords = [];
  const seen = new Set();

  for (const line of rawLines) {
    const w = line.toLowerCase();
    if (w.length < 2 || w.length > 25) continue;
    if (!validPattern.test(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    validWords.push(w);
  }

  validWords.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  console.log(`  Valid words after filtering: ${validWords.length}`);

  // Analyze all words and group by rhyme key
  console.log('Analyzing words...');
  const byRhymeKey = {};
  let analyzed = 0;

  for (const w of validWords) {
    const entry = analyzeWord(w);
    const rk = entry.r;
    if (!byRhymeKey[rk]) byRhymeKey[rk] = [];
    // Store compact entry: { w, n, t, v } — r is implicit from group key
    byRhymeKey[rk].push({ w: entry.w, n: entry.n, t: entry.t, v: entry.v });
    analyzed++;
    if (analyzed % 50000 === 0) {
      console.log(`  Analyzed ${analyzed}/${validWords.length} words...`);
    }
  }

  const rhymeKeys = Object.keys(byRhymeKey).sort();
  console.log(`  Unique rhyme keys: ${rhymeKeys.length}`);

  // Word counts per rhyme key (for near map generation)
  const wordCounts = {};
  for (const rk of rhymeKeys) {
    wordCounts[rk] = byRhymeKey[rk].length;
  }

  // Generate chunks: group multiple rhyme keys per file
  const WORDS_PER_CHUNK = 3000;
  const chunks = [];
  let currentChunk = { keys: {}, wordCount: 0 };

  // Sort rhyme keys by word count descending
  const sortedRhymeKeys = rhymeKeys.slice().sort(
    (a, b) => byRhymeKey[b].length - byRhymeKey[a].length
  );

  // Large rhyme keys (>WORDS_PER_CHUNK) get their own chunk
  const largeKeys = [];
  const smallKeys = [];
  for (const rk of sortedRhymeKeys) {
    if (byRhymeKey[rk].length > WORDS_PER_CHUNK) {
      largeKeys.push(rk);
    } else {
      smallKeys.push(rk);
    }
  }

  for (const rk of largeKeys) {
    chunks.push({
      keys: { [rk]: byRhymeKey[rk] },
      wordCount: byRhymeKey[rk].length,
    });
  }

  // Group small keys into chunks
  currentChunk = { keys: {}, wordCount: 0 };
  smallKeys.sort();
  for (const rk of smallKeys) {
    const entries = byRhymeKey[rk];
    if (currentChunk.wordCount + entries.length > WORDS_PER_CHUNK && currentChunk.wordCount > 0) {
      chunks.push(currentChunk);
      currentChunk = { keys: {}, wordCount: 0 };
    }
    currentChunk.keys[rk] = entries;
    currentChunk.wordCount += entries.length;
  }
  if (currentChunk.wordCount > 0) {
    chunks.push(currentChunk);
  }

  console.log(`  Generated ${chunks.length} chunk files`);

  // Write chunk files
  const chunksDir = join(ROOT, 'docs', 'data', 'chunks');
  mkdirSync(chunksDir, { recursive: true });

  // Clean existing chunks
  for (const f of readdirSync(chunksDir)) {
    if (f.startsWith('chunk_') && f.endsWith('.json')) {
      unlinkSync(join(chunksDir, f));
    }
  }

  const manifest = {
    totalWords: validWords.length,
    chunks: {},
    nearRhymeMap: {},
  };

  for (let i = 0; i < chunks.length; i++) {
    const chunkFileName = `chunk_${String(i).padStart(3, '0')}.json`;
    const chunkFilePath = `chunks/${chunkFileName}`;
    const chunk = chunks[i];

    writeFileSync(
      join(chunksDir, chunkFileName),
      JSON.stringify(chunk.keys)
    );

    for (const rk of Object.keys(chunk.keys)) {
      manifest.chunks[rk] = {
        f: chunkFilePath,
        c: chunk.keys[rk].length,
      };
    }
  }

  // Generate near rhyme map (limited)
  console.log('Generating near rhyme map...');
  manifest.nearRhymeMap = generateNearRhymeMap(rhymeKeys, wordCounts);
  const nearMapSize = Object.keys(manifest.nearRhymeMap).length;
  console.log(`  Near rhyme map entries: ${nearMapSize}`);

  // Write manifest
  const manifestPath = join(ROOT, 'docs', 'data', 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest));
  console.log(`  Manifest written: ${(JSON.stringify(manifest).length / 1024).toFixed(0)} KB`);

  // Write autocomplete
  const autocompletePath = join(ROOT, 'docs', 'data', 'autocomplete.json');
  writeFileSync(autocompletePath, JSON.stringify(validWords));
  console.log(`  Autocomplete written: ${(JSON.stringify(validWords).length / 1024).toFixed(0)} KB`);

  // Summary
  console.log('\nBuild complete!');
  console.log(`  Total words: ${validWords.length.toLocaleString()}`);
  console.log(`  Rhyme keys: ${rhymeKeys.length.toLocaleString()}`);
  console.log(`  Chunk files: ${chunks.length}`);

  const topKeys = sortedRhymeKeys.slice(0, 10);
  console.log('  Top rhyme keys by word count:');
  for (const rk of topKeys) {
    console.log(`    -${rk}: ${byRhymeKey[rk].length} words`);
  }
}

main();
