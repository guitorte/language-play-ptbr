#!/usr/bin/env python3
"""
RimaBR Demonstration
Shows the full capabilities of the rhyme search engine
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.database.rimabr_db import RimaBRDatabase


def demo_basic_search():
    """Demonstrate basic rhyme search"""
    print("="*80)
    print("DEMO 1: BASIC RHYME SEARCH")
    print("="*80)

    db = RimaBRDatabase("data/rimabr.db")

    word = "amor"
    print(f"\nSearching rhymes for: '{word}'\n")

    results = db.search(word, limit=10)

    print(f"{'Word':<20} {'Score':<8} {'Level':<20} {'Features'}")
    print("-"*80)

    for r in results:
        feat = r['features']
        print(f"{r['word']:<20} {r['score']:<8.2f} {r['level']:<20} "
              f"{feat['stress_type']}, {feat['syllable_count']} syl")


def demo_filtered_search():
    """Demonstrate filtered search"""
    print("\n\n" + "="*80)
    print("DEMO 2: FILTERED SEARCH")
    print("="*80)

    db = RimaBRDatabase("data/rimabr.db")

    word = "amor"
    print(f"\nSearching rhymes for: '{word}'")
    print("Filters: paroxítonas, 2-3 syllables\n")

    results = db.search(
        word,
        filters={
            "stress_type": "paroxítona",
            "min_syllables": 2,
            "max_syllables": 3
        },
        limit=10
    )

    print(f"{'Word':<20} {'Score':<8} {'Syllables':<4}")
    print("-"*50)

    for r in results:
        print(f"{r['word']:<20} {r['score']:<8.2f} {r['features']['syllable_count']:<4}")


def demo_pattern_search():
    """Demonstrate pattern-based search"""
    print("\n\n" + "="*80)
    print("DEMO 3: PATTERN SEARCH")
    print("="*80)

    db = RimaBRDatabase("data/rimabr.db")

    print("\nFinding all words with:")
    print("  - Tonic vowel: 'a'")
    print("  - Suffix: '-dade'")
    print("  - Paroxítonas\n")

    results = db.search_by_criteria(
        tonic_vowel='a',
        suffix='dade',
        stress_type='paroxítona',
        limit=15
    )

    print(f"Found {len(results)} words:\n")

    for i, r in enumerate(results, 1):
        feat = r['features']
        print(f"{i:2}. {r['word']:<20} (tonic: '{feat['tonic_syllable']}')")


def demo_rap_vocabulary():
    """Demonstrate finding rap vocabulary"""
    print("\n\n" + "="*80)
    print("DEMO 4: RAP VOCABULARY FINDER")
    print("="*80)

    db = RimaBRDatabase("data/rimabr.db")

    print("\nFinding polysyllabic rhymes for rap:")
    print("  - Minimum 5 syllables")
    print("  - Suffix: '-ção' or '-dade'\n")

    # Search for -ção words
    cao_words = db.search_by_criteria(
        suffix='ção',
        limit=50
    )

    # Filter by syllable count
    long_cao = [w for w in cao_words if w['features']['syllable_count'] >= 5]

    print(f"Long -ção words ({len(long_cao)}):")
    for w in sorted(long_cao, key=lambda x: x['features']['syllable_count'], reverse=True)[:10]:
        feat = w['features']
        print(f"  {w['word']:<25} ({feat['syllable_count']} syl)")

    # Search for -dade words
    dade_words = db.search_by_criteria(
        suffix='dade',
        limit=50
    )

    long_dade = [w for w in dade_words if w['features']['syllable_count'] >= 5]

    print(f"\nLong -dade words ({len(long_dade)}):")
    for w in sorted(long_dade, key=lambda x: x['features']['syllable_count'], reverse=True)[:10]:
        feat = w['features']
        print(f"  {w['word']:<25} ({feat['syllable_count']} syl)")


def demo_multi_criteria():
    """Demonstrate complex multi-criteria search"""
    print("\n\n" + "="*80)
    print("DEMO 5: MULTI-CRITERIA SEARCH")
    print("="*80)

    db = RimaBRDatabase("data/rimabr.db")

    print("\nFinding words for sertanejo composition:")
    print("  - Tonic syllable: 'ão'")
    print("  - Oxítonas (stress on last syllable)")
    print("  - 2-3 syllables\n")

    results = db.search_by_criteria(
        tonic_syllable='ão',
        stress_type='oxítona',
        limit=50
    )

    # Filter by syllable count
    filtered = [r for r in results if 2 <= r['features']['syllable_count'] <= 3]

    print(f"Found {len(filtered)} words:\n")

    for i, r in enumerate(filtered[:15], 1):
        feat = r['features']
        print(f"{i:2}. {r['word']:<15} ({feat['syllable_count']} syl)")


def demo_statistics():
    """Show database statistics"""
    print("\n\n" + "="*80)
    print("DEMO 6: DATABASE STATISTICS")
    print("="*80 + "\n")

    db = RimaBRDatabase("data/rimabr.db")
    stats = db.get_stats()

    print(f"Total words indexed: {stats['total_words']:,}\n")

    print("Distribution by stress type:")
    for stress, count in stats['by_stress_type'].items():
        pct = (count / stats['total_words'] * 100) if stats['total_words'] > 0 else 0
        print(f"  {stress:<15} {count:>5,} words ({pct:>5.1f}%)")

    print("\nTop 10 suffixes:")
    for i, (suffix, count) in enumerate(list(stats['top_suffixes'].items())[:10], 1):
        if suffix:
            pct = (count / stats['total_words'] * 100) if stats['total_words'] > 0 else 0
            print(f"  {i:2}. -{suffix:<12} {count:>5,} words ({pct:>5.1f}%)")


def main():
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════════╗")
    print("║                                                                        ║")
    print("║                         RIMABR DEMONSTRATION                           ║")
    print("║            Brazilian Portuguese Rhyme Search Engine                    ║")
    print("║                                                                        ║")
    print("╚════════════════════════════════════════════════════════════════════════╝")
    print("\n")

    # Check if database exists
    db_path = Path("data/rimabr.db")
    if not db_path.exists():
        print("⚠️  Database not found!")
        print("\nTo create the database, run:")
        print("  python rimabr_cli.py load data/palavras_exemplo.txt")
        print("\nOr with your own word list:")
        print("  python rimabr_cli.py load seu_arquivo.txt")
        print("\n")
        return

    # Run demos
    demo_basic_search()
    demo_filtered_search()
    demo_pattern_search()
    demo_rap_vocabulary()
    demo_multi_criteria()
    demo_statistics()

    print("\n\n" + "="*80)
    print("NEXT STEPS")
    print("="*80)
    print("""
Try the CLI for interactive searches:

  # Basic search
  python rimabr_cli.py search amor

  # With filters
  python rimabr_cli.py search amor --stress paroxítona --details

  # Pattern search
  python rimabr_cli.py pattern --tonic-vowel a --suffix dade

  # Show stats
  python rimabr_cli.py stats

See --help for more options!
    """)


if __name__ == "__main__":
    main()
