# RimaBR — Phonetic Engine for Brazilian Portuguese

A rule-based phonetic analysis system for Brazilian Portuguese, built for rhyme search, lyric composition, and linguistic research. It provides syllabification, stress detection, multi-criteria rhyme scoring, and — as of recently — empirical rhyme pair data and phrase rhyme indexes extracted from real song lyrics.

The project started as a reasoning-based phonetic matcher designed around Claude's analytical strengths, and has evolved into a standalone engine with multiple interfaces (Python CLI, JavaScript module, web explorer) and a growing corpus-backed data layer.

---

## What it does

Given any Portuguese word, the system can:

- **Split it into syllables** following Brazilian Portuguese phonotactic rules (diphthongs, hiatuses, nasal vowels, digraphs, consonant clusters)
- **Identify the stressed syllable** and classify the word as oxitona, paroxitona, or proparoxitona
- **Extract a phonetic profile** with 14+ features: perfect rhyme suffix, vowel spine, tonic onset, consonantal assimilation, cluster family, coda, morphological class, frequency estimate
- **Score rhyme quality** between two words using a multi-criteria system (0-325 points across 11 dimensions)
- **Look up real rhyme pairs** observed in 5,600+ Brazilian songs across MPB, sertanejo, pagode, trap, arrocha, rap, brega, and pop/rock
- **Search phrase endings** — multi-word fragments like "meu coracao", "de verdade", "por favor" — indexed by rhyme suffix, syllable count, and genre

---

## Project structure

```
ptbrwp/
|
|-- lib/                              # Standalone reusable modules
|   |-- motor-fonetico.js             # Core phonetic engine (JS, zero deps)
|   |-- extract-rhyme-data.js         # Corpus processing script
|   +-- README.md                     # Module API docs + roadmap
|
|-- exp/                              # Experimental interface
|   +-- index.html                    # Full-featured web rhyme explorer
|
|-- syl/                              # Phonetic explorer (earlier versions)
|   |-- index.html                    # Web explorer (v3 Bottom Sheet)
|   |-- palavras.txt                  # Dictionary (~51.8K words)
|   +-- README-explorer.md            # Web tool documentation
|
|-- docs/                             # GitHub Pages deployment
|   |-- index.html                    # Public web interface
|   |-- js/                           # App modules (analyzer, matcher, search)
|   |-- data/                         # Chunked word index (compact)
|   +-- data-full/                    # Chunked word index (complete)
|
|-- dic/                              # Dictionary tools
|   |-- fonetica.js                   # Phonetic analysis
|   |-- gerar-rimas.mjs              # Rhyme generation
|   |-- verificar-rimas.mjs          # Rhyme verification
|   +-- palavras.txt                  # Word list
|
|-- data/                             # Data files
|   |-- palavras_exemplo.txt          # 212 words (demo)
|   |-- palavras_completas.txt        # ~320K words (full dictionary)
|   |-- kpalavras.txt                 # ~52K words
|   |-- rhyme_pairs.json              # 88K empirical rhyme pairs from corpora
|   +-- phrase_rhymes.json            # 170K phrase endings indexed by rhyme
|
|-- upload/                           # Source corpora and reference
|   |-- letras_final.json             # 478 songs, structured (artist/genre/lyrics)
|   |-- training_corpus.txt           # 5,159 songs (MPB/Trap/Pagode/Arrocha/Sertanejo)
|   |-- regras01.txt                  # Syllabification rules (Bechara grammar)
|   |-- regras02.txt                  # Accentuation rules (Bechara grammar)
|   +-- palavras.txt                  # Raw word list
|
|-- src/                              # Python analysis system
|   |-- analyzers/phonetic_analyzer.py
|   |-- matchers/reasoning_matcher.py
|   |-- utils/syllabifier.py
|   +-- prompts/claude_reasoning.xml
|
|-- demo_recato.py                    # Python demo
|-- compose_sertanejo.py              # Sertanejo composition demo
|-- analyze_rap_rhymes.py             # Rap rhyme analysis
|-- build_index.py                    # Index builder
|-- RimaBR_Colab.ipynb                # Google Colab notebook
+-- README.md                         # This file
```

---

## The phonetic engine (`lib/motor-fonetico.js`)

The core of the project is a single zero-dependency JavaScript file that encodes Brazilian Portuguese phonotactic rules as regex patterns and lookup tables. No external dictionaries, no ML models.

```js
import { silabificar, perfilFonetico, calcScore } from './lib/motor-fonetico.js';

silabificar('coracao');    // ['co', 'ra', 'cao']
silabificar('saudade');    // ['sau', 'da', 'de']
silabificar('subaquatico'); // ['su', 'ba', 'qua', 'ti', 'co']

const p = perfilFonetico('coracao');
// {
//   palavra: 'coracao', silabas: ['co','ra','cao'],
//   acentuacao: 'px', rimaPerfeita: 'ao',
//   vogalTonica: 'a', espinhaVocal: 'oaao',
//   classe: 'sub', freq: 'comum', ...
// }
```

Works in Node.js, Deno, Bun, browsers, and Cloudflare Workers. Full API documentation in [`lib/README.md`](lib/README.md).

### Scoring system

`calcScore` evaluates rhyme quality across 11 dimensions:

| Criterion | Points | What it measures |
|---|---|---|
| Perfect rhyme | +100 | Identical suffix from tonic vowel onward |
| Near rhyme | +70 | Edit distance 1 from perfect rhyme |
| Vowel rhyme | +60 | Same vowel sequence in rhyme zone |
| Onset match | +50 | Same consonant starting the stressed syllable |
| Vowel spine | +40 | Identical vowel skeleton across the whole word |
| Consonantal assimilation | +30 | Shared consonant set (Jaccard >= 0.5) |
| Cluster family | +20 | Same type of consonant cluster |
| Tonic vowel | +15 | Same stressed vowel |
| Rhythm | +10 | Same syllable count + stress pattern |

Score bands: **Rima** (>=160), **Quase-rima** (>=130), **Eco forte** (>=100), **Assonancia** (>=60), **Proximidade** (>=25).

---

## Corpus-backed data

### Rhyme pairs (`data/rhyme_pairs.json`)

**88,482 unique rhyme pairs** extracted from 5,637 songs by analyzing stanza structure (adjacent, alternating, and triplet line pairings). Each pair includes the `calcScore` value, occurrence count, genre distribution, and stanza position pattern.

```
fazer / prazer       score=305  18x  [Brega, Pagode, MPB, Trap, Arrocha]
historia / vitoria   score=305  13x  [Pagode, MPB, Trap]
calor / valor        score=305   5x  [Trap, Arrocha]
canela / janela      score=305   3x  [MPB]
```

Score distribution: 26K perfect rhymes, 7.6K near-rhymes, 7.3K strong echoes, 18.5K assonances, 29K proximities.

### Phrase rhymes (`data/phrase_rhymes.json`)

**170,752 unique multi-word phrase endings** (last 2-3 words of each lyric line), indexed by `rimaPerfeita` suffix. Each entry includes syllable count, genre tags, and occurrence count.

```
"meu coracao"       rima=-ao   4 syl   881x  [Pagode, MPB, Sertanejo, Trap, ...]
"de verdade"        rima=-ade  4 syl   188x  [Pagode, MPB, Sertanejo, Trap, ...]
"de amor"           rima=-or   3 syl   590x  [MPB, Pagode, Brega, Pop/Rock, ...]
"por favor"         rima=-or   3 syl   193x  [Pagode, MPB, Sertanejo, ...]
"sentir saudade"    rima=-ade  5 syl    39x  [Pagode, MPB, Trap, ...]
```

Top rhyme suffixes by phrase count: `-ar` (12.2K), `-ao` (7.3K), `-er` (6.1K), `-or` (3.6K), `-ia` (3.1K).

### Source corpora

| Corpus | Songs | Lines | Genres | Format |
|---|---|---|---|---|
| `letras_final.json` | 478 | 26K | MPB, Sertanejo, Pagode, Brega, Rap, Pop/Rock, Fado | Structured JSON (artist, title, genre, lyrics) |
| `training_corpus.txt` | 5,159 | 207K | MPB, Trap, Pagode, Arrocha, Sertanejo | Markdown-style headers with genre tags |

### Reference grammar

`regras01.txt` and `regras02.txt` contain the formal syllabification and accentuation rules from Evanildo Bechara's *Moderna Gramatica Portuguesa* — diphthongs, hiatuses, consonant clusters, elision, liaison, crase, clitic attachment. These serve as the source of truth for the engine's rule set and as ready-made test cases.

---

## Web interfaces

### Experimental explorer (`exp/index.html`)

The most complete interface. Features:

- **Molde mode**: Search a base word, auto-extract its phonetic profile, lock/unlock individual features
- **Construtor mode**: Build searches from scratch by syllable count, stress pattern, tonic vowel, onset
- **Lego locks**: Three-state filters — unlocked (any) | locked (match) | negated (exclude)
- **Score bands**: Color-coded results (Rima, Quase-rima, Eco, Assonancia, Proximidade, Ritmo)
- **Voice input**: Web Speech API in pt-BR
- **Infinite scroll**: IntersectionObserver-based lazy loading

### GitHub Pages explorer (`docs/index.html`)

Public-facing deployment with compact and full dictionary modes. Uses chunked JSON for fast loading.

### Syllable explorer (`syl/index.html`)

Earlier iteration of the web explorer with version history (v1 through v6).

---

## Python system

The original Python implementation provides a CLI and reasoning-based matcher:

```bash
# Search rhymes
python demo_recato.py

# Sertanejo composition
python compose_sertanejo.py

# Rap rhyme analysis
python analyze_rap_rhymes.py
```

The Python system uses a different scoring approach (0.0-1.0 normalized scores with weighted criteria) and supports context-specific matching modes (general, strict_rhyme, hip_hop, assonance).

---

## For AI assistants

The phonetic engine and corpus data are designed to be used as **tools** by AI assistants. LLMs are unreliable at counting syllables in Portuguese — diphthongs, hiatuses, and nasal vowels trip them up. This system provides deterministic, rule-based analysis that an agent can trust.

Example workflow:

```
User: "Write a sertanejo verse that rhymes with 'coracao', paroxytone"

Agent:
  1. perfilFonetico('coracao') -> target profile (rima='ao', acentuacao='px')
  2. Look up phrase_rhymes.json for rima='ao' entries in Sertanejo genre
  3. Get: "meu coracao" (881x), "no chao" (189x), "de paixao" (101x)
  4. Look up rhyme_pairs.json for high-score pairs with 'coracao'
  5. Get: paixao (score 305), solidao, emocao, ...
  6. Compose verse using verified rhymes and real phrase fragments
```

The phrase rhyme index is especially valuable — it provides multi-word fragments that songwriters actually use, eliminating the need to guess at natural-sounding constructions.

---

## Running the extraction

To regenerate the rhyme pair and phrase data from the corpora:

```bash
node lib/extract-rhyme-data.js [--out-dir ./data]
```

This processes both `upload/letras_final.json` and `upload/training_corpus.txt`, producing `rhyme_pairs.json` and `phrase_rhymes.json` in the output directory.

---

## Roadmap

See [`lib/README.md`](lib/README.md) for the detailed 4-phase roadmap. Key next steps:

1. **Validation** — Unit test the syllabifier against the Bechara grammar examples in `regras01.txt` / `regras02.txt`
2. **Genre-tuned scoring** — Calibrate `calcScore` weights per genre using the empirical rhyme pair distribution
3. **Inverted indexes** — Pre-build lookup tables keyed by `rimaPerfeita`, `vogaisRima`, etc. for O(1) search
4. **Elision model** — Detect vowel elision across word boundaries using corpus evidence
5. **MCP tool server** — Package the engine as a Model Context Protocol server for native AI assistant integration

---

## License

MIT License.
