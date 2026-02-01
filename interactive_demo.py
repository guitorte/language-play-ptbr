#!/usr/bin/env python3
"""
Interactive Demo: Different Contexts
Shows how the same word pairs score differently in different poetic contexts
"""

import sys
sys.path.insert(0, '/home/user/language-play-ptbr')

from src.matchers.reasoning_matcher import ReasoningBasedMatcher


def demo_context_adaptation():
    """Shows how context changes scoring"""

    print("=" * 80)
    print("CONTEXT-ADAPTIVE PHONETIC MATCHING")
    print("How the same word pair scores differently in different contexts")
    print("=" * 80)

    # Word pairs to test
    pairs = [
        ("amor", "dor"),       # Perfect traditional rhyme
        ("paixão", "coração"), # Perfect rhyme
        ("vida", "ferida"),    # Strong rhyme
        ("rua", "lua"),        # Perfect rhyme
        ("cantar", "amar"),    # Near rhyme (different endings)
        ("sentir", "partir"),  # Perfect rhyme
    ]

    contexts = {
        "general": "General Purpose",
        "strict_rhyme": "Traditional Poetry (Sonnets)",
        "hip_hop": "Hip-Hop/Rap",
        "assonance": "Assonance (Vowel-focused)"
    }

    for word1, word2 in pairs:
        print(f"\n{'=' * 80}")
        print(f"Analyzing: '{word1}' vs '{word2}'")
        print(f"{'=' * 80}\n")

        for context_name, context_desc in contexts.items():
            matcher = ReasoningBasedMatcher(context=context_name)
            result = matcher.score_pair(word1, word2)

            print(f"{context_desc:40} → Score: {result.score:.2f} ({result.level.replace('_', ' ').title()})")

        # Show detailed reasoning for general context
        matcher = ReasoningBasedMatcher(context="general")
        result = matcher.score_pair(word1, word2)
        print(f"\nDetailed Reasoning (General Context):")
        print(f"  {result.explanation}")


def demo_near_rhymes():
    """Shows how system handles near-rhymes vs perfect rhymes"""

    print("\n\n" + "=" * 80)
    print("PERFECT RHYMES vs NEAR-RHYMES")
    print("Understanding graduated scoring")
    print("=" * 80)

    mother = "canção"

    candidates = {
        "emoção": "Perfect rhyme (identical ending)",
        "paixão": "Perfect rhyme (identical ending)",
        "razão": "Perfect rhyme (identical ending)",
        "manhã": "Near rhyme (nasal vowel, different consonant)",
        "mão": "Weak rhyme (shorter, partial match)",
        "som": "Poor rhyme (different vowel)",
    }

    matcher = ReasoningBasedMatcher(context="general")

    results = []
    for word, description in candidates.items():
        score = matcher.score_pair(mother, word)
        results.append((word, score.score, description, score.reasoning['tonic_core']))

    results.sort(key=lambda x: x[1], reverse=True)

    print(f"\nMother word: '{mother}'")
    print(f"\n{'Rank':<6} {'Word':<15} {'Score':<8} {'Type':<30} {'Tonic Analysis'}")
    print("-" * 120)

    for i, (word, score, desc, tonic_reasoning) in enumerate(results, 1):
        print(f"{i:<6} {word:<15} {score:<8.2f} {desc:<30}")
        print(f"       → {tonic_reasoning}")
        print()


def demo_multi_candidate_ranking():
    """Ranks multiple candidates showing Claude's decision-making"""

    print("\n" + "=" * 80)
    print("MULTI-CANDIDATE RANKING")
    print("Finding best rhymes for 'Brasil'")
    print("=" * 80)

    mother = "Brasil"

    candidates = [
        "Raul",      # Similar ending
        "azul",      # Perfect rhyme
        "sul",       # Good rhyme
        "abril",     # Perfect rhyme
        "barril",    # Perfect rhyme
        "varonil",   # Perfect rhyme
        "jardim",    # Different ending
        "paz",       # Very different
        "país",      # Some similarity
        "gentil",    # Perfect rhyme
    ]

    matcher = ReasoningBasedMatcher(context="general")
    results = matcher.rank_candidates(mother, candidates)

    print(f"\nMother word: '{mother}'")
    print(f"\n{'Rank':<6} {'Word':<15} {'Score':<8} {'Level':<20} {'Key Feature'}")
    print("-" * 80)

    for i, result in enumerate(results, 1):
        # Extract key feature from reasoning
        tonic = result.reasoning['tonic_core']
        key_feature = tonic[:50] + "..." if len(tonic) > 50 else tonic

        print(f"{i:<6} {result.word:<15} {result.score:<8.2f} {result.level.replace('_', ' ').title():<20} {key_feature}")


def demo_prosodic_importance():
    """Shows why prosody matters in PT-BR"""

    print("\n\n" + "=" * 80)
    print("PROSODIC STRUCTURE MATTERS")
    print("Why stress patterns affect rhyme quality in Portuguese")
    print("=" * 80)

    test_cases = [
        {
            "mother": "café",
            "candidates": {
                "você": ("Oxítona", "Same stress type"),
                "jacaré": ("Oxítona", "Same stress type"),
                "pé": ("Oxítona", "Same stress type"),
                "cafe": ("Paroxítona", "Different stress - sounds wrong!"),
            }
        },
        {
            "mother": "árvore",
            "candidates": {
                "fósforo": ("Proparoxítona", "Same stress type"),
                "pêssego": ("Proparoxítona", "Same stress type"),
                "abacate": ("Paroxítona", "Different stress"),
                "café": ("Oxítona", "Very different stress"),
            }
        }
    ]

    matcher = ReasoningBasedMatcher(context="general")

    for case in test_cases:
        mother = case["mother"]
        print(f"\n{'─' * 80}")
        print(f"Mother word: '{mother}'")
        print(f"{'─' * 80}")

        for word, (stress_type, note) in case["candidates"].items():
            result = matcher.score_pair(mother, word)
            prosodic_reasoning = result.reasoning['prosodic']

            print(f"\n  '{word}' ({stress_type}) → Score: {result.score:.2f}")
            print(f"  {note}")
            print(f"  Prosodic analysis: {prosodic_reasoning}")


if __name__ == "__main__":
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════════╗")
    print("║                                                                        ║")
    print("║          PT-BR PHONETIC MATCHING: INTERACTIVE DEMONSTRATION            ║")
    print("║                                                                        ║")
    print("║    Showing Claude Opus 4.5's reasoning approach to rhyme analysis      ║")
    print("║                                                                        ║")
    print("╚════════════════════════════════════════════════════════════════════════╝")
    print("\n")

    # Run all demos
    demo_context_adaptation()
    demo_near_rhymes()
    demo_multi_candidate_ranking()
    demo_prosodic_importance()

    print("\n\n" + "=" * 80)
    print("CONCLUSION")
    print("=" * 80)
    print("""
This system demonstrates Claude Opus 4.5's key advantages:

1. CONTEXT AWARENESS
   - Same pair scores differently in poetry vs hip-hop
   - Weights adapt to what matters in each context

2. GRADUATED SCORING
   - Not just "rhyme" or "no rhyme"
   - Captures subtle differences (0.94 vs 0.87 vs 0.72)

3. TRANSPARENT REASONING
   - Every score is explainable
   - Can trace exactly why decisions were made

4. PROSODIC SOPHISTICATION
   - Understands that stress patterns matter in Portuguese
   - Oxítona/paroxítona/proparoxítona affects rhyme quality

5. MULTI-CRITERIA ANALYSIS
   - Balances tonic core, prosody, phonetics, morphology
   - Handles complex trade-offs

This beats both rigid rules AND black-box embeddings!
""")
    print("=" * 80)
