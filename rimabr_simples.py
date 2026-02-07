#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RimaBR - Versão Simplificada Standalone
Busca de rimas em português brasileiro com interface web local

USO:
    python rimabr_simples.py

Depois abra: http://localhost:8000
"""

import http.server
import socketserver
import json
import urllib.parse
import sqlite3
from pathlib import Path

PORT = 8000
DB_PATH = "data/rimabr.db"

# Verificar se banco existe
if not Path(DB_PATH).exists():
    print(f"❌ Banco de dados não encontrado: {DB_PATH}")
    print("⚠️  Execute primeiro: python rimabr_cli.py load data/palavras_completas.txt --batch-size 5000")
    exit(1)

# HTML da interface (embutido)
HTML_INTERFACE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RimaBR - Buscador de Rimas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }
        .search-box {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }
        input[type="text"] {
            flex: 1;
            padding: 15px 20px;
            font-size: 18px;
            border: 2px solid #ddd;
            border-radius: 10px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            padding: 15px 40px;
            font-size: 18px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.3s;
            font-weight: bold;
        }
        button:hover {
            background: #5568d3;
        }
        .filters {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .filters label {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 8px 15px;
            background: #f5f5f5;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
        }
        .filters input[type="checkbox"] {
            cursor: pointer;
        }
        .filters input[type="number"] {
            width: 60px;
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .results {
            margin-top: 30px;
        }
        .result-item {
            padding: 15px;
            margin-bottom: 10px;
            background: #f9f9f9;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .result-item:hover {
            background: #f0f0f0;
        }
        .word {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        .score {
            display: inline-block;
            padding: 5px 15px;
            background: #667eea;
            color: white;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
        .info {
            color: #666;
            font-size: 14px;
        }
        .loading {
            text-align: center;
            color: #667eea;
            font-size: 18px;
            padding: 20px;
        }
        .empty {
            text-align: center;
            color: #999;
            padding: 40px;
            font-size: 18px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 RimaBR</h1>
        <p class="subtitle">Buscador de Rimas em Português Brasileiro</p>

        <div class="stats" id="stats"></div>

        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Digite uma palavra (ex: amor, paixão, liberdade)..."
                   onkeypress="if(event.key==='Enter') buscar()">
            <button onclick="buscar()">Buscar</button>
        </div>

        <div class="filters">
            <label>
                <input type="checkbox" id="filterOxitona"> Oxítona
            </label>
            <label>
                <input type="checkbox" id="filterParoxitona"> Paroxítona
            </label>
            <label>
                <input type="checkbox" id="filterProparoxitona"> Proparoxítona
            </label>
            <label>
                Sílabas: <input type="number" id="filterSyllables" min="1" max="15" placeholder="Todas">
            </label>
            <label>
                Máx resultados: <input type="number" id="filterLimit" min="5" max="100" value="30">
            </label>
        </div>

        <div class="results" id="results"></div>
    </div>

    <script>
        // Carregar estatísticas ao abrir
        window.onload = function() {
            fetch('/api/stats')
                .then(r => r.json())
                .then(data => {
                    const html = `
                        <div class="stat-card">
                            <div class="stat-number">${data.total.toLocaleString('pt-BR')}</div>
                            <div class="stat-label">Palavras</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.oxitonas.toLocaleString('pt-BR')}</div>
                            <div class="stat-label">Oxítonas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.paroxitonas.toLocaleString('pt-BR')}</div>
                            <div class="stat-label">Paroxítonas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${data.proparoxitonas.toLocaleString('pt-BR')}</div>
                            <div class="stat-label">Proparoxítonas</div>
                        </div>
                    `;
                    document.getElementById('stats').innerHTML = html;
                });
            document.getElementById('searchInput').focus();
        };

        function buscar() {
            const word = document.getElementById('searchInput').value.trim();
            if (!word) {
                alert('Digite uma palavra!');
                return;
            }

            // Construir filtros
            const filters = {};
            if (document.getElementById('filterOxitona').checked) filters.stress = 'oxítona';
            if (document.getElementById('filterParoxitona').checked) filters.stress = 'paroxítona';
            if (document.getElementById('filterProparoxitona').checked) filters.stress = 'proparoxítona';

            const syllables = document.getElementById('filterSyllables').value;
            if (syllables) filters.syllables = syllables;

            const limit = document.getElementById('filterLimit').value || 30;

            // Mostrar loading
            document.getElementById('results').innerHTML = '<div class="loading">🔍 Buscando rimas...</div>';

            // Fazer requisição
            const params = new URLSearchParams({word, limit, ...filters});

            fetch(`/api/search?${params}`)
                .then(r => r.json())
                .then(data => {
                    if (data.results.length === 0) {
                        document.getElementById('results').innerHTML =
                            '<div class="empty">😔 Nenhuma rima encontrada. Tente outra palavra ou remova os filtros.</div>';
                        return;
                    }

                    let html = `<h2>✨ ${data.results.length} rimas para "${word}"</h2><br>`;
                    data.results.forEach((r, i) => {
                        const scoreColor = r.score >= 0.8 ? '#10b981' :
                                          r.score >= 0.6 ? '#f59e0b' : '#ef4444';
                        html += `
                            <div class="result-item">
                                <div>
                                    <div class="word">${i+1}. ${r.word}</div>
                                    <div class="info">${r.stress_type} • ${r.syllables} sílabas • ${r.ending}</div>
                                </div>
                                <div class="score" style="background: ${scoreColor}">
                                    ${(r.score * 100).toFixed(0)}
                                </div>
                            </div>
                        `;
                    });
                    document.getElementById('results').innerHTML = html;
                })
                .catch(err => {
                    document.getElementById('results').innerHTML =
                        '<div class="empty">❌ Erro ao buscar. Tente novamente.</div>';
                    console.error(err);
                });
        }
    </script>
</body>
</html>
"""

class RimaBRHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse URL
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Rota: Página principal
        if path == '/' or path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(HTML_INTERFACE.encode('utf-8'))
            return

        # Rota: API de busca
        elif path == '/api/search':
            word = query.get('word', [''])[0].strip().lower()
            limit = int(query.get('limit', [30])[0])
            stress_filter = query.get('stress', [None])[0]
            syllables_filter = query.get('syllables', [None])[0]

            if not word:
                self.send_json({'error': 'Palavra não fornecida'}, 400)
                return

            results = self.search_rhymes(word, limit, stress_filter, syllables_filter)
            self.send_json({'word': word, 'results': results})
            return

        # Rota: API de estatísticas
        elif path == '/api/stats':
            stats = self.get_stats()
            self.send_json(stats)
            return

        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'404 Not Found')

    def send_json(self, data, status=200):
        """Envia resposta JSON"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def search_rhymes(self, word, limit, stress_filter, syllables_filter):
        """Busca rimas no banco de dados"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Construir query SQL
        conditions = ["word != ?"]
        params = [word]

        if stress_filter:
            conditions.append("stress_type = ?")
            params.append(stress_filter)

        if syllables_filter:
            conditions.append("syllable_count = ?")
            params.append(int(syllables_filter))

        where_clause = " AND ".join(conditions)

        # Buscar palavras que terminam similar ou têm mesma vogal tônica
        cursor.execute(f"""
            SELECT word, stress_type, syllable_count, ending_2, ending_3, tonic_vowel
            FROM words
            WHERE {where_clause}
            ORDER BY
                CASE
                    WHEN ending_2 = (SELECT ending_2 FROM words WHERE word = ?) THEN 1
                    WHEN tonic_vowel = (SELECT tonic_vowel FROM words WHERE word = ?) THEN 2
                    ELSE 3
                END,
                LENGTH(word) ASC
            LIMIT ?
        """, params + [word, word, limit * 2])

        results = []
        for row in cursor.fetchall():
            word_result, stress, syllables, ending_2, ending_3, tonic_vowel = row

            # Calcular score simples baseado em terminação
            score = 0.5
            if ending_3 and ending_3 == self.get_ending(word, 3):
                score = 0.85
            elif ending_2 and ending_2 == self.get_ending(word, 2):
                score = 0.75
            elif tonic_vowel == self.get_tonic_vowel(word):
                score = 0.60

            results.append({
                'word': word_result,
                'score': score,
                'stress_type': stress,
                'syllables': syllables,
                'ending': ending_2 or ''
            })

        conn.close()

        # Ordenar por score
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]

    def get_ending(self, word, n):
        """Pega últimas N letras"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(f"SELECT ending_{n} FROM words WHERE word = ?", (word,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None

    def get_tonic_vowel(self, word):
        """Pega vogal tônica"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT tonic_vowel FROM words WHERE word = ?", (word,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None

    def get_stats(self):
        """Retorna estatísticas do banco"""
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM words")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM words WHERE stress_type = 'oxítona'")
        oxitonas = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM words WHERE stress_type = 'paroxítona'")
        paroxitonas = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM words WHERE stress_type = 'proparoxítona'")
        proparoxitonas = cursor.fetchone()[0]

        conn.close()

        return {
            'total': total,
            'oxitonas': oxitonas,
            'paroxitonas': paroxitonas,
            'proparoxitonas': proparoxitonas
        }

    def log_message(self, format, *args):
        """Silenciar logs do servidor"""
        pass

def main():
    print("=" * 80)
    print("🎵 RimaBR - Buscador de Rimas Simplificado")
    print("=" * 80)
    print()
    print(f"✅ Banco de dados: {DB_PATH}")

    # Verificar tamanho do banco
    db_size = Path(DB_PATH).stat().st_size / (1024 * 1024)
    print(f"✅ Tamanho: {db_size:.1f} MB")

    # Contar palavras
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM words")
    total = cursor.fetchone()[0]
    conn.close()

    print(f"✅ Palavras indexadas: {total:,}")
    print()
    print(f"🌐 Servidor rodando em: http://localhost:{PORT}")
    print()
    print("📖 Abra esse endereço no seu navegador!")
    print()
    print("⚠️  Pressione Ctrl+C para parar o servidor")
    print("=" * 80)
    print()

    # Iniciar servidor
    with socketserver.TCPServer(("", PORT), RimaBRHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Servidor parado. Até logo!")

if __name__ == "__main__":
    main()
