/**
 * RimaBR - App UI controller
 */

import { init, searchRhymes, suggest } from './search.js';

// DOM elements
const input = document.getElementById('search-input');
const btn = document.getElementById('search-btn');
const acBox = document.getElementById('autocomplete');
const loadingEl = document.getElementById('loading');
const resultsEl = document.getElementById('results');
const statsEl = document.getElementById('stats');
const nearToggle = document.getElementById('near-toggle');

let debounceTimer = null;
let acIndex = -1; // autocomplete selection index

// --- Initialization ---

init().then(({ totalWords }) => {
  statsEl.innerHTML = `<span>${totalWords.toLocaleString('pt-BR')}</span> palavras indexadas`;
  input.disabled = false;
  btn.disabled = false;
  input.focus();
}).catch(err => {
  console.error('Failed to initialize:', err);
  statsEl.textContent = 'Erro ao carregar dados';
});

// --- Event handlers ---

input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const val = input.value.trim();
  if (val.length < 2) {
    closeAutocomplete();
    return;
  }
  debounceTimer = setTimeout(() => showSuggestions(val), 150);
});

input.addEventListener('keydown', (e) => {
  const items = acBox.querySelectorAll('div');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    acIndex = Math.min(acIndex + 1, items.length - 1);
    highlightAc(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    acIndex = Math.max(acIndex - 1, -1);
    highlightAc(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (acIndex >= 0 && items[acIndex]) {
      input.value = items[acIndex].textContent;
      closeAutocomplete();
    }
    doSearch();
  } else if (e.key === 'Escape') {
    closeAutocomplete();
  }
});

btn.addEventListener('click', () => doSearch());

// Close autocomplete on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) closeAutocomplete();
});

// --- Autocomplete ---

function showSuggestions(prefix) {
  const results = suggest(prefix, 8);
  acBox.innerHTML = '';
  acIndex = -1;
  if (results.length === 0) { closeAutocomplete(); return; }
  results.forEach(word => {
    const div = document.createElement('div');
    div.textContent = word;
    div.addEventListener('click', () => {
      input.value = word;
      closeAutocomplete();
      doSearch();
    });
    acBox.appendChild(div);
  });
  acBox.classList.add('open');
}

function highlightAc(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === acIndex));
}

function closeAutocomplete() {
  acBox.classList.remove('open');
  acIndex = -1;
}

// --- Search ---

async function doSearch() {
  const word = input.value.trim().toLowerCase();
  if (!word || word.length < 2) return;
  closeAutocomplete();

  // Show loading
  loadingEl.style.display = 'block';
  resultsEl.innerHTML = '';

  try {
    const result = await searchRhymes(word, {
      includeNear: nearToggle.checked,
      maxResults: 60,
    });
    renderResults(result);
  } catch (err) {
    console.error('Search error:', err);
    resultsEl.innerHTML = '<div class="empty-state"><p>Erro na busca. Tente outra palavra.</p></div>';
  } finally {
    loadingEl.style.display = 'none';
  }
}

// --- Rendering ---

function renderResults(result) {
  resultsEl.innerHTML = '';

  // Analysis card
  const m = result.motherEntry;
  const analysisHtml = `
    <div class="analysis-card">
      <div class="word-title">${escHtml(m.w)}</div>
      <div class="syllables">${m.s.join(' · ')}</div>
      <div class="tags">
        <span class="tag stress">${stressLabel(m.t)}</span>
        <span class="tag vowel">vogal: ${escHtml(m.v)}</span>
        <span class="tag rhyme-key">rima: -${escHtml(m.r)}</span>
        <span class="tag">${m.n} sil.</span>
      </div>
    </div>
  `;
  resultsEl.insertAdjacentHTML('beforeend', analysisHtml);

  // Perfect rhymes
  if (result.perfect.length > 0) {
    resultsEl.insertAdjacentHTML('beforeend', renderSection(
      'Rimas perfeitas',
      result.perfect,
      result.totalPerfect
    ));
  }

  // Near rhymes
  if (result.near.length > 0) {
    resultsEl.insertAdjacentHTML('beforeend', renderSection(
      'Rimas aproximadas',
      result.near,
      result.totalNear
    ));
  }

  // Empty
  if (result.perfect.length === 0 && result.near.length === 0) {
    resultsEl.insertAdjacentHTML('beforeend', `
      <div class="empty-state">
        <div class="icon">~</div>
        <p>Nenhuma rima encontrada para "<strong>${escHtml(m.w)}</strong>".</p>
        <p style="margin-top:0.4rem">Tente ativar "rimas aproximadas" ou outra palavra.</p>
      </div>
    `);
  }

  // Make word cards clickable for re-search
  resultsEl.querySelectorAll('.word-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const w = card.querySelector('.word').textContent;
      input.value = w;
      doSearch();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderSection(title, items, total) {
  const cards = items.map(r => `
    <div class="word-card">
      <div class="word">${escHtml(r.word)}</div>
      <div class="meta">
        <div class="score-bar">
          <div class="fill ${r.level}" style="width:${Math.round(r.total * 100)}%"></div>
        </div>
        <span class="score-label">${Math.round(r.total * 100)}%</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="results-section">
      <h2>${title} <span class="count">(${items.length}${total > items.length ? ' de ' + total : ''})</span></h2>
      <div class="word-grid">${cards}</div>
    </div>
  `;
}

function stressLabel(t) {
  if (t === 'ox') return 'oxitona';
  if (t === 'pa') return 'paroxitona';
  if (t === 'pr') return 'proparoxitona';
  return t;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
