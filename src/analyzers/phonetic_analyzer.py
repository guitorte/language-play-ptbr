"""
PT-BR Phonetic Analyzer
Deterministic rule-based phonetic decomposition for Brazilian Portuguese
"""

import re
from typing import Dict, List, Optional
from dataclasses import dataclass

try:
    from ..utils.syllabifier import syllabify_with_overrides
except ImportError:
    # Fallback if import fails
    syllabify_with_overrides = None


@dataclass
class PhoneticFeatures:
    """Structured phonetic features of a PT-BR word"""
    word: str
    syllables: List[str]
    syllable_count: int
    stress_type: str  # oxítona, paroxítona, proparoxítona
    stress_position: int  # 1-indexed from end
    tonic_syllable: str
    tonic_vowel: str
    tonic_consonant: Optional[str]
    vowel_sequence: str
    consonant_sequence: str
    prefix: Optional[str]
    suffix: Optional[str]

    def to_dict(self) -> Dict:
        return {
            'word': self.word,
            'syllables': self.syllables,
            'syllable_count': self.syllable_count,
            'stress_type': self.stress_type,
            'stress_position': self.stress_position,
            'tonic_syllable': self.tonic_syllable,
            'tonic_vowel': self.tonic_vowel,
            'tonic_consonant': self.tonic_consonant,
            'vowel_sequence': self.vowel_sequence,
            'consonant_sequence': self.consonant_sequence,
            'prefix': self.prefix,
            'suffix': self.suffix
        }


class PTBRPhoneticAnalyzer:
    """Analyzes phonetic structure of Portuguese-Brazilian words"""

    VOWELS = set('aeiouáéíóúâêôãõ')
    CONSONANTS = set('bcdfghjklmnpqrstvwxyz')

    # Common PT-BR prefixes
    PREFIXES = [
        're', 'des', 'in', 'im', 'ir', 'anti', 'auto', 'contra',
        'entre', 'extra', 'inter', 'intra', 'pre', 'pro', 'sub', 'super'
    ]

    # Common PT-BR suffixes
    SUFFIXES = [
        'ado', 'ada', 'ato', 'ata', 'ido', 'ida', 'oso', 'osa',
        'mente', 'ção', 'são', 'dor', 'dora', 'eiro', 'eira',
        'ismo', 'ista', 'eza', 'ice', 'ez', 'ura', 'agem'
    ]

    def analyze(self, word: str) -> PhoneticFeatures:
        """Complete phonetic analysis of a word"""
        word = word.lower().strip()

        # Use enhanced syllabifier if available
        if syllabify_with_overrides:
            syllables = syllabify_with_overrides(word)
        else:
            syllables = self._syllabify(word)
        syllable_count = len(syllables)
        stress_pos, stress_type = self._detect_stress(word, syllables)
        tonic_syllable = syllables[stress_pos]
        tonic_vowel = self._extract_tonic_vowel(tonic_syllable)
        tonic_consonant = self._extract_tonic_consonant(tonic_syllable)
        vowel_seq = self._extract_vowels(word)
        consonant_seq = self._extract_consonants(word)
        prefix = self._extract_prefix(word)
        suffix = self._extract_suffix(word)

        return PhoneticFeatures(
            word=word,
            syllables=syllables,
            syllable_count=syllable_count,
            stress_type=stress_type,
            stress_position=syllable_count - stress_pos,  # Position from end
            tonic_syllable=tonic_syllable,
            tonic_vowel=tonic_vowel,
            tonic_consonant=tonic_consonant,
            vowel_sequence=vowel_seq,
            consonant_sequence=consonant_seq,
            prefix=prefix,
            suffix=suffix
        )

    def _syllabify(self, word: str) -> List[str]:
        """
        Simple syllabification for PT-BR
        Note: This is simplified - production would need more complex rules
        """
        # Remove accents for processing (keep track for stress)
        syllables = []
        current = ""

        i = 0
        while i < len(word):
            char = word[i]
            current += char

            # Check if we should break
            if i < len(word) - 1:
                next_char = word[i + 1]

                # Vowel followed by consonant + vowel = break after consonant
                if (self._is_vowel(char) and
                    i + 2 < len(word) and
                    self._is_consonant(next_char) and
                    self._is_vowel(word[i + 2])):
                    current += next_char
                    syllables.append(current)
                    current = ""
                    i += 2
                    continue

                # Two consonants = usually break between them
                if (self._is_consonant(char) and
                    self._is_consonant(next_char) and
                    not self._is_cluster(char + next_char)):
                    syllables.append(current)
                    current = ""

            i += 1

        if current:
            syllables.append(current)

        # Fallback: if syllabification failed, use simple vowel-based split
        if not syllables or len(syllables) == 1:
            syllables = self._simple_syllabify(word)

        return syllables

    def _simple_syllabify(self, word: str) -> List[str]:
        """Fallback: simple vowel-based syllabification"""
        # For demonstration - split based on vowel clusters
        # This is very simplified but works for basic cases
        result = []
        current = ""

        for char in word:
            current += char
            if self._is_vowel(char):
                result.append(current)
                current = ""

        if current:
            if result:
                result[-1] += current
            else:
                result.append(current)

        return result if result else [word]

    def _is_vowel(self, char: str) -> bool:
        return char.lower() in self.VOWELS

    def _is_consonant(self, char: str) -> bool:
        return char.lower() in self.CONSONANTS

    def _is_cluster(self, chars: str) -> bool:
        """Check if consonant cluster should stay together"""
        clusters = {'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
                   'pl', 'pr', 'tr', 'vr', 'ch', 'lh', 'nh'}
        return chars.lower() in clusters

    def _detect_stress(self, word: str, syllables: List[str]) -> tuple[int, str]:
        """
        Detect stress position and type
        Returns: (syllable_index, stress_type)
        """
        # Check for accent marks (explicit stress)
        for i, syl in enumerate(syllables):
            if any(c in syl for c in 'áéíóúâêô'):
                pos = i
                break
        else:
            # Default stress rules for PT-BR
            if len(syllables) == 1:
                pos = 0
            elif word.endswith(('a', 'e', 'o', 'as', 'es', 'os', 'am', 'em')):
                # Paroxítona by default
                pos = len(syllables) - 2 if len(syllables) > 1 else 0
            else:
                # Oxítona (words ending in other letters)
                pos = len(syllables) - 1

        # Determine stress type based on position from end
        position_from_end = len(syllables) - pos

        if position_from_end == 1:
            stress_type = "oxítona"
        elif position_from_end == 2:
            stress_type = "paroxítona"
        else:
            stress_type = "proparoxítona"

        return pos, stress_type

    def _extract_tonic_vowel(self, syllable: str) -> str:
        """Extract the main vowel from tonic syllable"""
        for char in syllable:
            if self._is_vowel(char):
                return char.lower()
        return ""

    def _extract_tonic_consonant(self, syllable: str) -> Optional[str]:
        """Extract the main consonant from tonic syllable"""
        for char in syllable:
            if self._is_consonant(char):
                return char.lower()
        return None

    def _extract_vowels(self, word: str) -> str:
        """Extract vowel sequence"""
        return '-'.join([c for c in word.lower() if self._is_vowel(c)])

    def _extract_consonants(self, word: str) -> str:
        """Extract consonant sequence"""
        return ', '.join([c for c in word.lower() if self._is_consonant(c)])

    def _extract_prefix(self, word: str) -> Optional[str]:
        """Detect common prefix"""
        word_lower = word.lower()
        for prefix in sorted(self.PREFIXES, key=len, reverse=True):
            if word_lower.startswith(prefix) and len(word) > len(prefix):
                return prefix
        return None

    def _extract_suffix(self, word: str) -> Optional[str]:
        """Detect common suffix"""
        word_lower = word.lower()
        for suffix in sorted(self.SUFFIXES, key=len, reverse=True):
            if word_lower.endswith(suffix) and len(word) > len(suffix):
                return suffix
        return None


def analyze_word(word: str) -> PhoneticFeatures:
    """Convenience function for quick analysis"""
    analyzer = PTBRPhoneticAnalyzer()
    return analyzer.analyze(word)
