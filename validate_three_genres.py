#!/usr/bin/env python3
"""
Three-Genre Composition Challenge
Rap, MPB Experimental, and Repente using phonetic matching
"""

import sys
sys.path.insert(0, '/home/user/language-play-ptbr')

from src import ReasoningBasedMatcher, PTBRPhoneticAnalyzer

def validate_rap_rhymes():
    """Find and validate rap rhymes"""

    print("=" * 80)
    print("GENRE 1: BRAZILIAN RAP - RHYME SELECTION")
    print("=" * 80)

    analyzer = PTBRPhoneticAnalyzer()
    matcher = ReasoningBasedMatcher(context="hip_hop")

    # A-rhyme: Multi-syllable -dade
    print("\n1. Finding A-rhyme (multi-syllable -dade):")
    a_candidates = [
        "ancestralidade",
        "identidade",
        "comunidade",
        "criminalidade",
        "dignidade",
        "humanidade"
    ]

    mother_a = "ancestralidade"
    results_a = matcher.rank_candidates(mother_a,
                                       [c for c in a_candidates if c != mother_a])

    print(f"   Mother: '{mother_a}'")
    print(f"   Top choices:")
    for i, r in enumerate(results_a[:3], 1):
        feat = analyzer.analyze(r.word)
        print(f"   {i}. {r.word} ({feat.syllable_count} syl) - Score: {r.score:.2f}")

    chosen_a = results_a[0].word
    print(f"   ✓ Selected: '{chosen_a}'")

    # B-rhyme: Multi-syllable -ção
    print("\n2. Finding B-rhyme (multi-syllable -ção):")
    b_candidates = [
        "marginalização",
        "criminalização",
        "descolonização",
        "gentrificação",
        "ressignificação",
        "opressão"
    ]

    mother_b = "marginalização"
    results_b = matcher.rank_candidates(mother_b,
                                       [c for c in b_candidates if c != mother_b])

    print(f"   Mother: '{mother_b}'")
    print(f"   Top choices:")
    for i, r in enumerate(results_b[:3], 1):
        feat = analyzer.analyze(r.word)
        print(f"   {i}. {r.word} ({feat.syllable_count} syl) - Score: {r.score:.2f}")

    chosen_b = results_b[0].word
    print(f"   ✓ Selected: '{chosen_b}'")

    # C-rhyme: -ência (political)
    print("\n3. Finding C-rhyme (-ência pattern):")
    c_candidates = [
        "resistência",
        "existência",
        "consciência",
        "violência",
        "paciência"
    ]

    mother_c = "resistência"
    results_c = matcher.rank_candidates(mother_c,
                                       [c for c in c_candidates if c != mother_c])

    print(f"   Mother: '{mother_c}'")
    print(f"   Top choices:")
    for i, r in enumerate(results_c[:3], 1):
        print(f"   {i}. {r.word} - Score: {r.score:.2f}")

    chosen_c = results_c[0].word
    print(f"   ✓ Selected: '{chosen_c}'")

    # D-rhyme: -ia (internal rhyme potential)
    print("\n4. Finding D-rhyme (-ia pattern):")
    d_candidates = [
        "periferia",
        "bateria",
        "artilharia",
        "galeria",
        "feitiçaria"
    ]

    mother_d = "periferia"
    results_d = matcher.rank_candidates(mother_d,
                                       [c for c in d_candidates if c != mother_d])

    print(f"   Mother: '{mother_d}'")
    print(f"   Top choices:")
    for i, r in enumerate(results_d[:3], 1):
        print(f"   {i}. {r.word} - Score: {r.score:.2f}")

    chosen_d = results_d[0].word
    print(f"   ✓ Selected: '{chosen_d}'")

    return {
        "A1": mother_a,
        "A2": chosen_a,
        "B1": mother_b,
        "B2": chosen_b,
        "C1": mother_c,
        "C2": chosen_c,
        "D1": mother_d,
        "D2": chosen_d
    }


def validate_mpb_rhymes():
    """Find MPB experimental rhymes"""

    print("\n\n" + "=" * 80)
    print("GENRE 2: MPB EXPERIMENTAL - RHYME SELECTION")
    print("=" * 80)

    matcher = ReasoningBasedMatcher(context="general")
    analyzer = PTBRPhoneticAnalyzer()

    # Proparoxítonas (Chico Buarque style)
    print("\n1. Finding proparoxítona chain:")
    prox_candidates = [
        "última",
        "máquina",
        "lágrima",
        "pássaro",
        "música"
    ]

    mother = "última"
    results = matcher.rank_candidates(mother,
                                     [c for c in prox_candidates if c != mother])

    print(f"   Mother: '{mother}' (proparoxítona)")
    for i, r in enumerate(results[:3], 1):
        feat = analyzer.analyze(r.word)
        print(f"   {i}. {r.word} ({feat.stress_type}) - Score: {r.score:.2f}")

    # Experimental near-rhymes
    print("\n2. Finding experimental near-rhymes:")
    exp_candidates = [
        "horizonte",
        "ausente",
        "mente",
        "gente",
        "diferente"
    ]

    mother2 = "horizonte"
    results2 = matcher.rank_candidates(mother2,
                                      [c for c in exp_candidates if c != mother2])

    print(f"   Mother: '{mother2}'")
    for i, r in enumerate(results2[:3], 1):
        print(f"   {i}. {r.word} - Score: {r.score:.2f}")

    return {
        "prox1": mother,
        "prox2": results[0].word,
        "exp1": mother2,
        "exp2": results2[0].word
    }


def validate_repente_rhymes():
    """Find traditional repente rhymes"""

    print("\n\n" + "=" * 80)
    print("GENRE 3: REPENTE NORDESTINO - RHYME SELECTION")
    print("=" * 80)

    matcher = ReasoningBasedMatcher(context="general")

    # Traditional -ão rhymes
    print("\n1. Finding -ão rhyme pair:")
    ao_candidates = [
        "sertão",
        "coração",
        "paixão",
        "solidão",
        "canção",
        "chão"
    ]

    mother = "sertão"
    results = matcher.rank_candidates(mother,
                                     [c for c in ao_candidates if c != mother])

    print(f"   Mother: '{mother}'")
    for i, r in enumerate(results[:3], 1):
        print(f"   {i}. {r.word} - Score: {r.score:.2f}")

    # Traditional -ado rhymes
    print("\n2. Finding -ado rhyme pair:")
    ado_candidates = [
        "cantado",
        "lembrando",
        "passado",
        "chegado",
        "acabado"
    ]

    mother2 = "cantado"
    results2 = matcher.rank_candidates(mother2,
                                      [c for c in ado_candidates if c != mother2])

    print(f"   Mother: '{mother2}'")
    for i, r in enumerate(results2[:3], 1):
        print(f"   {i}. {r.word} - Score: {r.score:.2f}")

    return {
        "A1": mother,
        "A2": results[0].word,
        "B1": mother2,
        "B2": results2[0].word
    }


if __name__ == "__main__":
    # Validate rhymes for all three genres
    rap_rhymes = validate_rap_rhymes()
    mpb_rhymes = validate_mpb_rhymes()
    repente_rhymes = validate_repente_rhymes()

    print("\n\n" + "=" * 80)
    print("VALIDATED RHYME SCHEMES")
    print("=" * 80)

    print("\nRAP:")
    print(f"  A: {rap_rhymes['A1']} / {rap_rhymes['A2']}")
    print(f"  B: {rap_rhymes['B1']} / {rap_rhymes['B2']}")
    print(f"  C: {rap_rhymes['C1']} / {rap_rhymes['C2']}")
    print(f"  D: {rap_rhymes['D1']} / {rap_rhymes['D2']}")

    print("\nMPB EXPERIMENTAL:")
    print(f"  Proparoxítonas: {mpb_rhymes['prox1']} / {mpb_rhymes['prox2']}")
    print(f"  Experimental: {mpb_rhymes['exp1']} / {mpb_rhymes['exp2']}")

    print("\nREPENTE:")
    print(f"  A: {repente_rhymes['A1']} / {repente_rhymes['A2']}")
    print(f"  B: {repente_rhymes['B1']} / {repente_rhymes['B2']}")

    print("\n" + "=" * 80)
    print("Ready to compose lyrics with validated rhymes!")
    print("=" * 80)
