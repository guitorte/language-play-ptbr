# RimaBR — Project Context for Claude Code

## What this project is

A rule-based phonetic analysis system for Brazilian Portuguese (PT-BR), built for rhyme search, lyric composition, and linguistic research. The core is `lib/motor-fonetico.js` — a zero-dependency JS module that handles syllabification, stress detection, and multi-criteria rhyme scoring.

## Key files and what they do

- `lib/motor-fonetico.js` — Core engine. All phonetic rules as regex + lookup tables. Functions: `silabificar`, `perfilFonetico`, `calcScore`, and 12+ feature extractors.
- `lib/extract-rhyme-data.js` — Extraction pipeline. Processes song corpora into rhyme pair and phrase rhyme datasets.
- `data/rhyme_pairs.json` — 88K empirical rhyme pairs from 5,637 songs. Fields: pair, score, count, genres, positions.
- `data/phrase_rhymes.json` — 170K multi-word phrase endings indexed by `rimaPerfeita`. Fields: phrase, rima, syllables, genres, count.
- `upload/letras_final.json` — 478 songs (structured JSON: artist/genre/lyrics).
- `upload/training_corpus.txt` — 5,159 songs (markdown headers with genre tags).
- `upload/regras01.txt`, `regras02.txt` — Bechara grammar rules (syllabification + accentuation). Source of truth for engine rules.
- `exp/index.html` — Full-featured web rhyme explorer (Molde/Construtor modes, lego locks, score bands, voice input).
- `docs/` — GitHub Pages deployment with chunked word indexes.
- `syl/` — Earlier explorer versions (v1-v6).
- `src/` — Python system (phonetic_analyzer, reasoning_matcher, syllabifier, claude_reasoning.xml prompt).

## Phonetic profile fields (perfilFonetico output)

`palavra`, `silabas`, `tonicaIndex`, `numSilabas`, `acentuacao` (ox/px/ppx/spx), `rimaPerfeita`, `vogaisRima`, `onsetTonico`, `vogalTonica`, `espinhaVocal`, `assConsonantal`, `familiaCluster`, `coda`, `classe` (sub/adj/vrb/adv/outro), `freq` (comum/media/rara).

## Scoring system (calcScore, 0-325 max)

Perfect rhyme +100, Near rhyme +70, Approx rhyme +40, Vowel rhyme +60, Onset +50, Partial onset +25, Vowel spine +40, Consonantal assim. +30, Cluster family +20, Tonic vowel +15, Rhythm +10.

Bands: Rima (>=160), Quase-rima (>=130), Eco forte (>=100), Assonancia (>=60), Proximidade (>=25), Ritmo (>=10).

## Composition principles discovered

These were deduced from analyzing the corpus data and phonetic engine together. See `docs/composicao-principios.md` for the full analysis with a worked example.

1. **PT-BR morphology is a rhyme machine** — Top corpus suffixes (-ar, -ao, -er, -or, -ia) are verb/noun endings. Huge natural rhyme clusters. The challenge is avoiding cliche, not finding rhyme.
2. **Perfect rhyme is the floor, not the ceiling** — 26K of 88K pairs are perfect. What separates good from generic is intentional use of near-rhyme, echo, and assonance.
3. **The real unit is the phrase, not the word** — "sentir saudade"/"de verdade" matters more than "saudade"/"verdade". The phrase index shows real songwriter constructions.
4. **Stress pattern = rhythmic skeleton** — Oxitonas at line-end = open, dramatic (sertanejo, pagode). Paroxitonas = introspective (MPB). Mixing without intention breaks flow.
5. **Vowel spine (espinhaVocal) = hidden melody** — Words with similar vowel spines sing similarly even without end-rhyme. This is the dimension that separates craft from coincidence.
6. **AABB accelerates, ABAB breathes** — Rhyme scheme choice controls pacing. AABB for urgency/comedy, ABAB for narrative.
7. **Corpus deviation = surprise** — Using a word in an unexpected rhyme position (not its usual corpus pair) creates freshness. The corpus data lets you know what's expected so you can subvert it.
8. **Genre is encoded in rhyme strategy** — Trap: assonance + internal + polysyllabic. Sertanejo: clean oxitona end-rhymes. MPB: sophisticated near-rhymes. Pagode: high-frequency pairs.

## Coding conventions

- `motor-fonetico.js` is a single-file module. No build step. Works in Node/Deno/Bun/browser.
- Function names in Portuguese: `silabificar`, `perfilFonetico`, `calcScore`, `normV`, `calcOnset`, etc.
- Profile field names in Portuguese: `silabas`, `acentuacao`, `rimaPerfeita`, `vogalTonica`, `espinhaVocal`, etc.
- Data files use JSON. Corpora mix JSON and markdown-style text.
- Web interfaces are vanilla JS, no frameworks.
- Python system uses classes: `PTBRPhoneticAnalyzer`, `ReasoningBasedMatcher`.

## Active roadmap priorities

1. Unit test syllabifier against Bechara grammar rules (regras01.txt/regras02.txt)
2. Genre-tuned calcScore weights using empirical pair distribution
3. Inverted indexes (rimaPerfeita, vogaisRima, espinhaVocal) for O(1) lookup
4. Elision model for cross-word-boundary syllable reduction
5. MCP tool server for native AI assistant integration
