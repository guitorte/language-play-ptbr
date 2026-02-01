#!/usr/bin/env python3
"""
RimaBR - CLI Interface
Brazilian Portuguese Rhyme Search Engine
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.database.rimabr_db import RimaBRDatabase


def search_rhymes(db: RimaBRDatabase, args):
    """Search for rhymes"""
    print(f"\n{'='*80}")
    print(f"Searching rhymes for: '{args.word}'")
    print(f"{'='*80}\n")

    # Build filters
    filters = {}
    if args.stress:
        filters["stress_type"] = args.stress
    if args.syllables:
        filters["syllable_count"] = args.syllables
    if args.min_syllables:
        filters["min_syllables"] = args.min_syllables
    if args.max_syllables:
        filters["max_syllables"] = args.max_syllables
    if args.suffix:
        filters["suffix"] = args.suffix
    if args.ending:
        filters["ending"] = args.ending

    # Search
    results = db.search(
        args.word,
        filters=filters if filters else None,
        limit=args.limit
    )

    if not results:
        print("No rhymes found.")
        return

    # Display results
    print(f"Found {len(results)} rhymes:\n")
    print(f"{'Rank':<6} {'Word':<20} {'Score':<8} {'Level':<15} {'Syllables':<4}")
    print("-" * 80)

    for i, result in enumerate(results, 1):
        word = result["word"]
        score = result["score"]
        level = result["level"].replace("_", " ").title()
        syl = result["features"]["syllable_count"]

        print(f"{i:<6} {word:<20} {score:<8.2f} {level:<15} {syl:<4}")

    # Show details for top matches
    if args.details and len(results) > 0:
        print(f"\n{'='*80}")
        print("Top 5 - Detailed Analysis:")
        print(f"{'='*80}\n")

        for i, result in enumerate(results[:5], 1):
            print(f"{i}. {result['word']} (Score: {result['score']:.2f})")
            print(f"   {result['explanation']}")
            print(f"   Breakdown: {result['breakdown']}")
            print()


def search_by_pattern(db: RimaBRDatabase, args):
    """Search by specific pattern"""
    print(f"\n{'='*80}")
    print(f"Searching by pattern:")
    print(f"{'='*80}\n")

    results = db.search_by_criteria(
        tonic_vowel=args.tonic_vowel,
        tonic_syllable=args.tonic_syllable,
        stress_type=args.stress,
        syllable_count=args.syllables,
        suffix=args.suffix,
        ending=args.ending,
        limit=args.limit
    )

    if not results:
        print("No words found.")
        return

    print(f"Found {len(results)} words:\n")

    for i, result in enumerate(results, 1):
        feat = result["features"]
        print(f"{i}. {result['word']:<20} "
              f"({feat['stress_type']}, "
              f"{feat['syllable_count']} syl, "
              f"tonic: '{feat['tonic_syllable']}')")


def show_stats(db: RimaBRDatabase):
    """Show database statistics"""
    stats = db.get_stats()

    print(f"\n{'='*80}")
    print("RimaBR Database Statistics")
    print(f"{'='*80}\n")

    print(f"Total words: {stats['total_words']:,}\n")

    print("By stress type:")
    for stress, count in stats['by_stress_type'].items():
        print(f"  {stress:<15} {count:>8,} words")

    print("\nBy syllable count:")
    for syl, count in sorted(stats['by_syllable_count'].items()):
        print(f"  {syl} syllables: {count:>8,} words")

    print("\nTop 10 suffixes:")
    for i, (suffix, count) in enumerate(list(stats['top_suffixes'].items())[:10], 1):
        if suffix:
            print(f"  {i:2}. -{suffix:<12} {count:>8,} words")


def load_words(db: RimaBRDatabase, args):
    """Load words from file"""
    file_path = Path(args.file)

    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return

    print(f"Loading words from: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    print(f"Found {len(words)} words")
    print("Indexing... (this may take a while)\n")

    db.index_words(words, batch_size=args.batch_size)

    print("\nDone! Use --stats to see database statistics.")


def main():
    parser = argparse.ArgumentParser(
        description="RimaBR - Brazilian Portuguese Rhyme Search Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search for rhymes
  python rimabr_cli.py search amor --details

  # Filter by stress type
  python rimabr_cli.py search amor --stress paroxítona

  # Filter by syllable count
  python rimabr_cli.py search amor --syllables 3

  # Search by pattern (all words with tonic 'a')
  python rimabr_cli.py pattern --tonic-vowel a --syllables 3

  # Load word list
  python rimabr_cli.py load palavras.txt

  # Show statistics
  python rimabr_cli.py stats
        """
    )

    # Global options
    parser.add_argument(
        "--db",
        default="data/rimabr.db",
        help="Path to database file (default: data/rimabr.db)"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Search command
    search_parser = subparsers.add_parser("search", help="Search for rhymes")
    search_parser.add_argument("word", help="Word to find rhymes for")
    search_parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximum number of results (default: 50)"
    )
    search_parser.add_argument(
        "--stress",
        choices=["oxítona", "paroxítona", "proparoxítona"],
        help="Filter by stress type"
    )
    search_parser.add_argument(
        "--syllables",
        type=int,
        help="Filter by exact syllable count"
    )
    search_parser.add_argument(
        "--min-syllables",
        type=int,
        help="Minimum syllable count"
    )
    search_parser.add_argument(
        "--max-syllables",
        type=int,
        help="Maximum syllable count"
    )
    search_parser.add_argument(
        "--suffix",
        help="Filter by suffix (e.g., 'ado', 'ção')"
    )
    search_parser.add_argument(
        "--ending",
        help="Filter by ending (e.g., 'ão', 'dade')"
    )
    search_parser.add_argument(
        "--details",
        action="store_true",
        help="Show detailed analysis for top results"
    )

    # Pattern search command
    pattern_parser = subparsers.add_parser("pattern", help="Search by pattern")
    pattern_parser.add_argument(
        "--tonic-vowel",
        help="Tonic vowel (e.g., 'a', 'e', 'i')"
    )
    pattern_parser.add_argument(
        "--tonic-syllable",
        help="Tonic syllable (e.g., 'ca', 'to')"
    )
    pattern_parser.add_argument(
        "--stress",
        choices=["oxítona", "paroxítona", "proparoxítona"],
        help="Stress type"
    )
    pattern_parser.add_argument(
        "--syllables",
        type=int,
        help="Syllable count"
    )
    pattern_parser.add_argument(
        "--suffix",
        help="Suffix (e.g., 'ado', 'ção')"
    )
    pattern_parser.add_argument(
        "--ending",
        help="Ending (e.g., 'ão', 'dade')"
    )
    pattern_parser.add_argument(
        "--limit",
        type=int,
        default=50,
        help="Maximum number of results"
    )

    # Load command
    load_parser = subparsers.add_parser("load", help="Load words from file")
    load_parser.add_argument("file", help="Path to word list file (one word per line)")
    load_parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Batch size for indexing (default: 1000)"
    )

    # Stats command
    subparsers.add_parser("stats", help="Show database statistics")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Initialize database
    db = RimaBRDatabase(db_path=args.db)

    # Execute command
    if args.command == "search":
        search_rhymes(db, args)
    elif args.command == "pattern":
        search_by_pattern(db, args)
    elif args.command == "load":
        load_words(db, args)
    elif args.command == "stats":
        show_stats(db)


if __name__ == "__main__":
    main()
