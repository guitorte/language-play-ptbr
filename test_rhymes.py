#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/user/language-play-ptbr')

from src import ReasoningBasedMatcher

matcher = ReasoningBasedMatcher(context="general")

# Test known good sertanejo rhyme pairs
pairs = [
    ("coração", "paixão"),
    ("coração", "solidão"),
    ("estrada", "amada"),
    ("estrada", "madrugada"),
    ("amar", "chorar"),
    ("amar", "deixar"),
    ("saudade", "verdade"),
    ("saudade", "vontade"),
    ("amor", "dor"),
    ("flor", "amor"),
    ("peito", "jeito"),
    ("sofrer", "viver"),
]

print("Testing sertanejo rhyme pairs:\n")
for w1, w2 in pairs:
    result = matcher.score_pair(w1, w2)
    print(f"{w1:15} / {w2:15} → {result.score:.2f} - {result.reasoning['tonic_core'][:60]}...")
