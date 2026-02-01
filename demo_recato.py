#!/usr/bin/env python3
"""
Demo: Analyzing "recato" example using reasoning-based approach
This demonstrates how Claude analyzes phonetic matches
"""

import sys
sys.path.insert(0, '/home/user/language-play-ptbr')

from src.analyzers.phonetic_analyzer import PTBRPhoneticAnalyzer
from src.matchers.reasoning_matcher import ReasoningBasedMatcher


def print_analysis(features):
    """Pretty print phonetic analysis"""
    print(f"\nWord: {features.word}")
    print(f"  Syllables: {', '.join(features.syllables)}")
    print(f"  Type: {features.stress_type}")
    print(f"  Syllable count: {features.syllable_count}")
    print(f"  Stress position: {features.stress_position}")
    print(f"  Tonic syllable: {features.tonic_syllable}")
    print(f"  Tonic vowel: {features.tonic_vowel}")
    print(f"  Tonic consonant: {features.tonic_consonant}")
    print(f"  Vowel sequence: {features.vowel_sequence}")
    print(f"  Consonants: {features.consonant_sequence}")
    if features.prefix:
        print(f"  Prefix: {features.prefix}-")
    if features.suffix:
        print(f"  Suffix: -{features.suffix}")


def print_match(match):
    """Pretty print match score"""
    print(f"\n{'='*70}")
    print(f"Word: {match.word}")
    print(f"Score: {match.score:.2f} ({match.level.replace('_', ' ').upper()})")
    print(f"\nReasoning:")
    print(f"  Prosodic: {match.reasoning['prosodic']}")
    print(f"  Tonic Core: {match.reasoning['tonic_core']}")
    print(f"  Phonetic: {match.reasoning['phonetic']}")
    print(f"  Morphological: {match.reasoning['morphological']}")
    print(f"\nScore Breakdown:")
    for criterion, score in match.score_breakdown.items():
        print(f"  {criterion}: {score:.3f}")
    print(f"\nExplanation: {match.explanation}")
    print(f"{'='*70}")


def main():
    print("=" * 70)
    print("PT-BR PHONETIC MATCHING DEMO")
    print("Reasoning-Based Analysis (Claude Opus 4.5 approach)")
    print("=" * 70)

    # Mother word
    mother_word = "recato"

    # Candidates from user's example
    candidates = [
        "cedo",
        "acetato",
        "acato",
        "recado",
        "recito",
        "átrio",
        "absurdo",
        "abstrato",
        "indignado",
        "pescado"
    ]

    # Initialize analyzer and matcher
    print("\n" + "="*70)
    print("STEP 1: ANALYZING MOTHER WORD")
    print("="*70)

    analyzer = PTBRPhoneticAnalyzer()
    mother_features = analyzer.analyze(mother_word)
    print_analysis(mother_features)

    # Match candidates
    print("\n" + "="*70)
    print("STEP 2: MATCHING CANDIDATES")
    print("="*70)

    matcher = ReasoningBasedMatcher(context="general")
    matches = matcher.rank_candidates(mother_word, candidates)

    # Show top matches with full reasoning
    print("\n" + "="*70)
    print("TOP MATCHES (Full Reasoning)")
    print("="*70)

    for i, match in enumerate(matches[:5], 1):
        print(f"\n#{i}")
        print_match(match)

    # Summary ranking
    print("\n" + "="*70)
    print("COMPLETE RANKING")
    print("="*70)
    print(f"\n{'Rank':<6} {'Word':<15} {'Score':<8} {'Level':<20}")
    print("-" * 70)

    for i, match in enumerate(matches, 1):
        level_display = match.level.replace('_', ' ').title()
        print(f"{i:<6} {match.word:<15} {match.score:<8.2f} {level_display:<20}")

    # Compare with user's original classification
    print("\n" + "="*70)
    print("COMPARISON WITH TRADITIONAL APPROACH")
    print("="*70)
    print("\nThis reasoning-based system provides:")
    print("  ✓ Numerical scores (not just categories)")
    print("  ✓ Detailed reasoning for each criterion")
    print("  ✓ Transparent decision-making")
    print("  ✓ Context-adaptable weights")
    print("  ✓ Explainable results")
    print("\nTraditional rhyme theory would only give binary 'rhyme/no rhyme'")
    print("This system captures gradations and explains WHY matches work.")


if __name__ == "__main__":
    main()
