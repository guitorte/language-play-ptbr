# PT-BR Phonetic Matching System

**Reasoning-based phonetic analysis optimized for Claude Opus 4.5**

A multi-criteria phonetic matching system for Brazilian Portuguese that uses explicit reasoning rather than black-box embeddings. Designed to leverage Claude's analytical strengths for rhyme detection, poetry analysis, and linguistic research.

## 🚀 Quick Start - Google Colab (Recommended!)

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/guitorte/language-play-ptbr/blob/claude/analyze-word-syllables-zn3b8/RimaBR_Colab.ipynb)

**No installation needed!** Click the badge above to run RimaBR instantly in your browser with Google Colab.

[📖 Read Colab Guide](README_COLAB.md)

## Overview

Traditional rhyme theory gives binary "rhyme" or "no rhyme" classifications. This system provides:

- ✅ **Graduated numerical scores** (0.00-1.00)
- ✅ **Detailed reasoning** for each criterion
- ✅ **Transparent decision-making**
- ✅ **Context-adaptable weights**
- ✅ **Explainable results**

## Why This Approach for Claude?

Claude Opus 4.5 excels at:
- **Structured reasoning** over pattern matching
- **Multi-dimensional analysis** with complex trade-offs
- **Contextual adaptation** (hip-hop vs traditional poetry)
- **Few-shot learning** from examples
- **Explainability** - articulating "why"

This system is designed around these strengths rather than requiring black-box ML embeddings.

## Quick Start

### Demo (Python)

```bash
python3 demo_recato.py
```

This analyzes the word "recato" against 10 candidates, showing:
- Phonetic decomposition
- Multi-criteria reasoning
- Scored ranking with explanations

### Web Explorer (Vanilla JS)

**Interactive phonetic explorer for Brazilian Portuguese rhyme exploration.**

```bash
cd syl/
python -m http.server 8000
# Open: http://localhost:8000/index.html
```

**Features:**
- 🔍 **Molde**: Search a base word, auto-extract phonetic profile, lock/unlock filters, negate criteria
- 🏗️ **Construtor**: Build searches directly by syllable count, accentuation, tonic vowel, onset
- ✨ **Lego Locks**: Three states — unlocked (gray) | locked (orange 🔒) | negated (red ≠)
- 📜 **Infinite Scroll**: Silent loading with IntersectionObserver (60-item chunks)
- 🎤 **Voice Input**: Web Speech API in pt-BR
- 📊 **Score Bands**: Color-coded faixas (Rima, Eco, Assonância, Proximidade, Ritmo)

[Detailed web tool documentation](syl/README-explorer.md)

### Example Output

```
Word: recado
Score: 0.94 (PERFECT MATCH)

Reasoning:
  Prosodic: ✓ Both paroxítona | ✓ Same syllable count (3) | ✓ Same stress position (2)
  Tonic Core: ✓✓✓ IDENTICAL tonic syllable: 'ca'
  Phonetic: Vowel sequence: e-a-o vs e-a-o (sim: 1.00) | Same ending: -o
  Morphological: ✓ Shared prefix: 're-' | △ Similar suffixes: '-ato' vs '-ado'

Score Breakdown:
  prosodic: 0.250
  tonic_core: 0.450
  phonetic: 0.157
  morphological: 0.080

Explanation: Excellent match - identical tonic syllable 'ca' creates perfect rhyme
```

## System Architecture

```
┌─────────────────────────────────────┐
│  1. PHONETIC ANALYZER               │
│     (Rule-based decomposition)      │
│     - Syllabification               │
│     - Stress detection              │
│     - Feature extraction            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. REASONING MATCHER               │
│     (Multi-criteria analysis)       │
│     - Prosodic match                │
│     - Tonic core match              │
│     - Phonetic patterns             │
│     - Morphological relations       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. CONTEXTUAL SCORING              │
│     (Adaptive weighting)            │
│     - General rhyme                 │
│     - Strict rhyme                  │
│     - Assonance                     │
│     - Hip-hop/rap                   │
└─────────────────────────────────────┘
```

## Multi-Criteria Analysis

### 1. Prosodic Match (Weight: 0.25)
- **Stress type**: oxítona, paroxítona, proparoxítona
- **Syllable count**: Number of syllables
- **Stress position**: Position from end

### 2. Tonic Core Match (Weight: 0.45) - MOST IMPORTANT
- **Tonic syllable**: Complete stressed syllable
- **Tonic vowel**: Vowel in stressed syllable (critical for rhyme)
- **Tonic consonant**: Consonant in stressed syllable

### 3. Phonetic Patterns (Weight: 0.20)
- **Vowel sequences**: Pattern of vowels throughout word
- **Consonant overlap**: Shared consonants
- **Ending similarity**: Post-tonic sounds

### 4. Morphological Relations (Weight: 0.10)
- **Prefixes**: re-, des-, in-, anti-, etc.
- **Suffixes**: -ado, -ato, -oso, -mente, etc.

## Usage

### Basic Analysis

```python
from src import PTBRPhoneticAnalyzer, ReasoningBasedMatcher

# Analyze a word
analyzer = PTBRPhoneticAnalyzer()
features = analyzer.analyze("recato")
print(features.syllables)  # ['re', 'ca', 'to']
print(features.tonic_syllable)  # 'ca'

# Match candidates
matcher = ReasoningBasedMatcher(context="general")
score = matcher.score_pair("recato", "recado")
print(score.score)  # 0.94
print(score.explanation)  # Detailed explanation
```

### Context-Specific Matching

```python
# For traditional poetry (strict rhyme)
matcher = ReasoningBasedMatcher(context="strict_rhyme")

# For hip-hop (near-rhymes acceptable)
matcher = ReasoningBasedMatcher(context="hip_hop")

# For assonance (vowel patterns)
matcher = ReasoningBasedMatcher(context="assonance")
```

### Ranking Multiple Candidates

```python
candidates = ["recado", "acato", "pescado", "cedo"]
matches = matcher.rank_candidates("recato", candidates)

for match in matches:
    print(f"{match.word}: {match.score:.2f} - {match.level}")
```

## Scoring Levels

| Score | Level | Description |
|-------|-------|-------------|
| 0.90-1.00 | Perfect Match | Identical tonic syllable or near-perfect correspondence |
| 0.75-0.89 | Strong Match | Identical tonic vowel + strong prosodic match |
| 0.60-0.74 | Good Match | Tonic vowel match + some similarities |
| 0.40-0.59 | Weak Match | Some correspondence, loose rhyme |
| 0.20-0.39 | Poor Match | Minimal correspondence |
| 0.00-0.19 | No Match | Fundamentally different |

## PT-BR Specific Features

### Stress Types
- **Oxítona**: Stress on last syllable (e.g., "café")
- **Paroxítona**: Stress on second-to-last (e.g., "casa")
- **Proparoxítona**: Stress on third-to-last (e.g., "médico")

### Phonetic Considerations
- Open vs closed vowels (é ≠ ê, ó ≠ ô)
- Nasal vowels (ã, õ, em, en)
- Diphthongs vs hiatus
- Regional variations

## Using with Claude API

### Prompt Template

See `src/prompts/claude_reasoning.xml` for the complete reasoning system prompt.

```python
# Example API usage (requires Anthropic API key)
import anthropic

client = anthropic.Client(api_key="your-key")

# Analyze word pair
features1 = analyzer.analyze("recato")
features2 = analyzer.analyze("recado")

prompt = f"""
Using the phonetic matching system, analyze:

Mother word: {features1.to_dict()}
Candidate: {features2.to_dict()}

Provide structured reasoning and score.
"""

response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2000,
    messages=[{"role": "user", "content": prompt}]
)
```

## Comparison with Approaches

| Aspect | Traditional Rules | ML Embeddings | **This System** |
|--------|-------------------|---------------|-----------------|
| Accuracy | High (rigid) | Medium-High | **Very High** |
| Flexibility | Low | High | **Very High** |
| Explainability | Medium | Very Low | **Excellent** |
| Context-awareness | Low | Medium | **Excellent** |
| Few-shot learning | None | Medium | **Excellent** |
| Edge cases | Poor | Medium | **Strong** |
| Computational cost | Very Low | Low | Medium |

## Example: Complete Analysis

From the demo (`recato` vs candidates):

```
RANKING:
1. recado     0.94  (Perfect Match)  - Identical tonic 'ca' + full prosody
2. acato      0.90  (Perfect Match)  - Identical tonic 'ca'
3. pescado    0.87  (Strong Match)   - Identical tonic 'ca'
4. abstrato   0.72  (Good Match)     - Same tonic vowel 'a'
5. recito     0.65  (Good Match)     - Same prosody, different vowel
6. acetato    0.61  (Good Match)     - Tonic 'a', different structure
7. indignado  0.54  (Weak Match)     - Some correspondence
8. absurdo    0.32  (Poor Match)     - Different tonic vowel
9. cedo       0.29  (Poor Match)     - Minimal overlap
10. átrio     0.20  (Poor Match)     - Different stress type
```

## Project Structure

```
ptbrwp/
├── syl/
│   ├── index.html                  # Web explorer (v3 Bottom Sheet)
│   ├── palavras.txt                # Dictionary (~51.8K words)
│   ├── README-explorer.md          # Web tool documentation
│   └── [backups/]
│       ├── index-v2-flatheader.html
│       └── index-v1-bandas.html
├── src/
│   ├── analyzers/
│   │   └── phonetic_analyzer.py    # Rule-based decomposition
│   ├── matchers/
│   │   └── reasoning_matcher.py    # Multi-criteria scoring
│   ├── utils/
│   │   └── syllabifier.py          # PT-BR syllabification
│   └── prompts/
│       └── claude_reasoning.xml    # Reasoning system prompt
├── demo_recato.py                  # Python demonstration
├── README.md                       # This file
└── README_COLAB.md                 # Google Colab guide
```

## Limitations & Future Work

### Current Limitations
1. **Syllabification**: Works well but not perfect for all edge cases
2. **IPA Transcription**: Not yet implemented
3. **Regional Variations**: Doesn't account for dialectal differences
4. **Semantic Relations**: Doesn't consider meaning

### Future Improvements
1. Enhanced syllabifier with complete PT-BR phonotactic rules
2. IPA transcription for precise phonetic representation
3. Regional dialect models (Carioca, Paulista, Nordestino, etc.)
4. Semantic coherence scoring
5. Poetry meter analysis (decasílabo, redondilha, etc.)

## Can Claude Run This?

**What Claude CAN do:**
- ✅ Build and run the phonetic analyzer (done!)
- ✅ Create reasoning templates for API use (done!)
- ✅ Demonstrate reasoning approach directly (done!)
- ✅ Analyze words using this framework (done!)

**What Claude CANNOT do:**
- ❌ Call Anthropic API (no API key in environment)
- ❌ Deploy as production service without API access

**Solution:**
- Use the demo to see how it works NOW
- Use the prompts (`src/prompts/claude_reasoning.xml`) with Claude API
- Integrate with your own applications

## License

MIT License - feel free to use, modify, and distribute.

## Contributing

This is a research/demonstration project. Contributions welcome for:
- Improved syllabification algorithms
- Additional PT-BR phonetic rules
- Context-specific weight tuning
- Regional dialect support

## Citation

If you use this system in research:

```
PT-BR Phonetic Matching System (2024)
Reasoning-based approach optimized for Claude Opus 4.5
```

## Questions?

This system demonstrates how Claude's reasoning abilities can be leveraged for linguistic analysis in ways that surpass traditional approaches or black-box embeddings.

The key insight: **Claude doesn't need to memorize phonetic patterns - it can reason through them explicitly.**
