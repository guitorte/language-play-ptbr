# Implementation Plan: RimaBR for GitHub Pages

## Research Summary

### How RhymeZone Works

RhymeZone (est. 1996, by Doug Beeferman) is powered by the **Datamuse API** and uses
these core components:

1. **CMU Pronouncing Dictionary** — Maps ~134k English words to ARPABET phoneme sequences
   with stress markers (0=unstressed, 1=primary, 2=secondary)
2. **Reversed phoneme trie** — Words indexed by reversed phoneme suffix for O(m) rhyme
   lookup (where m = length of rhyming part)
3. **Rhyme extraction algorithm** — Extracts everything from the **last stressed vowel**
   to end of word; words sharing that suffix are perfect rhymes
4. **Near-rhyme scoring** — Combines phonetic distance, song-lyric co-occurrence,
   Google Ngrams frequency, and 10+ years of user search logs
5. **WordNet 3.0** — Synonyms, antonyms, hypernyms for semantic features
6. **Results grouped by syllable count**, filterable by meter pattern (x/, /x, etc.)

### Key Features to Replicate

| RhymeZone Feature            | PT-BR Equivalent                          | Priority |
|-------------------------------|-------------------------------------------|----------|
| Perfect rhymes                | Rima consoante/perfeita                   | P0       |
| Near/approximate rhymes       | Rima toante/assonante                     | P0       |
| Syllable count grouping       | Agrupamento por silabas                   | P0       |
| Stress type filter            | Filtro: oxitona/paroxitona/proparoxitona  | P0       |
| Score-ranked results          | Pontuacao de qualidade                    | P0       |
| Mobile-responsive UI          | Interface responsiva                      | P0       |
| Dark mode                     | Modo escuro                               | P1       |
| Meter filter (x/, /x)        | Filtro metrico                            | P2       |
| Consonant match               | Correspondencia consonantal               | P2       |
| Synonyms/antonyms             | Sinonimos/antonimos (needs external data) | P3       |

### The Fundamental Constraint: GitHub Pages = Static Only

GitHub Pages serves **static files only** — no Python, no Flask, no SQLite. The current
RimaBR architecture (Python + Flask + SQLite) cannot run on GitHub Pages at all. We need
a fundamentally different architecture.

---

## Architecture: Pre-indexed Static Data + Client-Side JS Engine

### Strategy: "Compile-time Python, Runtime JavaScript"

```
BUILD PHASE (Python, runs locally)         RUNTIME (JS, runs in browser)
┌──────────────────────────┐               ┌──────────────────────────┐
│ 1. Load word list (52k)  │               │ 1. User types word       │
│ 2. Analyze each word     │               │ 2. JS analyzes the word  │
│    (syllables, stress,   │  ──deploy──>  │ 3. Look up matching      │
│     tonic vowel, ending) │               │    chunk from manifest   │
│ 3. Group into "rhyme     │               │ 4. Score candidates      │
│    buckets" by ending    │               │ 5. Display ranked results│
│ 4. Export as JSON chunks │               │    grouped by syllables  │
└──────────────────────────┘               └──────────────────────────┘
```

### Data Pipeline

**Step 1: Pre-compute phonetic features (Python)**

Use the existing `PTBRPhoneticAnalyzer` to analyze every word in `kpalavras.txt` (52k
words — the full 320k list would produce ~100MB+ of JSON, too large for client-side).

For each word, extract:
- Syllables and syllable count
- Stress type (ox/parox/proparox)
- Tonic vowel
- "Rhyme key" = everything from tonic vowel to end of word (normalized)
- Word ending (last 2-3 chars)

**Step 2: Build rhyme index (Python)**

Group words by their **rhyme key** (the part from tonic vowel onward). This is the
core lookup structure — words sharing a rhyme key are perfect rhymes.

```
rhyme_keys = {
  "or":    ["amor", "calor", "dor", "flor", "valor", ...],
  "ção":   ["coração", "paixão", "emoção", "canção", ...],
  "ade":   ["cidade", "saudade", "verdade", ...],
  ...
}
```

**Step 3: Export as chunked JSON (Python)**

Split the index into manageable files to avoid loading everything at once:

```
docs/
├── index.html
├── data/
│   ├── manifest.json        # Maps rhyme keys to chunk files + metadata
│   ├── chunks/
│   │   ├── chunk_00.json    # Words grouped by rhyme key, ~200-500 entries each
│   │   ├── chunk_01.json
│   │   └── ...
│   └── autocomplete.json    # Word list for search suggestions (~52k words, ~400KB)
├── css/
│   └── style.css
└── js/
    ├── app.js               # UI logic
    ├── analyzer.js           # PT-BR phonetic analyzer (ported from Python)
    ├── matcher.js            # Rhyme scoring engine (ported from Python)
    └── search.js             # Search orchestration + chunk loading
```

**Manifest format** (compact):
```json
{
  "version": 1,
  "totalWords": 51863,
  "chunks": {
    "or":   { "file": "chunks/chunk_00.json", "count": 342 },
    "ção":  { "file": "chunks/chunk_01.json", "count": 587 },
    ...
  },
  "nearRhymeMap": {
    "or": ["ar", "er", "ir", "ur"],
    "ção": ["são", "dão"],
    ...
  }
}
```

**Chunk format** (compact, abbreviated keys to save bytes):
```json
[
  {"w":"amor","s":["a","mor"],"n":2,"t":"ox","v":"o"},
  {"w":"calor","s":["ca","lor"],"n":2,"t":"ox","v":"o"},
  ...
]
```

Where: w=word, s=syllables, n=syllable_count, t=stress_type, v=tonic_vowel

### Client-Side Matching Algorithm (JavaScript)

1. **Analyze query word** — Port of `PTBRPhoneticAnalyzer` to JS:
   - Syllabify using PT-BR rules
   - Detect stress position and type
   - Extract rhyme key (tonic vowel to end)

2. **Perfect rhyme lookup** — Look up the rhyme key in the manifest, fetch the
   corresponding chunk, return all words in that bucket

3. **Near rhyme expansion** — Use the `nearRhymeMap` to find related rhyme keys
   (e.g., "or" → also check "ar", "er"), fetch those chunks, score each candidate
   using a simplified version of `ReasoningBasedMatcher`

4. **Score and rank** — Multi-criteria scoring (prosodic, tonic core, phonetic,
   morphological) with context-aware weights

5. **Group by syllable count** and display

### Near-Rhyme Strategy for PT-BR

Define **phonetic similarity classes** specific to Brazilian Portuguese:

```
Vowel classes (tonic position):
  /a/ ↔ /ã/           (oral ↔ nasal)
  /e/ ↔ /ɛ/ ↔ /ẽ/    (close-mid ↔ open-mid ↔ nasal)
  /o/ ↔ /ɔ/ ↔ /õ/    (close-mid ↔ open-mid ↔ nasal)
  /i/ ↔ /ĩ/
  /u/ ↔ /ũ/

Ending classes:
  -or ↔ -ar ↔ -er ↔ -ir ↔ -ur    (same coda, different vowel)
  -ção ↔ -são ↔ -dão              (nasal diphthong variants)
  -ado ↔ -ato ↔ -aco              (same vowel pattern, different coda)
  -mente ↔ -ente ↔ -ente          (shared suffix patterns)
```

---

## Implementation Steps

### Phase 1: Build Pipeline (Python scripts)

**1.1 Create `build_index.py`** — Reads word list, analyzes each word using existing
    `PTBRPhoneticAnalyzer`, groups by rhyme key, exports manifest + chunks to `docs/data/`

**1.2 Create `docs/` directory** — GitHub Pages source directory

**1.3 Generate autocomplete data** — Sorted word list as JSON for search suggestions

### Phase 2: Port Phonetic Engine to JavaScript

**2.1 Create `docs/js/analyzer.js`** — Port of `PTBRPhoneticAnalyzer`:
- `syllabify(word)` — PT-BR syllabification rules
- `detectStress(word, syllables)` — Stress detection from accent marks + default rules
- `extractRhymeKey(word)` — The critical function: tonic vowel to end of word
- `analyzeWord(word)` — Full analysis returning features object

**2.2 Create `docs/js/matcher.js`** — Port of `ReasoningBasedMatcher`:
- `scorePair(queryFeatures, candidateFeatures)` — Multi-criteria scoring
- `rankCandidates(queryFeatures, candidates)` — Sort by score
- Context presets: general, strict_rhyme, assonance, hip_hop

**2.3 Create `docs/js/search.js`** — Search orchestration:
- Load manifest on page init
- Fetch chunks on demand (with caching)
- Coordinate perfect + near rhyme lookups
- Return merged, deduplicated, ranked results

### Phase 3: User Interface

**3.1 Create `docs/index.html`** — Single-page app:
- Search bar with debounced input
- Tab navigation: Rimas Perfeitas | Rimas Aproximadas | Assonancia
- Results area with syllable-count grouping
- Filter sidebar: stress type, syllable range
- Genre context selector: Geral, Rap/Hip-Hop, Sertanejo, MPB
- Stats footer
- Portuguese-language UI throughout

**3.2 Create `docs/css/style.css`** — Responsive design:
- CSS Grid layout
- Mobile-first breakpoints
- Dark mode via CSS custom properties + toggle
- Score badge colors (matching existing design)
- Smooth transitions

**3.3 Wire up `docs/js/app.js`** — UI logic:
- Search event handling
- Filter state management
- Results rendering with grouping
- Dark mode toggle
- Autocomplete dropdown
- URL hash routing (so searches are shareable)

### Phase 4: GitHub Pages Deployment

**4.1 Configure GitHub Pages** — Set source to `docs/` directory on the branch

**4.2 Add build instructions** — Document how to regenerate data if word list changes

**4.3 Create `.github/workflows/` (optional)** — Auto-build on word list changes

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Word list size | 52k (kpalavras.txt) | 320k produces too much JSON for client-side; 52k covers common vocabulary well |
| Data format | Chunked JSON | Simple, browser-native, gzip-compressible |
| JS framework | Vanilla JS (no React/Vue) | Matches existing webapp approach; zero build step; fast load |
| Rhyme key | Orthographic ending from tonic vowel | Simpler than full IPA; works well for PT-BR where spelling is mostly phonetic |
| Near-rhyme strategy | Pre-computed similarity map | Avoids expensive runtime computation across all chunks |
| GitHub Pages source | `docs/` directory | Standard convention; keeps source and output in same repo |
| CSS approach | Custom properties + media queries | No build tools needed; dark mode support built-in |

## File Structure (Final)

```
language-play-ptbr/
├── (existing files unchanged)
├── build_index.py              # NEW: Build pipeline
├── docs/                       # NEW: GitHub Pages root
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── analyzer.js         # PT-BR phonetic analysis
│   │   ├── matcher.js          # Rhyme scoring
│   │   ├── search.js           # Search orchestration
│   │   └── app.js              # UI logic
│   └── data/
│       ├── manifest.json       # Rhyme key → chunk mapping
│       ├── autocomplete.json   # Word list for suggestions
│       └── chunks/             # Pre-indexed word groups
│           ├── chunk_00.json
│           ├── chunk_01.json
│           └── ...
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| 52k words still too large for autocomplete | Use a trie structure or binary search on sorted array; lazy-load suggestions |
| Chunk files too numerous (hundreds of endings) | Merge small rhyme groups into combined chunks; target ~50-100 chunk files |
| Syllabifier accuracy | Port the enhanced `PTBRSyllabifier` with override dict; test against known words |
| Stress detection edge cases | PT-BR stress is mostly predictable from orthography; accent marks resolve ambiguity |
| Near-rhyme quality | Start with manually curated similarity classes; iterate based on testing |
| GitHub Pages 100MB repo limit | 52k words with compact JSON should stay well under 10MB total |
