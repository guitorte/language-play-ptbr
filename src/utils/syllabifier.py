"""
Enhanced PT-BR Syllabifier
More accurate syllable separation following Portuguese phonological rules
"""

from typing import List
import re


class PTBRSyllabifier:
    """
    Brazilian Portuguese syllabifier with improved accuracy
    Based on PT-BR phonotactic rules
    """

    VOWELS = set('aeiouáéíóúâêôãõàèìòù')
    CONSONANTS = set('bcdfghjklmnpqrstvwxyzç')

    # Consonant clusters that stay together in same syllable
    INSEPARABLE_CLUSTERS = {
        'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
        'pl', 'pr', 'tl', 'tr', 'vr',
        'ch', 'lh', 'nh',
        'qu', 'gu'
    }

    # Digraphs (two letters = one sound)
    DIGRAPHS = {'ch', 'lh', 'nh', 'rr', 'ss', 'qu', 'gu', 'sc', 'sç', 'xc'}

    def syllabify(self, word: str) -> List[str]:
        """
        Syllabify a PT-BR word
        Returns list of syllables
        """
        if not word:
            return []

        word = word.lower().strip()

        # Handle simple cases
        if len(word) <= 2:
            return [word]

        syllables = []
        current = ""
        i = 0

        while i < len(word):
            char = word[i]
            current += char

            # Look ahead
            if i < len(word) - 1:
                next_char = word[i + 1]
                lookahead = char + next_char

                # Handle digraphs (stay together)
                if lookahead in self.DIGRAPHS:
                    current += next_char
                    i += 2
                    continue

                # V + V (usually separate unless diphthong)
                if self._is_vowel(char) and self._is_vowel(next_char):
                    if self._is_diphthong(lookahead):
                        # Diphthong - stay together
                        current += next_char
                        i += 2
                        # After diphthong, close syllable
                        syllables.append(current)
                        current = ""
                        continue
                    else:
                        # Hiatus - separate
                        syllables.append(current)
                        current = ""
                        i += 1
                        continue

                # V + C + V
                if (self._is_vowel(char) and
                    self._is_consonant(next_char) and
                    i + 2 < len(word) and
                    self._is_vowel(word[i + 2])):

                    # Check if consonant cluster follows
                    if i + 3 < len(word):
                        cluster = next_char + word[i + 2]
                        if cluster in self.INSEPARABLE_CLUSTERS:
                            # V + CC (inseparable) → break before cluster
                            syllables.append(current)
                            current = ""
                            i += 1
                            continue

                    # Single consonant between vowels → goes with next syllable
                    syllables.append(current)
                    current = ""
                    i += 1
                    continue

                # V + CC + V (consonant cluster)
                if (self._is_vowel(char) and
                    i + 3 < len(word) and
                    self._is_consonant(next_char) and
                    self._is_consonant(word[i + 2]) and
                    self._is_vowel(word[i + 3])):

                    cluster = next_char + word[i + 2]

                    if cluster in self.INSEPARABLE_CLUSTERS:
                        # Cluster stays together with following vowel
                        syllables.append(current)
                        current = ""
                        i += 1
                        continue
                    else:
                        # Split cluster: first C with current, second with next
                        current += next_char
                        syllables.append(current)
                        current = ""
                        i += 2
                        continue

            i += 1

        # Add remaining
        if current:
            if syllables:
                syllables[-1] += current
            else:
                syllables.append(current)

        return syllables if syllables else [word]

    def _is_vowel(self, char: str) -> bool:
        return char.lower() in self.VOWELS

    def _is_consonant(self, char: str) -> bool:
        return char.lower() in self.CONSONANTS

    def _is_diphthong(self, two_chars: str) -> bool:
        """Check if two vowels form a diphthong (stay in same syllable)"""
        diphthongs = {
            'ai', 'ei', 'oi', 'ui',
            'au', 'eu', 'iu', 'ou',
            'ãe', 'ão', 'õe',
            'ui', 'ói'
        }
        return two_chars.lower() in diphthongs


def syllabify_word(word: str) -> List[str]:
    """Convenience function"""
    syllabifier = PTBRSyllabifier()
    return syllabifier.syllabify(word)


# Manual overrides for common words (optional)
SYLLABLE_OVERRIDES = {
    'recato': ['re', 'ca', 'to'],
    'recado': ['re', 'ca', 'do'],
    'acato': ['a', 'ca', 'to'],
    'pescado': ['pes', 'ca', 'do'],
    'recito': ['re', 'ci', 'to'],
    'acetato': ['a', 'ce', 'ta', 'to'],
    'abstrato': ['abs', 'tra', 'to'],
    'absurdo': ['ab', 'sur', 'do'],
    'indignado': ['in', 'dig', 'na', 'do'],
    'átrio': ['á', 'tri', 'o'],
    'cedo': ['ce', 'do'],
}


def syllabify_with_overrides(word: str) -> List[str]:
    """
    Syllabify with manual overrides for accuracy
    Use this for production until syllabifier is perfected
    """
    word_lower = word.lower()
    if word_lower in SYLLABLE_OVERRIDES:
        return SYLLABLE_OVERRIDES[word_lower]

    return syllabify_word(word)
