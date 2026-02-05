// RimaBR - Frontend JavaScript (No AI Required!)

// State
let currentQuery = '';
let darkMode = localStorage.getItem('darkMode') === 'true';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initEventListeners();
    loadStats();

    // Auto-focus search input
    document.getElementById('searchInput').focus();
});

// Dark Mode
function initDarkMode() {
    if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

document.getElementById('darkModeToggle').addEventListener('click', () => {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);

    if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('darkModeToggle').textContent = '🌙';
    }
});

// Event Listeners
function initEventListeners() {
    // Search
    document.getElementById('searchBtn').addEventListener('click', search);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') search();
    });

    // Filter Toggle
    document.getElementById('filterToggle').addEventListener('click', toggleFilters);

    // Clear Filters
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Quick Genre Filters
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => applyGenreFilter(btn.dataset.genre));
    });
}

// Toggle Filters Panel
function toggleFilters() {
    const panel = document.getElementById('filterPanel');
    panel.classList.toggle('active');
}

// Clear All Filters
function clearFilters() {
    document.getElementById('stressFilter').value = '';
    document.getElementById('minSyllables').value = '';
    document.getElementById('maxSyllables').value = '';
    document.getElementById('suffixFilter').value = '';
    document.getElementById('endingFilter').value = '';
    document.getElementById('limitFilter').value = '50';

    // Remove active state from genre pills
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Apply Genre-Specific Filters
function applyGenreFilter(genre) {
    clearFilters();

    // Remove active from all pills
    document.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active to clicked pill
    event.target.classList.add('active');

    // Open filter panel
    document.getElementById('filterPanel').classList.add('active');

    switch (genre) {
        case 'rap':
            // Rap: polysyllabic words
            document.getElementById('minSyllables').value = '4';
            document.getElementById('limitFilter').value = '50';
            break;

        case 'sertanejo':
            // Sertanejo: paroxítonas, 2-3 sílabas
            document.getElementById('stressFilter').value = 'paroxítona';
            document.getElementById('minSyllables').value = '2';
            document.getElementById('maxSyllables').value = '3';
            break;

        case 'mpb':
            // MPB: all stress types, focus on quality
            document.getElementById('limitFilter').value = '30';
            break;

        case 'repente':
            // Repente: 7 syllables (Martelo)
            document.getElementById('minSyllables').value = '7';
            document.getElementById('maxSyllables').value = '7';
            break;
    }
}

// Search Function
async function search() {
    const word = document.getElementById('searchInput').value.trim();

    if (!word) {
        alert('Digite uma palavra para buscar rimas!');
        return;
    }

    currentQuery = word;

    // Build filters
    const filters = {};

    const stress = document.getElementById('stressFilter').value;
    if (stress) filters.stress_type = stress;

    const minSyl = document.getElementById('minSyllables').value;
    if (minSyl) filters.min_syllables = parseInt(minSyl);

    const maxSyl = document.getElementById('maxSyllables').value;
    if (maxSyl) filters.max_syllables = parseInt(maxSyl);

    const suffix = document.getElementById('suffixFilter').value.trim();
    if (suffix) filters.suffix = suffix;

    const ending = document.getElementById('endingFilter').value.trim();
    if (ending) filters.ending = ending;

    const limit = parseInt(document.getElementById('limitFilter').value) || 50;

    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: word,
                filters: Object.keys(filters).length > 0 ? filters : null,
                limit: limit
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        displayResults(data);

    } catch (error) {
        console.error('Error:', error);
        alert('Erro ao buscar rimas: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Display Results
function displayResults(data) {
    document.getElementById('queryWord').textContent = data.query;
    document.getElementById('resultsCount').textContent = `${data.count} resultado${data.count !== 1 ? 's' : ''}`;

    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';

    if (data.count === 0) {
        resultsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">😕 Nenhuma rima encontrada</p>
                <p>Tente:</p>
                <ul style="list-style: none; margin-top: 1rem;">
                    <li>• Remover alguns filtros</li>
                    <li>• Usar uma palavra diferente</li>
                    <li>• Aumentar o limite de resultados</li>
                </ul>
            </div>
        `;
    } else {
        data.results.forEach((result, index) => {
            const card = createResultCard(result, index + 1);
            resultsList.appendChild(card);
        });
    }

    document.getElementById('results').style.display = 'block';

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create Result Card
function createResultCard(result, rank) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Determine score level
    const level = getScoreLevel(result.score);
    const levelText = getLevelText(result.level);

    // Build features text
    const features = result.features;
    const featuresText = `
        ${features.stress_type} •
        ${features.syllable_count} sílaba${features.syllable_count !== 1 ? 's' : ''} •
        tônica: "${features.tonic_syllable}"
    `;

    card.innerHTML = `
        <div class="result-header">
            <div>
                <span style="color: var(--text-secondary); font-weight: 600;">#${rank}</span>
                <span class="result-word">${result.word}</span>
            </div>
            <div class="result-score">
                <span class="score-badge ${level}">${(result.score * 100).toFixed(0)}</span>
                <span style="color: var(--text-secondary); font-weight: 600;">${levelText}</span>
            </div>
        </div>
        <div class="result-meta">
            ${featuresText}
        </div>
        <div class="result-explanation">
            ${result.explanation}
        </div>
    `;

    return card;
}

// Get Score Level Class
function getScoreLevel(score) {
    if (score >= 0.90) return 'perfect';
    if (score >= 0.75) return 'strong';
    if (score >= 0.60) return 'good';
    if (score >= 0.40) return 'weak';
    return 'poor';
}

// Get Level Text
function getLevelText(level) {
    const texts = {
        'perfect_match': 'Perfeita',
        'strong_match': 'Forte',
        'good_match': 'Boa',
        'weak_match': 'Fraca',
        'poor_match': 'Fraca',
        'no_match': 'Mínima'
    };
    return texts[level] || 'N/A';
}

// Load Database Stats
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        document.getElementById('totalWords').textContent = stats.total_words.toLocaleString('pt-BR');

        const byStress = stats.by_stress_type || {};
        document.getElementById('oxitonaCount').textContent = (byStress['oxítona'] || 0).toLocaleString('pt-BR');
        document.getElementById('paroxitonaCount').textContent = (byStress['paroxítona'] || 0).toLocaleString('pt-BR');
        document.getElementById('proparoxitonaCount').textContent = (byStress['proparoxítona'] || 0).toLocaleString('pt-BR');

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}
