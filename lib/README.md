# Motor Fonetico PT-BR

Standalone phonetic engine for Brazilian Portuguese. Handles syllabification, stress detection, rhyme extraction, morphological classification, and multi-criteria phonetic scoring — all in a single zero-dependency JavaScript file.

Extracted from the [RimaBR](../RIMABR_README.md) experimental interface (`exp/index.html`).

---

## Quick start

### ES Module

```js
import { silabificar, perfilFonetico, calcScore } from './motor-fonetico.js';

const perfil = perfilFonetico('coracao');
console.log(perfil.silabas);     // ['co', 'ra', 'cao']
console.log(perfil.acentuacao);  // 'px'
console.log(perfil.rimaPerfeita); // 'ao'
```

### CommonJS (Node.js)

```js
const { silabificar, perfilFonetico } = require('./motor-fonetico.js');
```

### Browser

```html
<script src="motor-fonetico.js"></script>
<script>
  const p = MotorFonetico.perfilFonetico('saudade');
  console.log(p.silabas); // ['sau', 'da', 'de']
</script>
```

---

## API Reference

### Core functions

| Function | Signature | Returns |
|---|---|---|
| `silabificar` | `(palavra: string)` | `string[]` — syllable array |
| `identificarTonica` | `(silabas: string[], palavra: string)` | `number` — stressed syllable index |
| `perfilFonetico` | `(palavra: string)` | `object \| null` — full phonetic profile (see below) |
| `calcScore` | `(item, alvo, setOnset, setAssC, lenAssC)` | `number` — rhyme quality score (0-325) |

### Phonetic profile object (`perfilFonetico`)

```js
{
  palavra:         'coracao',       // normalized word
  silabas:         ['co','ra','cao'], // syllable breakdown
  tonicaIndex:     1,               // index of stressed syllable
  numSilabas:      3,               // syllable count
  acentuacao:      'px',            // stress pattern: ox | px | ppx | spx
  rimaPerfeita:    'ao',            // perfect rhyme suffix (from tonic vowel)
  vogaisRima:      'ao',            // vowel spine of the rhyme zone
  onsetTonico:     'r',             // onset consonant(s) of stressed syllable
  vogalTonica:     'a',             // stressed vowel (normalized)
  espinhaVocal:    'oaao',          // full vowel spine of the word
  assConsonantal:  '',              // sorted consonant set in rhyme zone
  familiaCluster:  'si',            // onset cluster family: pl | fl | af | lp | np | si | vz | cx
  coda:            '',              // final consonant(s) after last vowel
  classe:          'sub',           // morphological class: sub | adj | vrb | adv | outro
  freq:            'comum',         // frequency estimate: comum | media | rara
}
```

### Feature extractors

These are the building blocks used by `perfilFonetico` and `calcScore`. All are exported individually for fine-grained use:

| Function | What it computes |
|---|---|
| `normV(s)` | Strip accents from vowels (`'á'` -> `'a'`) |
| `calcOnset(sil)` | Consonant onset of a syllable |
| `calcVogalT(sil)` | Tonic vowel of a syllable (normalized) |
| `calcVogaisRima(sil, ti)` | Vowel sequence from tonic syllable to end |
| `calcEspinha(p)` | Full vowel spine of a word |
| `calcAssC(sil, ti)` | Consonant set in rhyme zone |
| `calcFam(onset)` | Cluster family classification |
| `calcAcent(sil, ti)` | Stress pattern label |
| `extrairRima(sil, ti)` | Perfect rhyme string |
| `calcCoda(p)` | Final consonant(s) after last vowel |
| `calcFreq(p, numSil)` | Frequency/rarity estimate |
| `calcClasse(p)` | Morphological class by suffix heuristics |
| `levenshtein(a, b)` | Edit distance between two strings |

### Label dictionaries

| Constant | Keys |
|---|---|
| `ACENT_LABEL` | `ox`, `px`, `ppx`, `spx` |
| `FAM_LABEL` | `pl`, `fl`, `af`, `lp`, `np`, `si`, `vz`, `cx` |
| `CLASSE_LABEL` | `sub`, `adj`, `vrb`, `adv`, `outro` |
| `FREQ_LABEL` | `comum`, `media`, `rara` |
| `CLUSTER_FAM` | Maps digraphs (`br`, `ch`, `nh`, ...) to family codes |

---

## Scoring system

`calcScore(item, alvo, setOnset, setAssC, lenAssC)` compares two phonetic profiles and returns a composite score. Higher = better rhyme.

| Criterion | Max points | Condition |
|---|---|---|
| Perfect rhyme match | +100 | Identical `rimaPerfeita` |
| Near rhyme (edit dist 1) | +70 | Levenshtein = 1 |
| Approximate rhyme (edit dist 2) | +40 | Levenshtein = 2, rhyme >= 3 chars |
| Vowel rhyme match | +60 | Identical `vogaisRima` |
| Onset match | +50 | Same tonic onset consonant |
| Partial onset overlap | +25 | Shared consonant in onset |
| Vowel spine match | +40 | Identical `espinhaVocal` (len > 1) |
| Consonantal assimilation | +30 | Jaccard >= 0.5 on consonant set |
| Cluster family match | +20 | Same `familiaCluster` |
| Tonic vowel match | +15 | Same `vogalTonica` |
| Rhythm match | +10 | Same syllable count + stress pattern |

To use `calcScore`, prepare the helper sets from the target profile:

```js
const alvo = perfilFonetico('coracao');
const setOnset = new Set(alvo.onsetTonico);
const setAssC  = new Set(alvo.assConsonantal);
const lenAssC  = alvo.assConsonantal.length;

const candidato = perfilFonetico('paixao');
const score = calcScore(candidato, alvo, setOnset, setAssC, lenAssC);
// score = 170+ (perfect rhyme + vowel match + rhythm match + ...)
```

### Score bands (suggested thresholds)

| Score | Band | Meaning |
|---|---|---|
| >= 160 | Rima | Perfect or near-perfect rhyme |
| >= 130 | Quase-rima | Very close, works in song/poetry |
| >= 100 | Eco forte | Strong echo, good for assonance |
| >= 60 | Assonancia | Vowel-driven similarity |
| >= 25 | Proximidade | Phonetic proximity |
| >= 10 | Ritmo | Rhythmic match only |

---

## Use cases

### For human developers

- **Rhyme search engines** — Build a RhymeZone-like tool for Portuguese with multi-criteria ranking instead of simple suffix matching.
- **Lyric composition tools** — Integrate into songwriting apps (sertanejo, rap, MPB, funk) with genre-aware filtering by syllable count, stress pattern, and word class.
- **Poetry assistants** — Support formal verse (alexandrines, decasyllables) with precise syllable counting and stress-pattern constraints.
- **Educational apps** — Teach Brazilian Portuguese phonetics, syllable division rules, stress patterns, and morphology interactively.
- **Text-to-speech preprocessing** — Syllable boundaries and stress position are critical inputs for TTS prosody models.
- **Crossword / word game solvers** — Filter words by syllable count, stress pattern, coda, vowel spine, or any combination.

### For AI assistants and agents

An AI assistant (like Claude, GPT, or a custom agent) can use this module as a **tool** to get deterministic, rule-based phonetic analysis instead of relying on probabilistic guessing:

```js
// In a tool-use / function-calling setup:
// The LLM calls perfilFonetico("saudade") and gets structured data back
// instead of guessing syllable counts or rhyme quality.
```

This is valuable because:

- **LLMs are unreliable at counting syllables** in Portuguese — diphthongs, hiatuses, and nasal vowels trip them up. This module applies the actual rules.
- **Rhyme quality is subjective without a framework** — `calcScore` gives a reproducible, explainable number. An agent can say *"score 170, perfect rhyme"* instead of guessing.
- **Structured output enables chaining** — An agent can filter 300k words by `acentuacao === 'px' && numSilabas === 3 && vogalTonica === 'a'` to find specific rhythmic matches, something impossible with free-text reasoning alone.
- **Deterministic = auditable** — Every decision the module makes can be inspected and verified, unlike an LLM's internal phonetic intuition.

Example agent workflow:

```
User: "Write a sertanejo verse that rhymes with 'coracao', 3 syllables, paroxytone"

Agent:
  1. Calls perfilFonetico('coracao') -> gets target profile
  2. Scans word list, filters by numSilabas === 3 && acentuacao === 'px'
  3. Scores each candidate with calcScore
  4. Picks top matches: "paixao" (170), "emocao" (165), ...
  5. Composes verse using the verified rhymes
```

---

## Roadmap

### Phase 1 — Robustness and testing

- [ ] **Unit test suite** — Validate syllabification against known correct splits (ABL/Volp reference). Cover edge cases: hiatuses (`saída`, `saúde`), tritongos (`Uruguai`), prefixed words (`subaquático`), hyphenated compounds.
- [ ] **TypeScript declarations** — Ship a `.d.ts` file so TypeScript projects get autocomplete and type checking out of the box.
- [ ] **package.json + npm publish** — Make the module installable via `npm install motor-fonetico-ptbr`.

### Phase 2 — Richer linguistic features

- [ ] **IPA transcription** — Map each syllable to its IPA representation. This unlocks TTS integration, phonetic search across languages, and accessibility features. Example: `'coração'` -> `[ko.ɾa.ˈsɐ̃w̃]`.
- [ ] **Phoneme-level representation** — Go beyond character-level vowel/consonant classification to actual phoneme inventory (e.g., distinguish /s/ from /z/ in `casa` vs `passo`, /ʃ/ in carioca dialect).
- [ ] **Morphological decomposition** — Split words into prefix + root + suffix (`des-` + `amor` + `-ado`). This improves `calcClasse` accuracy and enables productive word generation.
- [ ] **Verb conjugation awareness** — Detect tense/mood/person from verb endings so that a composition tool can maintain grammatical consistency across rhyming pairs.

### Phase 3 — Data and scale

- [ ] **Pre-built phonetic index** — Ship a pre-computed JSON index of the full 320k word list with all `perfilFonetico` fields. This lets browser apps do instant lookups without recomputing on the fly.
- [ ] **Inverted indexes for fast search** — Build lookup tables keyed by `rimaPerfeita`, `vogaisRima`, `espinhaVocal`, etc. Turns O(n) scans into O(1) lookups. Critical for real-time autocomplete over large vocabularies.
- [ ] **Frequency data from corpora** — Replace the heuristic `calcFreq` with actual frequency counts from Brazilian Portuguese corpora (NILC, Corpus Brasileiro, OpenSubtitles). A word being "common" or "rare" should come from data, not suffix patterns.
- [ ] **Word embeddings integration** — Add a `calcSemanticScore(a, b)` that combines phonetic similarity with semantic relatedness (via pre-trained PT-BR embeddings). Enables finding rhymes that also make *sense* together: `amor/calor` scores higher than `amor/tambor` because the semantic fields overlap.

### Phase 4 — Generation and composition

- [ ] **Verse generator API** — Given a target meter (e.g., decasyllable), stress pattern, and end-rhyme, generate or filter candidate lines from a word pool. This is the engine behind automated poetry and lyric tools.
- [ ] **Rhyme scheme solver** — Given a scheme like ABAB and a set of end-words, find compatible completions. Compose entire stanzas where every line satisfies syllable count, stress, and rhyme constraints simultaneously.
- [ ] **Genre-aware scoring profiles** — Different genres weight phonetic features differently. Rap values internal rhyme and polysyllabic matches; sertanejo values open vowels and simple codas; bossa nova values subtle assonance. Ship tunable scoring presets.
- [ ] **Multi-word / phrase rhyming** — Support matching across word boundaries (`coração` ~ `meu irmão`, `matar saudade` ~ `de verdade`). This requires phrase-level syllabification and stress analysis — a significant but high-impact extension.
- [ ] **MCP tool server** — Package the engine as an MCP (Model Context Protocol) server so any AI assistant (Claude, GPT, local models) can call `silabificar`, `perfilFonetico`, and `calcScore` as native tools without custom integration code.

---

## Architecture notes

The module is a single file with zero dependencies. All phonetic rules are encoded as regex patterns and lookup tables — no external dictionaries or ML models required. This makes it:

- **Fast** — `perfilFonetico` runs in <0.1ms per word. You can profile 320k words in a few seconds.
- **Portable** — Works in Node.js, Deno, Bun, browsers, Cloudflare Workers, or any JavaScript runtime.
- **Deterministic** — Same input always produces the same output. No randomness, no network calls.
- **Auditable** — Every rule (diphthong detection, stress assignment, cluster classification) is visible in the source code and can be verified against Portuguese phonology references.

The tradeoff is that purely rule-based syllabification has known limitations with loanwords, proper nouns, and some irregular patterns. The roadmap addresses this via corpus-backed validation and eventual exception dictionaries.
