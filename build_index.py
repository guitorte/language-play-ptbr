#!/usr/bin/env python3
"""
Build script for RimaBR GitHub Pages static site.
Pre-computes phonetic features for all words and exports as chunked JSON.
"""

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# Add project root to path so we can import src modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.analyzers.phonetic_analyzer import PTBRPhoneticAnalyzer
from src.utils.syllabifier import syllabify_with_overrides

DOCS_DIR = Path(__file__).parent / "docs"
DATA_DIR = DOCS_DIR / "data"
CHUNKS_DIR = DATA_DIR / "chunks"

# How many words per chunk file (controls granularity vs number of files)
MAX_WORDS_PER_CHUNK = 500

# Near-rhyme vowel similarity classes for Brazilian Portuguese
VOWEL_SIMILARITY = {
    'a': ['ã', 'á', 'â', 'à'],
    'e': ['é', 'ê', 'ẽ'],
    'i': ['í'],
    'o': ['ó', 'ô', 'õ'],
    'u': ['ú', 'ũ'],
    'ã': ['a', 'á', 'â'],
    'á': ['a', 'ã'],
    'â': ['a', 'ã'],
    'é': ['e', 'ê'],
    'ê': ['e', 'é'],
    'í': ['i'],
    'ó': ['o', 'ô'],
    'ô': ['o', 'ó'],
    'õ': ['o', 'ô'],
    'ú': ['u'],
}

# Ending similarity classes for near-rhyme expansion
ENDING_SIMILARITY = {
    'or': ['ar', 'er', 'ir', 'ur'],
    'ar': ['or', 'er', 'ir'],
    'er': ['ar', 'or', 'ir'],
    'ir': ['ar', 'er', 'or', 'ur'],
    'ur': ['or', 'ir'],
    'ção': ['são', 'dão', 'ssão'],
    'são': ['ção', 'dão', 'ssão'],
    'dão': ['ção', 'são'],
    'ssão': ['ção', 'são'],
    'ado': ['ato', 'aco'],
    'ato': ['ado', 'aco'],
    'ada': ['ata'],
    'ata': ['ada'],
    'ido': ['ito'],
    'ito': ['ido'],
    'ida': ['ita'],
    'ita': ['ida'],
    'oso': ['osa'],
    'osa': ['oso'],
    'ade': ['ade'],
    'ente': ['ente'],
    'mente': ['ente'],
    'eiro': ['eira'],
    'eira': ['eiro'],
    'ão': ['ã', 'an'],
    'ões': ['ãos', 'ães'],
}


def load_words(*paths):
    """Load and deduplicate words from one or more files."""
    words = set()
    word_re = re.compile(r'^[a-záéíóúâêôãõçà-ÿ]{2,}$', re.IGNORECASE)

    for path in paths:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                w = line.strip().rstrip('\r').lower()
                if word_re.match(w):
                    words.add(w)

    return sorted(words)


def extract_rhyme_key(word, syllables, stress_pos):
    """
    Extract the rhyme key: everything from the tonic vowel to end of word.
    This is the core grouping criterion for perfect rhymes.
    """
    vowels = set('aeiouáéíóúâêôãõà')

    # Get the tonic syllable and everything after it
    tonic_and_after = ''.join(syllables[stress_pos:])

    # Find the first vowel in the tonic syllable
    for i, ch in enumerate(tonic_and_after):
        if ch in vowels:
            return tonic_and_after[i:]

    # Fallback: use last 2 chars
    return word[-2:] if len(word) >= 2 else word


def analyze_all_words(words):
    """Analyze all words and return feature dicts grouped by rhyme key."""
    analyzer = PTBRPhoneticAnalyzer()
    rhyme_groups = defaultdict(list)
    analyzed = []
    errors = 0

    for i, word in enumerate(words):
        if i % 5000 == 0 and i > 0:
            print(f"  Analyzed {i}/{len(words)} words...")

        try:
            features = analyzer.analyze(word)

            # Compute stress_pos as index into syllables array
            stress_idx = len(features.syllables) - features.stress_position
            if stress_idx < 0:
                stress_idx = 0
            if stress_idx >= len(features.syllables):
                stress_idx = len(features.syllables) - 1

            rhyme_key = extract_rhyme_key(word, features.syllables, stress_idx)

            # Compact representation for JSON
            entry = {
                'w': word,
                's': features.syllables,
                'n': features.syllable_count,
                't': features.stress_type[0:2],  # 'ox', 'pa', 'pr'
                'v': features.tonic_vowel,
                'r': rhyme_key,
            }

            rhyme_groups[rhyme_key].append(entry)
            analyzed.append(entry)

        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"  Warning: failed to analyze '{word}': {e}")

    print(f"  Analyzed {len(analyzed)} words, {errors} errors, {len(rhyme_groups)} rhyme groups")
    return rhyme_groups, analyzed


def build_near_rhyme_map(rhyme_keys):
    """
    Build a map from each rhyme key to similar rhyme keys.
    Uses ending similarity classes + vowel similarity.
    """
    near_map = {}
    key_set = set(rhyme_keys)

    for key in rhyme_keys:
        similar = set()

        # Check ending similarity table
        for ending, relatives in ENDING_SIMILARITY.items():
            if key.endswith(ending):
                prefix = key[:-len(ending)]
                for rel in relatives:
                    candidate = prefix + rel
                    if candidate in key_set and candidate != key:
                        similar.add(candidate)

        # Check vowel substitution (replace tonic vowel with similar vowels)
        if key:
            first_vowel_idx = None
            vowels = set('aeiouáéíóúâêôãõà')
            for idx, ch in enumerate(key):
                if ch in vowels:
                    first_vowel_idx = idx
                    break

            if first_vowel_idx is not None:
                tonic_v = key[first_vowel_idx]
                if tonic_v in VOWEL_SIMILARITY:
                    for alt_v in VOWEL_SIMILARITY[tonic_v]:
                        candidate = key[:first_vowel_idx] + alt_v + key[first_vowel_idx + 1:]
                        if candidate in key_set and candidate != key:
                            similar.add(candidate)

        if similar:
            near_map[key] = sorted(similar)

    return near_map


def write_chunks(rhyme_groups):
    """
    Write rhyme groups as chunked JSON files.
    Merges small groups into combined chunks to reduce file count.
    """
    # Sort groups by size (largest first) for efficient packing
    sorted_groups = sorted(rhyme_groups.items(), key=lambda x: -len(x[1]))

    chunks = []  # List of (chunk_id, {rhyme_key: [entries]})
    current_chunk = {}
    current_count = 0
    chunk_id = 0

    for rhyme_key, entries in sorted_groups:
        if current_count + len(entries) > MAX_WORDS_PER_CHUNK and current_chunk:
            chunks.append((chunk_id, current_chunk))
            chunk_id += 1
            current_chunk = {}
            current_count = 0

        current_chunk[rhyme_key] = entries
        current_count += len(entries)

    if current_chunk:
        chunks.append((chunk_id, current_chunk))

    # Write each chunk
    chunk_manifest = {}  # rhyme_key -> {file, count}

    for cid, groups in chunks:
        filename = f"chunk_{cid:03d}.json"
        filepath = CHUNKS_DIR / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(groups, f, ensure_ascii=False, separators=(',', ':'))

        for rk, entries in groups.items():
            chunk_manifest[rk] = {
                'f': f"chunks/{filename}",
                'c': len(entries),
            }

    print(f"  Wrote {len(chunks)} chunk files")
    return chunk_manifest


def write_manifest(chunk_manifest, near_rhyme_map, total_words):
    """Write the main manifest file."""
    manifest = {
        'version': 1,
        'totalWords': total_words,
        'chunks': chunk_manifest,
        'nearRhymeMap': near_rhyme_map,
    }

    manifest_path = DATA_DIR / 'manifest.json'
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = manifest_path.stat().st_size / 1024
    print(f"  Wrote manifest.json ({size_kb:.1f} KB)")


def write_autocomplete(words):
    """Write word list for autocomplete suggestions."""
    ac_path = DATA_DIR / 'autocomplete.json'
    with open(ac_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = ac_path.stat().st_size / 1024
    print(f"  Wrote autocomplete.json ({size_kb:.1f} KB, {len(words)} words)")


def main():
    print("=== RimaBR Static Index Builder ===\n")

    # Ensure output dirs exist
    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

    # Load words
    print("1. Loading words...")
    data_dir = Path(__file__).parent / "data"
    word_files = []
    for name in ['palavras_exemplo.txt', 'kpalavras.txt']:
        p = data_dir / name
        if p.exists():
            word_files.append(p)
            print(f"   Found: {name}")

    if not word_files:
        print("ERROR: No word files found in data/")
        sys.exit(1)

    words = load_words(*word_files)
    print(f"   Loaded {len(words)} unique words\n")

    # Analyze
    print("2. Analyzing phonetic features...")
    rhyme_groups, analyzed = analyze_all_words(words)
    print()

    # Write chunks
    print("3. Writing chunk files...")
    chunk_manifest = write_chunks(rhyme_groups)
    print()

    # Build near-rhyme map
    print("4. Building near-rhyme map...")
    near_map = build_near_rhyme_map(list(rhyme_groups.keys()))
    print(f"   {len(near_map)} rhyme keys have near-rhyme expansions\n")

    # Write manifest
    print("5. Writing manifest...")
    write_manifest(chunk_manifest, near_map, len(words))
    print()

    # Write autocomplete
    print("6. Writing autocomplete data...")
    write_autocomplete(words)
    print()

    # Summary
    total_data_size = sum(
        f.stat().st_size for f in DATA_DIR.rglob('*.json')
    ) / 1024
    print(f"=== Done! ===")
    print(f"   Words: {len(words)}")
    print(f"   Rhyme groups: {len(rhyme_groups)}")
    print(f"   Chunk files: {len(list(CHUNKS_DIR.glob('*.json')))}")
    print(f"   Total data size: {total_data_size:.1f} KB")
    print(f"   Output: {DOCS_DIR}")


if __name__ == '__main__':
    main()
