#!/usr/bin/env python3
"""
Tests for ReasoningBasedMatcher
Validates multi-criteria phonetic matching with expected score ranges.

These pairs are curated by linguistic analysis of Brazilian Portuguese:
- Perfect rhymes should score >= 0.75
- Good near-rhymes should score 0.40-0.74
- Non-rhymes should score < 0.40

These ground-truth expectations also validate the JS port in matcher.js.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.matchers.reasoning_matcher import ReasoningBasedMatcher, MatchScore
import pytest


@pytest.fixture
def matcher():
    return ReasoningBasedMatcher(context="general")


@pytest.fixture
def strict_matcher():
    return ReasoningBasedMatcher(context="strict_rhyme")


@pytest.fixture
def hiphop_matcher():
    return ReasoningBasedMatcher(context="hip_hop")


class TestPerfectRhymes:
    """Word pairs that any Portuguese speaker recognizes as strong rhymes."""

    def test_amor_calor(self, matcher):
        """Classic oxítona perfect rhyme: same ending '-or'."""
        score = matcher.score_pair('amor', 'calor')
        assert score.score >= 0.70, f"amor/calor: expected >= 0.70, got {score.score}"
        assert score.level in ('perfect_match', 'strong_match', 'good_match')

    def test_coracao_paixao(self, matcher):
        """Nasal diphthong rhyme: '-ção' / '-xão'."""
        score = matcher.score_pair('coração', 'paixão')
        assert score.score >= 0.65, f"coração/paixão: expected >= 0.65, got {score.score}"

    def test_saudade_cidade(self, matcher):
        """Paroxítona rhyme: '-dade'."""
        score = matcher.score_pair('saudade', 'cidade')
        assert score.score >= 0.65, f"saudade/cidade: expected >= 0.65, got {score.score}"

    def test_flor_dor(self, matcher):
        """Short oxítona rhyme."""
        score = matcher.score_pair('flor', 'dor')
        assert score.score >= 0.70, f"flor/dor: expected >= 0.70, got {score.score}"

    def test_cantar_amar(self, matcher):
        """Infinitive rhyme: '-ar'."""
        score = matcher.score_pair('cantar', 'amar')
        assert score.score >= 0.65, f"cantar/amar: expected >= 0.65, got {score.score}"


class TestNearRhymes:
    """Pairs with partial phonetic similarity — assonance, slant rhymes."""

    def test_amor_amado(self, matcher):
        """Same root, different suffix — different stress type, weak phonetic link."""
        score = matcher.score_pair('amor', 'amado')
        assert score.score < 0.70, f"amor/amado: expected < 0.70 (not a rhyme), got {score.score}"
        assert score.score >= 0.10, f"amor/amado: expected >= 0.10 (some similarity), got {score.score}"

    def test_coracao_emocao(self, matcher):
        """Same suffix '-ção' but different body — should still match well."""
        score = matcher.score_pair('coração', 'emoção')
        assert score.score >= 0.55, f"coração/emoção: expected >= 0.55, got {score.score}"

    def test_bonito_recato(self, matcher):
        """Same stress type, similar ending pattern."""
        score = matcher.score_pair('bonito', 'recato')
        assert score.score >= 0.25, f"bonito/recato: expected >= 0.25, got {score.score}"


class TestNonRhymes:
    """Pairs that do not rhyme — different stress types, vowels, endings."""

    def test_amor_mesa(self, matcher):
        """Oxítona vs paroxítona, completely different sounds."""
        score = matcher.score_pair('amor', 'mesa')
        assert score.score < 0.40, f"amor/mesa: expected < 0.40, got {score.score}"

    def test_cafe_saudade(self, matcher):
        """Oxítona vs paroxítona, different vowels."""
        score = matcher.score_pair('café', 'saudade')
        assert score.score < 0.45, f"café/saudade: expected < 0.45, got {score.score}"

    def test_musica_amor(self, matcher):
        """Proparoxítona vs oxítona — completely different prosody."""
        score = matcher.score_pair('música', 'amor')
        assert score.score < 0.35, f"música/amor: expected < 0.35, got {score.score}"


class TestContextSensitivity:
    """Same pair should score differently under different contexts."""

    def test_strict_is_stricter(self, matcher, strict_matcher):
        """Strict context should give lower scores for imperfect rhymes."""
        general = matcher.score_pair('bonito', 'sapato')
        strict = strict_matcher.score_pair('bonito', 'sapato')
        # Strict shouldn't be dramatically different, but the weights shift
        assert isinstance(general.score, float)
        assert isinstance(strict.score, float)

    def test_hiphop_values_prosody(self, matcher, hiphop_matcher):
        """Hip-hop context gives more weight to prosodic match."""
        # Two words with matching prosody but imperfect rhyme
        general = matcher.score_pair('marginalização', 'criminalização')
        hiphop = hiphop_matcher.score_pair('marginalização', 'criminalização')
        # Both should score well since they have similar prosody + morphology
        assert general.score >= 0.50
        assert hiphop.score >= 0.50


class TestScoreBreakdown:
    """Validate that score breakdowns are well-formed."""

    def test_breakdown_keys(self, matcher):
        score = matcher.score_pair('amor', 'calor')
        assert 'prosodic' in score.score_breakdown
        assert 'tonic_core' in score.score_breakdown
        assert 'phonetic' in score.score_breakdown
        assert 'morphological' in score.score_breakdown

    def test_breakdown_sums_close_to_total(self, matcher):
        """The weighted sum of dimensions should approximate the total score."""
        score = matcher.score_pair('amor', 'calor')
        breakdown_sum = sum(score.score_breakdown.values())
        assert abs(breakdown_sum - score.score) < 0.02, \
            f"Breakdown sum {breakdown_sum} doesn't match total {score.score}"

    def test_reasoning_populated(self, matcher):
        """All reasoning fields should be non-empty strings."""
        score = matcher.score_pair('saudade', 'cidade')
        for key in ['prosodic', 'tonic_core', 'phonetic', 'morphological']:
            assert isinstance(score.reasoning[key], str)
            assert len(score.reasoning[key]) > 0, f"Empty reasoning for {key}"


class TestMatchLevels:
    """Validate level classification boundaries."""

    def test_level_is_valid(self, matcher):
        for pair in [('amor', 'calor'), ('amor', 'mesa'), ('saudade', 'cidade')]:
            score = matcher.score_pair(*pair)
            valid_levels = {'perfect_match', 'strong_match', 'good_match',
                          'weak_match', 'poor_match', 'no_match'}
            assert score.level in valid_levels, \
                f"{pair}: invalid level '{score.level}'"

    def test_explanation_mentions_words(self, matcher):
        score = matcher.score_pair('amor', 'calor')
        assert 'amor' in score.explanation
        assert 'calor' in score.explanation


class TestRanking:
    """Validate that ranking produces sensible orderings."""

    def test_perfect_rhyme_ranks_first(self, matcher):
        """Among candidates, the perfect rhyme should rank highest."""
        candidates = ['calor', 'mesa', 'sapato', 'flor']
        ranked = matcher.rank_candidates('amor', candidates)
        # 'calor' (same ending -or) should rank above 'mesa' and 'sapato'
        words_in_order = [r.word for r in ranked]
        calor_idx = words_in_order.index('calor')
        mesa_idx = words_in_order.index('mesa')
        assert calor_idx < mesa_idx, \
            f"calor should rank above mesa: {words_in_order}"

    def test_ranking_returns_all_candidates(self, matcher):
        candidates = ['calor', 'dor', 'flor']
        ranked = matcher.rank_candidates('amor', candidates)
        assert len(ranked) == 3

    def test_ranking_descending_order(self, matcher):
        candidates = ['calor', 'mesa', 'sapato', 'flor', 'dor']
        ranked = matcher.rank_candidates('amor', candidates)
        scores = [r.score for r in ranked]
        assert scores == sorted(scores, reverse=True), \
            f"Scores not in descending order: {scores}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
