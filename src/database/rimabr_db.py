"""
RimaBR - Brazilian Portuguese Rhyme Database and Search Engine
Similar to RhymeZone but optimized for PT-BR phonetic matching
"""

import sqlite3
import json
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import pickle

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.phonetic_analyzer import PTBRPhoneticAnalyzer, PhoneticFeatures
from src.matchers.reasoning_matcher import ReasoningBasedMatcher


@dataclass
class IndexedWord:
    """Indexed word with pre-computed phonetic features"""
    word: str
    syllable_count: int
    stress_type: str
    stress_position: int
    tonic_syllable: str
    tonic_vowel: str
    tonic_consonant: Optional[str]
    vowel_sequence: str
    consonant_sequence: str
    suffix: Optional[str]
    prefix: Optional[str]
    # For fast lookups
    ending_2: str  # Last 2 chars
    ending_3: str  # Last 3 chars
    ending_4: str  # Last 4 chars


class RimaBRDatabase:
    """
    Word database with phonetic indexing for fast rhyme searching
    """

    def __init__(self, db_path: str = "data/rimabr.db"):
        self.db_path = db_path
        self.analyzer = PTBRPhoneticAnalyzer()
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database with indexes"""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Main words table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE NOT NULL,
                syllable_count INTEGER,
                stress_type TEXT,
                stress_position INTEGER,
                tonic_syllable TEXT,
                tonic_vowel TEXT,
                tonic_consonant TEXT,
                vowel_sequence TEXT,
                consonant_sequence TEXT,
                suffix TEXT,
                prefix TEXT,
                ending_2 TEXT,
                ending_3 TEXT,
                ending_4 TEXT,
                features_json TEXT
            )
        """)

        # Create indexes for fast lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tonic_vowel
            ON words(tonic_vowel)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tonic_syllable
            ON words(tonic_syllable)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_stress_type
            ON words(stress_type)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_syllable_count
            ON words(syllable_count)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_suffix
            ON words(suffix)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ending_2
            ON words(ending_2)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ending_3
            ON words(ending_3)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_ending_4
            ON words(ending_4)
        """)

        conn.commit()
        conn.close()

    def index_words(self, words: List[str], batch_size: int = 1000):
        """
        Index a list of words with phonetic analysis

        Args:
            words: List of Portuguese words
            batch_size: Number of words to process in each batch
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        indexed = 0
        skipped = 0

        for i in range(0, len(words), batch_size):
            batch = words[i:i + batch_size]

            for word in batch:
                word = word.strip().lower()
                if not word or len(word) < 2:
                    skipped += 1
                    continue

                try:
                    # Analyze word
                    features = self.analyzer.analyze(word)

                    # Prepare indexed data
                    ending_2 = word[-2:] if len(word) >= 2 else word
                    ending_3 = word[-3:] if len(word) >= 3 else word
                    ending_4 = word[-4:] if len(word) >= 4 else word

                    cursor.execute("""
                        INSERT OR REPLACE INTO words (
                            word, syllable_count, stress_type, stress_position,
                            tonic_syllable, tonic_vowel, tonic_consonant,
                            vowel_sequence, consonant_sequence, suffix, prefix,
                            ending_2, ending_3, ending_4, features_json
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        word,
                        features.syllable_count,
                        features.stress_type,
                        features.stress_position,
                        features.tonic_syllable,
                        features.tonic_vowel,
                        features.tonic_consonant,
                        features.vowel_sequence,
                        features.consonant_sequence,
                        features.suffix,
                        features.prefix,
                        ending_2,
                        ending_3,
                        ending_4,
                        json.dumps(features.to_dict())
                    ))

                    indexed += 1

                except Exception as e:
                    print(f"Error indexing '{word}': {e}")
                    skipped += 1

            # Commit batch
            conn.commit()
            print(f"Indexed {indexed} words... (skipped: {skipped})")

        conn.close()
        print(f"\nTotal indexed: {indexed}")
        print(f"Total skipped: {skipped}")

    def search(
        self,
        query_word: str,
        filters: Optional[Dict] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Search for rhyming words with optional filters

        Args:
            query_word: Word to find rhymes for
            filters: Dict of filter criteria
            limit: Maximum number of results

        Returns:
            List of matching words with scores
        """
        # Analyze query word
        query_features = self.analyzer.analyze(query_word)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Build SQL query based on filters
        conditions = []
        params = []

        if filters:
            if "stress_type" in filters:
                conditions.append("stress_type = ?")
                params.append(filters["stress_type"])

            if "syllable_count" in filters:
                conditions.append("syllable_count = ?")
                params.append(filters["syllable_count"])

            if "min_syllables" in filters:
                conditions.append("syllable_count >= ?")
                params.append(filters["min_syllables"])

            if "max_syllables" in filters:
                conditions.append("syllable_count <= ?")
                params.append(filters["max_syllables"])

            if "tonic_vowel" in filters:
                conditions.append("tonic_vowel = ?")
                params.append(filters["tonic_vowel"])

            if "suffix" in filters:
                conditions.append("suffix = ?")
                params.append(filters["suffix"])

            if "ending" in filters:
                ending = filters["ending"]
                conditions.append(f"ending_{len(ending)} = ?")
                params.append(ending)

        # Build WHERE clause with smart phonetic pre-filtering
        if not conditions:
            # No user filters - add smart phonetic pre-filtering
            # Priority 1: Same ending + stress type (best rhymes)
            # Priority 2: Same tonic vowel + stress type (good rhymes)
            # Priority 3: Same stress type only (acceptable rhymes)

            ending_2 = query_features.syllables[-1][-2:] if len(query_features.syllables[-1]) >= 2 else None

            conditions_smart = []
            params_smart = []

            # Option 1: Same ending_2 and stress type
            if ending_2:
                conditions_smart.append("(ending_2 = ? AND stress_type = ?)")
                params_smart.extend([ending_2, query_features.stress_type])

            # Option 2: Same tonic vowel and stress type
            conditions_smart.append("(tonic_vowel = ? AND stress_type = ?)")
            params_smart.extend([query_features.tonic_vowel, query_features.stress_type])

            # Option 3: Just same stress type
            conditions_smart.append("stress_type = ?")
            params_smart.extend([query_features.stress_type])

            where_clause = f"({' OR '.join(conditions_smart)})"
            params = params_smart
        else:
            where_clause = " AND ".join(conditions)

        # Exclude the query word itself
        where_clause += " AND word != ?"
        params.append(query_word.lower())

        # Execute query - get many candidates, scoring will rank them
        # For smart filter, get enough to cover the whole range
        fetch_limit = 5000 if not conditions else limit * 10

        cursor.execute(f"""
            SELECT word, features_json
            FROM words
            WHERE {where_clause}
            LIMIT ?
        """, params + [fetch_limit])

        results = cursor.fetchall()
        conn.close()

        # Score and rank results
        matcher = ReasoningBasedMatcher(context="general")
        scored_results = []

        for word, features_json in results:
            score_data = matcher.score_pair(query_word, word)

            scored_results.append({
                "word": word,
                "score": score_data.score,
                "level": score_data.level,
                "explanation": score_data.explanation,
                "breakdown": score_data.score_breakdown,
                "features": json.loads(features_json)
            })

        # Sort by score
        scored_results.sort(key=lambda x: x["score"], reverse=True)

        return scored_results[:limit]

    def search_by_criteria(
        self,
        tonic_vowel: Optional[str] = None,
        tonic_syllable: Optional[str] = None,
        stress_type: Optional[str] = None,
        syllable_count: Optional[int] = None,
        suffix: Optional[str] = None,
        ending: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Search words by specific phonetic criteria
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        conditions = []
        params = []

        if tonic_vowel:
            conditions.append("tonic_vowel = ?")
            params.append(tonic_vowel)

        if tonic_syllable:
            conditions.append("tonic_syllable = ?")
            params.append(tonic_syllable)

        if stress_type:
            conditions.append("stress_type = ?")
            params.append(stress_type)

        if syllable_count:
            conditions.append("syllable_count = ?")
            params.append(syllable_count)

        if suffix:
            conditions.append("suffix = ?")
            params.append(suffix)

        if ending:
            conditions.append(f"ending_{len(ending)} = ?")
            params.append(ending)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        cursor.execute(f"""
            SELECT word, features_json
            FROM words
            WHERE {where_clause}
            LIMIT ?
        """, params + [limit])

        results = cursor.fetchall()
        conn.close()

        return [
            {
                "word": word,
                "features": json.loads(features_json)
            }
            for word, features_json in results
        ]

    def get_stats(self) -> Dict:
        """Get database statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        stats = {}

        # Total words
        cursor.execute("SELECT COUNT(*) FROM words")
        stats["total_words"] = cursor.fetchone()[0]

        # By stress type
        cursor.execute("""
            SELECT stress_type, COUNT(*)
            FROM words
            GROUP BY stress_type
        """)
        stats["by_stress_type"] = dict(cursor.fetchall())

        # By syllable count
        cursor.execute("""
            SELECT syllable_count, COUNT(*)
            FROM words
            GROUP BY syllable_count
            ORDER BY syllable_count
        """)
        stats["by_syllable_count"] = dict(cursor.fetchall())

        # Top suffixes
        cursor.execute("""
            SELECT suffix, COUNT(*)
            FROM words
            WHERE suffix IS NOT NULL
            GROUP BY suffix
            ORDER BY COUNT(*) DESC
            LIMIT 20
        """)
        stats["top_suffixes"] = dict(cursor.fetchall())

        conn.close()
        return stats
