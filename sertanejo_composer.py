#!/usr/bin/env python3
"""
Sertanejo Lyrics Composer
Uses phonetic matching to find perfect rhymes for Brazilian sertanejo
"""

import sys
sys.path.insert(0, '/home/user/language-play-ptbr')

from src import ReasoningBasedMatcher

# Sertanejo common vocabulary by theme
SERTANEJO_VOCAB = {
    "love_emotions": [
        "paixão", "coração", "solidão", "ilusão", "emoção",
        "amor", "dor", "calor", "flor", "valor",
        "saudade", "verdade", "felicidade", "vontade", "cidade",
        "peito", "jeito", "defeito", "respeito", "perfeito"
    ],
    "rural_life": [
        "viola", "moda", "estrada", "sertão", "chão",
        "poeira", "porteira", "fazenda", "terra", "guerra"
    ],
    "time_nostalgia": [
        "vida", "partida", "ferida", "perdida", "sofrida",
        "tempo", "momento", "lamento", "tormento", "pensamento",
        "lembrança", "esperança", "mudança", "criança", "confiança"
    ],
    "actions": [
        "chorar", "amar", "deixar", "voltar", "ficar",
        "saber", "viver", "querer", "sofrer", "esquecer",
        "partir", "sentir", "seguir", "dormir", "existir"
    ]
}

def find_best_rhymes(mother_word: str, candidate_list: list, top_n: int = 5):
    """Find best rhyming matches"""
    matcher = ReasoningBasedMatcher(context="general")
    results = matcher.rank_candidates(mother_word, candidate_list)
    return results[:top_n]

def compose_sertanejo_verse(theme: str = "love"):
    """Compose a verse using phonetic matching"""

    print("=" * 80)
    print("SERTANEJO COMPOSER - Using Phonetic Matching")
    print("=" * 80)

    # Choose theme words
    if theme == "love":
        vocab = SERTANEJO_VOCAB["love_emotions"] + SERTANEJO_VOCAB["time_nostalgia"]
    else:
        vocab = sum(SERTANEJO_VOCAB.values(), [])

    # ABAB rhyme scheme (typical sertanejo)
    # Find rhyme pairs

    print("\n1. Finding A-rhyme pair...")
    mother_a = "coração"
    candidates_a = [w for w in vocab if w != mother_a]
    rhymes_a = find_best_rhymes(mother_a, candidates_a, top_n=10)

    print(f"   Mother word: '{mother_a}'")
    print(f"   Top matches:")
    for i, r in enumerate(rhymes_a[:5], 1):
        print(f"   {i}. {r.word} ({r.score:.2f})")

    chosen_a = rhymes_a[0].word  # Best match
    print(f"   ✓ Chosen: '{chosen_a}'")

    print("\n2. Finding B-rhyme pair...")
    mother_b = "vida"
    candidates_b = [w for w in vocab if w not in [mother_a, chosen_a, mother_b]]
    rhymes_b = find_best_rhymes(mother_b, candidates_b, top_n=10)

    print(f"   Mother word: '{mother_b}'")
    print(f"   Top matches:")
    for i, r in enumerate(rhymes_b[:5], 1):
        print(f"   {i}. {r.word} ({r.score:.2f})")

    chosen_b = rhymes_b[0].word
    print(f"   ✓ Chosen: '{chosen_b}'")

    print("\n" + "=" * 80)
    print("RHYME SCHEME: ABAB ABAB")
    print("=" * 80)

    # Now compose with these rhymes
    lyrics = {
        "A1": mother_a,
        "B1": mother_b,
        "A2": chosen_a,
        "B2": chosen_b
    }

    return lyrics

# Run composition
if __name__ == "__main__":
    result = compose_sertanejo_verse("love")

    print("\nRhyme pairs selected:")
    print(f"  A-rhyme: {result['A1']} / {result['A2']}")
    print(f"  B-rhyme: {result['B1']} / {result['B2']}")

    print("\n" + "=" * 80)
    print("Now composing full lyrics...")
    print("=" * 80)
