#!/usr/bin/env python3
"""
Claude Reasoning Demonstration
This shows how Claude Opus 4.5 would reason through phonetic matching
using explicit analytical thinking rather than embeddings
"""


def claude_reasoning_example():
    """
    Demonstrates Claude's reasoning process for analyzing
    'recato' vs 'recado' phonetically
    """

    print("=" * 80)
    print("CLAUDE'S REASONING PROCESS")
    print("How Claude Opus 4.5 analyzes phonetic matches")
    print("=" * 80)

    print("""
TASK: Analyze how well 'recado' matches 'recato' for rhyming/phonetic similarity

GIVEN INFORMATION:
Mother word: recato
  - Syllables: re-ca-to
  - Stress type: paroxítona (stress on second-to-last)
  - Stress position: 2 (second syllable 'ca')
  - Tonic syllable: 'ca'
  - Tonic vowel: 'a'
  - Tonic consonant: 'c'
  - Vowel sequence: e-a-o
  - Consonants: r, c, t
  - Prefix: 're-'
  - Suffix: '-ato'

Candidate word: recado
  - Syllables: re-ca-do
  - Stress type: paroxítona
  - Stress position: 2 (second syllable 'ca')
  - Tonic syllable: 'ca'
  - Tonic vowel: 'a'
  - Tonic consonant: 'c'
  - Vowel sequence: e-a-o
  - Consonants: r, c, d
  - Prefix: 're-'
  - Suffix: '-ado'

════════════════════════════════════════════════════════════════════════════════

STEP 1: PROSODIC ANALYSIS
Question: Do these words have the same rhythmic structure?

Thinking:
- Both are paroxítonas ✓
  → This means they have identical stress patterns
  → In poetry, this creates matching rhythm

- Both have 3 syllables ✓
  → Same length, will occupy same metrical space
  → Important for verse structure

- Stress is in position 2 for both ✓
  → Perfect alignment of stressed syllables
  → Creates rhythmic correspondence

Assessment: PERFECT prosodic match
Score contribution: 1.0 * 0.25 (weight) = 0.25

════════════════════════════════════════════════════════════════════════════════

STEP 2: TONIC CORE ANALYSIS
Question: Does the heart of the rhyme match?

Thinking:
- Tonic syllable: 'ca' vs 'ca' ✓✓✓
  → IDENTICAL! This is the strongest possible signal
  → The entire stressed syllable is the same
  → This creates what Portuguese speakers call "rima rica" (rich rhyme)

- Tonic vowel: 'a' vs 'a' ✓✓
  → Would already be good even without full syllable match
  → Vowel identity is the minimum for rhyme in PT-BR

- Tonic consonant: 'c' vs 'c' ✓
  → Adds quality and color to the rhyme
  → /k/ sound creates matching sonic impact

Assessment: PERFECT tonic core match (identical tonic syllable!)
Score contribution: 1.0 * 0.45 (weight) = 0.45

Note: This alone would make this a very strong rhyme candidate

════════════════════════════════════════════════════════════════════════════════

STEP 3: PHONETIC PATTERNS ANALYSIS
Question: Do the overall sound patterns align?

Thinking:
- Vowel sequence: e-a-o vs e-a-o ✓✓
  → IDENTICAL vowel pattern throughout the word
  → Creates perfect assonance
  → Even if other features didn't match, this would create similarity

- Endings: -ato vs -ado
  → Very similar! Only final consonant differs: t vs d
  → Both are alveolar stops (tongue in same position)
  → /t/ is voiceless, /d/ is voiced - minimal acoustic difference
  → In Brazilian Portuguese, these are very close sounds

- Consonants overall: r,c,t vs r,c,d
  → Share 'r' and 'c' ✓
  → Only difference is final t/d
  → High consonant overlap

Assessment: STRONG phonetic match
Score contribution: ~0.78 * 0.20 (weight) ≈ 0.16

════════════════════════════════════════════════════════════════════════════════

STEP 4: MORPHOLOGICAL ANALYSIS
Question: Do the words share structural elements?

Thinking:
- Prefix: 're-' vs 're-' ✓✓
  → Identical prefix!
  → Both are re- verbs (recatar, recadar conceptually related)
  → Creates semantic-phonetic coherence

- Suffix: '-ato' vs '-ado'
  → Both are participial/nominal endings in Portuguese
  → -ato (noun/adjective): recato (modesty, reserve)
  → -ado (past participle): recado (message)
  → Very similar morphologically - both create agent/result nouns
  → Only difference is the voicing of the final consonant

Assessment: STRONG morphological match
Score contribution: ~0.80 * 0.10 (weight) = 0.08

════════════════════════════════════════════════════════════════════════════════

STEP 5: HOLISTIC JUDGMENT
Question: Would these sound similar when spoken? Would they rhyme well in poetry?

Thinking:
Let me imagine these in context:

  "Guardava em seu recato" (kept in her reserve)
  "Um simples recado" (a simple message)

When spoken:
- re-CA-to
- re-CA-do

The ear would perceive:
1. Identical rhythmic structure (both paroxítonas with 3 syllables)
2. Identical stressed syllable /ka/
3. Identical vowel pattern throughout
4. Only tiny difference: final /to/ vs /do/

In Brazilian Portuguese phonology:
- Word-final /t/ and /d/ are very close
- In rapid speech, they're almost indistinguishable
- Some dialects even merge these sounds

Would a native speaker recognize this as a rhyme?
→ ABSOLUTELY! This is a textbook example of a strong rhyme
→ Would work perfectly in any poetic context
→ Traditional poetry, MPB (música popular brasileira), cordel, rap, etc.

════════════════════════════════════════════════════════════════════════════════

STEP 6: CONTEXTUAL CONSIDERATIONS

For different contexts:

Traditional Poetry (sonnets, etc.):
  → Excellent rhyme (0.94)
  → Identical tonic + minimal ending difference = accepted as perfect

MPB/Popular Music:
  → Perfect rhyme (0.95+)
  → Musicians would consider these interchangeable for rhyming

Hip-hop/Rap:
  → Excellent rhyme (0.94)
  → Strong match on all criteria, perfect for flow

Contemporary Poetry:
  → Very strong rhyme (0.94)
  → Rich rhyme (tonic syllable identity) is valued

Children's Poetry:
  → Excellent (0.94)
  → Clear, strong rhyme that kids would recognize

════════════════════════════════════════════════════════════════════════════════

FINAL SCORE CALCULATION:

Prosodic:        0.25
Tonic Core:      0.45
Phonetic:        0.16
Morphological:   0.08
─────────────────────
TOTAL:           0.94

LEVEL: PERFECT MATCH (0.90-1.00)

════════════════════════════════════════════════════════════════════════════════

EXPLANATION:

'recado' and 'recato' form a near-perfect phonetic match. The identical tonic
syllable 'ca' creates what Portuguese prosody calls a "rima rica" (rich rhyme) -
where not just the vowel but the entire stressed syllable matches. Combined with
perfect prosodic correspondence (both paroxítonas, 3 syllables, stress position 2)
and identical vowel sequences (e-a-o), these words create a very strong rhyme.

The only difference is the final consonant (t vs d), which are both alveolar
stops differing only in voicing - an extremely minimal acoustic difference in
Brazilian Portuguese. In many dialects and in rapid speech, these would be
essentially indistinguishable.

This would be recognized as an excellent rhyme by any native PT-BR speaker and
would work perfectly in any poetic or musical context.

CONFIDENCE: Very High
NATIVE SPEAKER VALIDATION: Would unanimously agree this is a strong rhyme

════════════════════════════════════════════════════════════════════════════════
""")

    print("\n" + "=" * 80)
    print("KEY INSIGHT")
    print("=" * 80)
    print("""
This reasoning process demonstrates why Claude's approach is powerful:

1. EXPLAINABILITY
   - Every decision is transparent
   - Can trace exactly why score is 0.94 vs 0.85
   - Can explain to non-experts

2. CONTEXT-AWARENESS
   - Can adjust weights for different uses
   - Understands cultural/linguistic context
   - Knows what matters to native speakers

3. EDGE CASE HANDLING
   - Can reason through ambiguous cases
   - Considers dialectal variation
   - Weighs multiple competing factors

4. FEW-SHOT LEARNING
   - From 5-10 examples, Claude learns patterns
   - Generalizes to new words
   - Doesn't need thousands of training examples

This beats both:
- Rigid rule systems (too inflexible)
- Black-box embeddings (not explainable)
    """)


if __name__ == "__main__":
    claude_reasoning_example()
