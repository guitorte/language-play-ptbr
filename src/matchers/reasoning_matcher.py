"""
Reasoning-Based Phonetic Matcher
Demonstrates Claude's analytical approach to phonetic matching
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass
from ..analyzers.phonetic_analyzer import PTBRPhoneticAnalyzer, PhoneticFeatures


@dataclass
class MatchScore:
    """Detailed match score with reasoning"""
    word: str
    score: float
    level: str
    reasoning: Dict[str, str]
    score_breakdown: Dict[str, float]
    explanation: str


class ReasoningBasedMatcher:
    """
    Phonetic matcher using explicit multi-criteria reasoning
    Designed to demonstrate Claude's analytical approach
    """

    # Scoring levels
    LEVELS = {
        (0.90, 1.00): "perfect_match",
        (0.75, 0.90): "strong_match",
        (0.60, 0.75): "good_match",
        (0.40, 0.60): "weak_match",
        (0.20, 0.40): "poor_match",
        (0.00, 0.20): "no_match"
    }

    def __init__(self, context: str = "general"):
        self.analyzer = PTBRPhoneticAnalyzer()
        self.context = context
        self.weights = self._get_weights(context)

    def _get_weights(self, context: str) -> Dict[str, float]:
        """Context-specific weights for different criteria"""
        weights_map = {
            "general": {
                "prosodic": 0.25,
                "tonic_core": 0.45,
                "phonetic": 0.20,
                "morphological": 0.10
            },
            "strict_rhyme": {
                "prosodic": 0.20,
                "tonic_core": 0.50,
                "phonetic": 0.25,
                "morphological": 0.05
            },
            "assonance": {
                "prosodic": 0.20,
                "tonic_core": 0.35,
                "phonetic": 0.35,
                "morphological": 0.10
            },
            "hip_hop": {
                "prosodic": 0.30,
                "tonic_core": 0.30,
                "phonetic": 0.25,
                "morphological": 0.15
            }
        }
        return weights_map.get(context, weights_map["general"])

    def score_pair(self, mother_word: str, candidate: str) -> MatchScore:
        """
        Score a word pair using multi-criteria reasoning
        This demonstrates how Claude would analyze the match
        """
        # 1. Analyze both words
        mother = self.analyzer.analyze(mother_word)
        cand = self.analyzer.analyze(candidate)

        # 2. Reason through each dimension
        prosodic_score, prosodic_reasoning = self._analyze_prosody(mother, cand)
        tonic_score, tonic_reasoning = self._analyze_tonic_core(mother, cand)
        phonetic_score, phonetic_reasoning = self._analyze_phonetic_patterns(mother, cand)
        morpho_score, morpho_reasoning = self._analyze_morphology(mother, cand)

        # 3. Weighted combination
        total_score = (
            prosodic_score * self.weights["prosodic"] +
            tonic_score * self.weights["tonic_core"] +
            phonetic_score * self.weights["phonetic"] +
            morpho_score * self.weights["morphological"]
        )

        # 4. Determine level
        level = self._get_level(total_score)

        # 5. Create explanation
        explanation = self._generate_explanation(
            mother_word, candidate, total_score,
            prosodic_reasoning, tonic_reasoning,
            phonetic_reasoning, morpho_reasoning
        )

        return MatchScore(
            word=candidate,
            score=round(total_score, 2),
            level=level,
            reasoning={
                "prosodic": prosodic_reasoning,
                "tonic_core": tonic_reasoning,
                "phonetic": phonetic_reasoning,
                "morphological": morpho_reasoning
            },
            score_breakdown={
                "prosodic": round(prosodic_score * self.weights["prosodic"], 3),
                "tonic_core": round(tonic_score * self.weights["tonic_core"], 3),
                "phonetic": round(phonetic_score * self.weights["phonetic"], 3),
                "morphological": round(morpho_score * self.weights["morphological"], 3)
            },
            explanation=explanation
        )

    def _analyze_prosody(self, m: PhoneticFeatures, c: PhoneticFeatures) -> Tuple[float, str]:
        """Analyze prosodic correspondence"""
        score = 0.0
        checks = []

        # Stress type match
        if m.stress_type == c.stress_type:
            score += 0.4
            checks.append(f"✓ Both {m.stress_type}")
        else:
            checks.append(f"✗ Different stress: {m.stress_type} vs {c.stress_type}")

        # Syllable count
        if m.syllable_count == c.syllable_count:
            score += 0.3
            checks.append(f"✓ Same syllable count ({m.syllable_count})")
        else:
            diff = abs(m.syllable_count - c.syllable_count)
            partial = 0.3 * (1 / (1 + diff))
            score += partial
            checks.append(f"△ Syllable count: {m.syllable_count} vs {c.syllable_count}")

        # Stress position
        if m.stress_position == c.stress_position:
            score += 0.3
            checks.append(f"✓ Same stress position ({m.stress_position})")
        else:
            diff = abs(m.stress_position - c.stress_position)
            partial = 0.3 * (1 / (1 + diff))
            score += partial
            checks.append(f"△ Stress position: {m.stress_position} vs {c.stress_position}")

        reasoning = " | ".join(checks)
        return min(score, 1.0), reasoning

    def _analyze_tonic_core(self, m: PhoneticFeatures, c: PhoneticFeatures) -> Tuple[float, str]:
        """Analyze tonic syllable correspondence - most important for rhyme"""
        score = 0.0
        checks = []

        # Complete tonic syllable match (jackpot!)
        if m.tonic_syllable == c.tonic_syllable:
            score = 1.0
            checks.append(f"✓✓✓ IDENTICAL tonic syllable: '{m.tonic_syllable}'")
            return score, " | ".join(checks)

        # Tonic vowel (critical for rhyme)
        if m.tonic_vowel == c.tonic_vowel:
            score += 0.6
            checks.append(f"✓✓ Tonic vowel match: '{m.tonic_vowel}'")
        else:
            checks.append(f"✗✗ Different tonic vowels: '{m.tonic_vowel}' vs '{c.tonic_vowel}'")

        # Tonic consonant (affects quality)
        if m.tonic_consonant == c.tonic_consonant:
            score += 0.4
            checks.append(f"✓ Tonic consonant match: '{m.tonic_consonant}'")
        elif m.tonic_consonant and c.tonic_consonant:
            checks.append(f"△ Different tonic consonants: '{m.tonic_consonant}' vs '{c.tonic_consonant}'")
        else:
            checks.append(f"△ Tonic consonant: '{m.tonic_consonant}' vs '{c.tonic_consonant}'")

        reasoning = " | ".join(checks)
        return min(score, 1.0), reasoning

    def _analyze_phonetic_patterns(self, m: PhoneticFeatures, c: PhoneticFeatures) -> Tuple[float, str]:
        """Analyze overall phonetic similarity"""
        score = 0.0
        checks = []

        # Vowel sequence similarity
        m_vowels = m.vowel_sequence.split('-')
        c_vowels = c.vowel_sequence.split('-')
        vowel_sim = self._sequence_similarity(m_vowels, c_vowels)
        score += vowel_sim * 0.5
        checks.append(f"Vowel sequence: {m.vowel_sequence} vs {c.vowel_sequence} (sim: {vowel_sim:.2f})")

        # Ending similarity (last 2 characters)
        m_end = m.word[-2:] if len(m.word) >= 2 else m.word
        c_end = c.word[-2:] if len(c.word) >= 2 else c.word
        if m_end == c_end:
            score += 0.3
            checks.append(f"✓ Same ending: -{m_end}")
        elif m.word[-1] == c.word[-1]:
            score += 0.15
            checks.append(f"△ Same final letter: {m.word[-1]}")
        else:
            checks.append(f"Different endings: -{m_end} vs -{c_end}")

        # Consonant similarity
        m_cons = set(m.consonant_sequence.split(', '))
        c_cons = set(c.consonant_sequence.split(', '))
        if m_cons and c_cons:
            cons_overlap = len(m_cons & c_cons) / max(len(m_cons), len(c_cons))
            score += cons_overlap * 0.2
            checks.append(f"Consonant overlap: {cons_overlap:.2f}")

        reasoning = " | ".join(checks)
        return min(score, 1.0), reasoning

    def _analyze_morphology(self, m: PhoneticFeatures, c: PhoneticFeatures) -> Tuple[float, str]:
        """Analyze morphological relationships"""
        score = 0.0
        checks = []

        # Prefix match
        if m.prefix and c.prefix and m.prefix == c.prefix:
            score += 0.5
            checks.append(f"✓ Shared prefix: '{m.prefix}-'")
        elif m.prefix or c.prefix:
            checks.append(f"Different prefixes: '{m.prefix}' vs '{c.prefix}'")

        # Suffix match
        if m.suffix and c.suffix and m.suffix == c.suffix:
            score += 0.5
            checks.append(f"✓ Shared suffix: '-{m.suffix}'")
        elif m.suffix and c.suffix:
            # Similar suffixes (e.g., -ado vs -ato)
            if self._similar_suffixes(m.suffix, c.suffix):
                score += 0.3
                checks.append(f"△ Similar suffixes: '-{m.suffix}' vs '-{c.suffix}'")
            else:
                checks.append(f"Different suffixes: '-{m.suffix}' vs '-{c.suffix}'")

        reasoning = " | ".join(checks) if checks else "No morphological features"
        return min(score, 1.0), reasoning

    def _sequence_similarity(self, seq1: List[str], seq2: List[str]) -> float:
        """Calculate sequence similarity (simple approach)"""
        if not seq1 or not seq2:
            return 0.0

        # Count matching positions
        matches = sum(1 for a, b in zip(seq1, seq2) if a == b)
        max_len = max(len(seq1), len(seq2))
        return matches / max_len if max_len > 0 else 0.0

    def _similar_suffixes(self, suf1: str, suf2: str) -> bool:
        """Check if suffixes are similar"""
        similar_pairs = [
            ('ado', 'ato'), ('ada', 'ata'),
            ('ido', 'ito'), ('ida', 'ita'),
            ('oso', 'osa'), ('or', 'ora')
        ]
        return (suf1, suf2) in similar_pairs or (suf2, suf1) in similar_pairs

    def _get_level(self, score: float) -> str:
        """Get match level from score"""
        for (min_score, max_score), level in self.LEVELS.items():
            if min_score <= score < max_score:
                return level
        return "no_match"

    def _generate_explanation(self, mother: str, candidate: str, score: float,
                            prosodic: str, tonic: str, phonetic: str, morpho: str) -> str:
        """Generate human-readable explanation"""
        if score >= 0.90:
            quality = "Excellent"
        elif score >= 0.75:
            quality = "Strong"
        elif score >= 0.60:
            quality = "Good"
        elif score >= 0.40:
            quality = "Weak"
        else:
            quality = "Poor"

        return f"{quality} match between '{mother}' and '{candidate}'. {tonic}"

    def rank_candidates(self, mother_word: str, candidates: List[str]) -> List[MatchScore]:
        """Rank all candidates by match score"""
        scores = [self.score_pair(mother_word, c) for c in candidates]
        scores.sort(key=lambda x: x.score, reverse=True)
        return scores
