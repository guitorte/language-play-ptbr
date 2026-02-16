/**
 * PT-BR Phonetic Analyzer (JavaScript port)
 * Full phonetic decomposition for Brazilian Portuguese words.
 * Powers the Compare, Analyze, and Search modes.
 */

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

// Common PT-BR prefixes (longest first for greedy match)
const PREFIXES = [
  'super','inter','intra','extra','contra','entre','anti','auto',
  'des','pre','pro','sub','re','in','im','ir'
];

// Common PT-BR suffixes (longest first for greedy match)
const SUFFIXES = [
  'mente','agem','ção','são','dor','dora','eiro','eira',
  'ismo','ista','eza','ice','ura',
  'ado','ada','ato','ata','ido','ida','oso','osa','ez'
];

function isVowel(c) { return VOWELS.has(c); }
function isConsonant(c) { return CONSONANTS.has(c); }

/**
 * Syllabify a PT-BR word following Portuguese phonotactic rules.
 */
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

      // Handle digraphs
      if (DIGRAPHS.has(pair)) {
        current += next;
        i += 2;
        continue;
      }

      // V + V
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

      // V + C + V
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

      // V + CC + V
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

/**
 * Detect stress position and type.
 * Returns { index, type, fromEnd } where index is 0-based syllable index.
 */
function detectStress(word, syllables) {
  let pos = -1;

  // Check for accent marks (explicit stress)
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
  if (fromEnd === 1) type = 'oxítona';
  else if (fromEnd === 2) type = 'paroxítona';
  else type = 'proparoxítona';

  return { index: pos, type, fromEnd };
}

/**
 * Extract the rhyme key: everything from the tonic vowel to end of word.
 */
function extractRhymeKey(word, syllables, stressIdx) {
  const tail = syllables.slice(stressIdx).join('');
  for (let i = 0; i < tail.length; i++) {
    if (isVowel(tail[i])) return tail.slice(i);
  }
  return word.length >= 2 ? word.slice(-2) : word;
}

/**
 * Extract tonic vowel from tonic syllable.
 */
function extractTonicVowel(syllable) {
  for (const c of syllable) {
    if (isVowel(c)) return c;
  }
  return '';
}

/**
 * Extract onset consonant from tonic syllable.
 */
function extractTonicConsonant(syllable) {
  for (const c of syllable) {
    if (isConsonant(c)) return c;
  }
  return null;
}

/**
 * Extract ordered vowel sequence from a word.
 */
function extractVowels(word) {
  return [...word].filter(c => isVowel(c));
}

/**
 * Extract ordered consonant sequence from a word.
 */
function extractConsonants(word) {
  return [...word].filter(c => isConsonant(c));
}

/**
 * Detect common PT-BR prefix.
 */
function detectPrefix(word) {
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length > p.length) return p;
  }
  return null;
}

/**
 * Detect common PT-BR suffix.
 */
function detectSuffix(word) {
  for (const s of SUFFIXES) {
    if (word.endsWith(s) && word.length > s.length) return s;
  }
  return null;
}

/**
 * Full phonetic analysis of a word.
 * Returns both the compact format (for search compatibility) and
 * the extended format (for Compare/Analyze views).
 */
function analyze(word) {
  word = word.toLowerCase().trim();
  const syllables = syllabify(word);
  const stress = detectStress(word, syllables);
  const tonicSyl = syllables[stress.index] || '';
  const tonicVowel = extractTonicVowel(tonicSyl);
  const tonicConsonant = extractTonicConsonant(tonicSyl);
  const rhymeKey = extractRhymeKey(word, syllables, stress.index);
  const vowels = extractVowels(word);
  const consonants = extractConsonants(word);
  const prefix = detectPrefix(word);
  const suffix = detectSuffix(word);

  return {
    // Compact fields (backward-compatible with search index)
    w: word,
    s: syllables,
    n: syllables.length,
    t: stress.type.slice(0, 2), // 'ox', 'pa', 'pr'
    v: tonicVowel,
    r: rhymeKey,
    // Extended fields (for Compare/Analyze)
    stressType: stress.type,
    stressIndex: stress.index,
    stressFromEnd: stress.fromEnd,
    tonicSyllable: tonicSyl,
    tonicVowel,
    tonicConsonant,
    vowelSequence: vowels,
    consonantSequence: consonants,
    prefix,
    suffix,
  };
}

export {
  analyze, syllabify, detectStress, extractRhymeKey,
  isVowel, isConsonant,
  extractVowels, extractConsonants,
  extractTonicVowel, extractTonicConsonant,
  detectPrefix, detectSuffix,
  PREFIXES, SUFFIXES,
};
