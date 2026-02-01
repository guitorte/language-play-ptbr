# API Integration Guide

How to use this PT-BR Phonetic Matching System with Claude API (Opus 4.5)

## Overview

This system can work in two modes:

1. **Local Mode** (working NOW) - Uses rule-based analysis + algorithmic reasoning
2. **API Mode** (requires API key) - Enhances with Claude's natural language reasoning

## Local Mode (No API Required)

Already working! Just use:

```python
from src import ReasoningBasedMatcher

matcher = ReasoningBasedMatcher(context="general")
result = matcher.score_pair("recato", "recado")
print(result.score)  # 0.94
print(result.explanation)
```

## API Mode (Claude Enhancement)

### Prerequisites

```bash
pip install anthropic
export ANTHROPIC_API_KEY="your-key-here"
```

### Example 1: Basic Phonetic Analysis with Claude

```python
import anthropic
from src.analyzers.phonetic_analyzer import PTBRPhoneticAnalyzer

# Analyze words locally
analyzer = PTBRPhoneticAnalyzer()
word1_features = analyzer.analyze("recato")
word2_features = analyzer.analyze("recado")

# Load reasoning prompt
with open('src/prompts/claude_reasoning.xml', 'r') as f:
    system_prompt = f.read()

# Use Claude for enhanced reasoning
client = anthropic.Anthropic(api_key="your-key")

message = client.messages.create(
    model="claude-opus-4-5-20251101",  # Use Opus 4.5
    max_tokens=2000,
    temperature=0.1,  # Low for consistency
    system=system_prompt,
    messages=[{
        "role": "user",
        "content": f"""
Analyze phonetic match:

Mother word: {word1_features.to_dict()}
Candidate: {word2_features.to_dict()}

Context: general poetry

Provide detailed reasoning and score.
"""
    }]
)

print(message.content[0].text)
```

### Example 2: Batch Analysis with Caching

```python
import anthropic
from src import PTBRPhoneticAnalyzer

def analyze_with_claude_cached(mother_word: str, candidates: list[str]):
    """
    Uses Claude with prompt caching for efficiency
    """
    analyzer = PTBRPhoneticAnalyzer()
    client = anthropic.Anthropic()

    # Load system prompt (will be cached)
    with open('src/prompts/claude_reasoning.xml', 'r') as f:
        system_prompt = f.read()

    mother_features = analyzer.analyze(mother_word)

    results = []
    for candidate in candidates:
        candidate_features = analyzer.analyze(candidate)

        response = client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=2000,
            temperature=0.1,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": {"type": "ephemeral"}  # Cache the system prompt
                }
            ],
            messages=[{
                "role": "user",
                "content": f"""
Mother: {mother_features.to_dict()}
Candidate: {candidate_features.to_dict()}
Context: general
"""
            }]
        )

        results.append({
            "word": candidate,
            "analysis": response.content[0].text
        })

    return results

# Usage
candidates = ["recado", "acato", "pescado", "cedo"]
results = analyze_with_claude_cached("recato", candidates)

for r in results:
    print(f"\n{r['word']}:")
    print(r['analysis'])
```

### Example 3: Hybrid Approach (Best of Both)

```python
from src import ReasoningBasedMatcher, PTBRPhoneticAnalyzer
import anthropic

class HybridPhoneticMatcher:
    """
    Combines local algorithmic analysis with Claude's reasoning
    """

    def __init__(self, api_key: str = None, use_api: bool = False):
        self.analyzer = PTBRPhoneticAnalyzer()
        self.local_matcher = ReasoningBasedMatcher()
        self.use_api = use_api and api_key

        if self.use_api:
            self.client = anthropic.Anthropic(api_key=api_key)
            with open('src/prompts/claude_reasoning.xml') as f:
                self.system_prompt = f.read()

    def score_pair(self, word1: str, word2: str, context: str = "general"):
        """
        Score a word pair using hybrid approach
        """
        # Always get local analysis first
        local_result = self.local_matcher.score_pair(word1, word2)

        if not self.use_api:
            return local_result

        # Enhance with Claude reasoning
        features1 = self.analyzer.analyze(word1)
        features2 = self.analyzer.analyze(word2)

        response = self.client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=2000,
            temperature=0.1,
            system=self.system_prompt,
            messages=[{
                "role": "user",
                "content": f"""
Local analysis score: {local_result.score}
Local reasoning: {local_result.explanation}

Please enhance this analysis:

Mother: {features1.to_dict()}
Candidate: {features2.to_dict()}
Context: {context}

Provide:
1. Your own detailed reasoning
2. Whether you agree with local score
3. Any nuances the algorithmic approach missed
"""
            }]
        )

        return {
            "local_score": local_result.score,
            "local_reasoning": local_result.explanation,
            "claude_analysis": response.content[0].text,
            "features": {
                "word1": features1.to_dict(),
                "word2": features2.to_dict()
            }
        }

# Usage
matcher = HybridPhoneticMatcher(
    api_key="your-key",
    use_api=True  # Set to False for local-only
)

result = matcher.score_pair("recato", "recado")
print("Local:", result['local_score'])
print("Claude's analysis:", result['claude_analysis'])
```

### Example 4: Context-Specific Poetry Analysis

```python
import anthropic
from src import PTBRPhoneticAnalyzer

def analyze_for_poetry_type(poem_type: str, word_pairs: list[tuple]):
    """
    Analyze word pairs for specific poetry types
    """
    client = anthropic.Anthropic()
    analyzer = PTBRPhoneticAnalyzer()

    context_map = {
        "soneto": "strict_rhyme",
        "cordel": "general",
        "rap": "hip_hop",
        "haicai": "assonance",
        "mpb": "general"
    }

    context = context_map.get(poem_type.lower(), "general")

    with open('src/prompts/claude_reasoning.xml') as f:
        system_prompt = f.read()

    results = []

    for word1, word2 in word_pairs:
        features1 = analyzer.analyze(word1)
        features2 = analyzer.analyze(word2)

        response = client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=2000,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": f"""
Poetry type: {poem_type}
Context: {context}

Analyze if these would work well in {poem_type}:

Word 1: {features1.to_dict()}
Word 2: {features2.to_dict()}

Consider:
1. Would native PT-BR speakers accept this rhyme in {poem_type}?
2. Any cultural/stylistic considerations for {poem_type}?
3. Score and recommendation
"""
            }]
        )

        results.append({
            "pair": (word1, word2),
            "analysis": response.content[0].text
        })

    return results

# Usage
sonnet_pairs = [
    ("amor", "flor"),
    ("paixão", "coração"),
    ("vida", "perdida")
]

results = analyze_for_poetry_type("soneto", sonnet_pairs)

for r in results:
    print(f"\n{r['pair'][0]} / {r['pair'][1]}:")
    print(r['analysis'])
```

### Example 5: Few-Shot Learning for Custom Patterns

```python
import anthropic

def train_claude_on_corpus(rhyme_examples: list[dict]):
    """
    Give Claude examples from a specific corpus to learn patterns
    """
    client = anthropic.Anthropic()

    # Build few-shot examples
    examples_text = "\n\n".join([
        f"""
Example {i+1}:
Word pair: {ex['word1']} / {ex['word2']}
Corpus: {ex['corpus']}
Native speaker rating: {ex['rating']}/10
Why it works: {ex['explanation']}
"""
        for i, ex in enumerate(rhyme_examples)
    ])

    with open('src/prompts/claude_reasoning.xml') as f:
        system_prompt = f.read()

    # Now Claude has learned from examples
    def score_with_corpus_knowledge(word1: str, word2: str):
        response = client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=2000,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": f"""
Here are examples from a specific poetry corpus:

{examples_text}

Now analyze this new pair in the same style:
{word1} / {word2}

Score it and explain if it matches the corpus patterns.
"""
            }]
        )
        return response.content[0].text

    return score_with_corpus_knowledge

# Usage: Train on Chico Buarque's rhymes
chico_examples = [
    {
        "word1": "samba", "word2": "lembrança",
        "corpus": "Chico Buarque MPB",
        "rating": 9,
        "explanation": "Nasal vowels create musicality typical of Chico's style"
    },
    # Add more examples...
]

scorer = train_claude_on_corpus(chico_examples)
result = scorer("viola", "novela")
print(result)
```

## Cost Optimization

### Prompt Caching

Claude's prompt caching can reduce costs significantly:

```python
# System prompt is cached automatically if >1024 tokens and marked
system_prompt_with_cache = [
    {
        "type": "text",
        "text": your_long_system_prompt,
        "cache_control": {"type": "ephemeral"}
    }
]

# First call: full cost
# Subsequent calls within 5 min: ~90% cheaper for cached portion
```

### Use Haiku for Batch Processing

For large-scale analysis, use Haiku instead:

```python
# Haiku is 20x cheaper, still very capable
model = "claude-haiku-3-5-20241022"

# Use Opus only for:
# - Complex edge cases
# - Final validation
# - Nuanced poetry analysis
```

## Performance Comparison

| Approach | Speed | Cost | Explainability | Accuracy |
|----------|-------|------|----------------|----------|
| Local only | ⚡⚡⚡ Fast | 💰 Free | ⭐⭐⭐ Good | ⭐⭐⭐ Good |
| Haiku API | ⚡⚡ Medium | 💰 Very Low | ⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Excellent |
| Opus API | ⚡ Slower | 💰💰 Medium | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐⭐ Best |
| Hybrid | ⚡⚡ Medium | 💰 Low | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐⭐ Best |

## Recommended Strategy

```python
class SmartPhoneticMatcher:
    """
    Uses local for speed, API for quality
    """

    def __init__(self, api_key: str = None):
        self.local = ReasoningBasedMatcher()
        self.has_api = bool(api_key)

        if self.has_api:
            self.client = anthropic.Anthropic(api_key=api_key)

    def score(self, word1: str, word2: str):
        # Always get local score (instant)
        local = self.local.score_pair(word1, word2)

        # For edge cases, use API
        if local.score > 0.40 and local.score < 0.70:
            # Ambiguous case - ask Claude
            if self.has_api:
                return self.get_api_opinion(word1, word2, local)

        # Clear cases - trust local
        return local
```

## Next Steps

1. Get your Anthropic API key: https://console.anthropic.com/
2. Try the hybrid approach
3. Fine-tune prompts for your use case
4. Build your specific application

## Questions?

The local system works NOW without API.
API integration adds Claude's reasoning for complex cases.
Both approaches are valid - choose based on your needs!
