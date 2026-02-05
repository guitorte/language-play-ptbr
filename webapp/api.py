#!/usr/bin/env python3
"""
RimaBR Web API
Flask API backend for web interface - NO AI REQUIRED
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.database.rimabr_db import RimaBRDatabase

app = Flask(__name__)
CORS(app)  # Enable CORS for API

# Initialize database
DB_PATH = Path(__file__).parent.parent / "data" / "rimabr.db"
db = RimaBRDatabase(str(DB_PATH))


@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')


@app.route('/api/search', methods=['POST'])
def search_rhymes():
    """
    Search for rhymes

    Request JSON:
    {
        "word": "amor",
        "filters": {
            "stress_type": "paroxítona",
            "min_syllables": 2,
            "max_syllables": 4,
            "suffix": "ado"
        },
        "limit": 50
    }

    Response JSON:
    {
        "query": "amor",
        "results": [
            {
                "word": "calor",
                "score": 0.69,
                "level": "good_match",
                "features": {...},
                "explanation": "...",
                "breakdown": {...}
            }
        ],
        "count": 10
    }
    """
    try:
        data = request.get_json()

        if not data or 'word' not in data:
            return jsonify({"error": "Missing 'word' parameter"}), 400

        word = data['word'].strip()
        if not word:
            return jsonify({"error": "Empty word"}), 400

        filters = data.get('filters', {})
        limit = data.get('limit', 50)

        # Search
        results = db.search(word, filters=filters if filters else None, limit=limit)

        return jsonify({
            "query": word,
            "results": results,
            "count": len(results)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/pattern', methods=['POST'])
def search_pattern():
    """
    Search by phonetic pattern

    Request JSON:
    {
        "tonic_vowel": "a",
        "stress_type": "paroxítona",
        "syllables": 3,
        "suffix": "dade",
        "limit": 50
    }
    """
    try:
        data = request.get_json()

        results = db.search_by_criteria(
            tonic_vowel=data.get('tonic_vowel'),
            tonic_syllable=data.get('tonic_syllable'),
            stress_type=data.get('stress_type'),
            syllable_count=data.get('syllables'),
            suffix=data.get('suffix'),
            ending=data.get('ending'),
            limit=data.get('limit', 50)
        )

        return jsonify({
            "pattern": data,
            "results": results,
            "count": len(results)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        stats = db.get_stats()
        return jsonify(stats)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_word():
    """
    Analyze a single word phonetically

    Request JSON:
    {
        "word": "amor"
    }

    Response JSON:
    {
        "word": "amor",
        "features": {
            "syllables": ["a", "mor"],
            "syllable_count": 2,
            "stress_type": "oxítona",
            "tonic_syllable": "mor",
            "tonic_vowel": "o",
            ...
        }
    }
    """
    try:
        data = request.get_json()

        if not data or 'word' not in data:
            return jsonify({"error": "Missing 'word' parameter"}), 400

        word = data['word'].strip()

        from src.analyzers.phonetic_analyzer import PTBRPhoneticAnalyzer
        analyzer = PTBRPhoneticAnalyzer()
        features = analyzer.analyze(word)

        return jsonify({
            "word": word,
            "features": features.to_dict()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*80)
    print("RimaBR Web Server")
    print("="*80)
    print(f"\nDatabase: {DB_PATH}")

    # Check if database exists
    if not DB_PATH.exists():
        print("\n⚠️  WARNING: Database not found!")
        print(f"Create it with: python rimabr_cli.py load data/palavras_exemplo.txt")
        print()

    print("\nStarting server at http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("="*80 + "\n")

    app.run(debug=True, host='0.0.0.0', port=5000)
