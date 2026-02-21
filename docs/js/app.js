/**
 * RimaBR - Phonetic Match Explorer
 * Tab-based UI: Rimas | Compare | Analyze | Similar | Search
 */

import { analyze } from './analyzer.js';
import { compareWords } from './compare.js';
import { init as initSearch, searchRhymes, suggest, getAllWords } from './search.js';
import { searchSimilar } from './similarity.js';
import { searchCategorizedRhymes } from './rhyme-search.js';

// ===== State =====

let activeTab = 'rimas';
let currentContext = 'general';
let lastCompareWords = null; // { a, b } for context re-scoring

// ===== DOM refs =====

const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Compare
const wordAInput = document.getElementById('word-a');
const wordBInput = document.getElementById('word-b');
const compareBtn = document.getElementById('compare-btn');
const contextSwitcher = document.getElementById('context-switcher');
const contextPills = document.querySelectorAll('.pill[data-ctx]');
const compareResults = document.getElementById('compare-results');
const compareHint = document.getElementById('compare-hint');

// Analyze
const analyzeInput = document.getElementById('word-analyze');
const analyzeBtn = document.getElementById('analyze-btn');
const analyzeResults = document.getElementById('analyze-results');
const analyzeHint = document.getElementById('analyze-hint');

// Search
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const nearToggle = document.getElementById('near-toggle');
const loadingEl = document.getElementById('loading');
const searchResults = document.getElementById('search-results');
const searchHint = document.getElementById('search-hint');
const statsEl = document.getElementById('stats');

// Similar
const similarInput = document.getElementById('word-similar');
const similarBtn = document.getElementById('similar-btn');
const similarLoading = document.getElementById('similar-loading');
const similarResults = document.getElementById('similar-results');
const similarHint = document.getElementById('similar-hint');

// Rimas (categorized rhyme search)
const rimasInput = document.getElementById('rimas-input');
const rimasBtn = document.getElementById('rimas-btn');
const rimasLoading = document.getElementById('rimas-loading');
const rimasResults = document.getElementById('rimas-results');
const rimasHint = document.getElementById('rimas-hint');
const rimasStats = document.getElementById('rimas-stats');
const rimasFilter = document.getElementById('rimas-filter');
const rimasFilterPills = document.querySelectorAll('.pill[data-rimas-filter]');

// Autocomplete boxes
const acBoxes = {
  a: document.getElementById('ac-a'),
  b: document.getElementById('ac-b'),
  analyze: document.getElementById('ac-analyze'),
  similar: document.getElementById('ac-similar'),
  search: document.getElementById('ac-search'),
  rimas: document.getElementById('ac-rimas'),
};

// ===== Initialization =====

initSearch().then(({ totalWords }) => {
  const wordCountLabel = `<span>${totalWords.toLocaleString('pt-BR')}</span> palavras indexadas`;
  statsEl.innerHTML = wordCountLabel;
  rimasStats.innerHTML = wordCountLabel;
  searchInput.disabled = false;
  searchBtn.disabled = false;
  similarInput.disabled = false;
  similarBtn.disabled = false;
  rimasInput.disabled = false;
  rimasBtn.disabled = false;
  console.log('[RimaBR] Search initialized:', totalWords, 'words');
}).catch(err => {
  console.error('[RimaBR] Failed to init search:', err);
  statsEl.textContent = 'Modo offline — Compare e Analisar disponíveis';
  rimasStats.textContent = 'Modo offline — Compare e Analisar disponíveis';
  similarInput.disabled = false;
  similarBtn.disabled = false;
  rimasInput.disabled = false;
  rimasBtn.disabled = false;
  console.warn('[RimaBR] Similar tab enabled but search data unavailable');
});

// ===== Tab Navigation =====

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tabContents.forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`tab-${target}`).classList.add('active');
    activeTab = target;
    location.hash = target;
  });
});

// Restore tab from URL hash
if (location.hash) {
  const hash = location.hash.slice(1);
  const matchTab = document.querySelector(`.tab[data-tab="${hash}"]`);
  if (matchTab) matchTab.click();
}

// ===== Autocomplete Infrastructure =====

let acTimers = {};
let acIndices = {};

function setupAutocomplete(inputEl, acBox, onSelect) {
  const key = inputEl.id;
  acIndices[key] = -1;

  inputEl.addEventListener('input', () => {
    clearTimeout(acTimers[key]);
    const val = inputEl.value.trim();
    if (val.length < 2) { closeAc(acBox, key); return; }
    acTimers[key] = setTimeout(() => showAc(val, acBox, key, inputEl, onSelect), 150);
  });

  inputEl.addEventListener('keydown', (e) => {
    const items = acBox.querySelectorAll('div');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      acIndices[key] = Math.min(acIndices[key] + 1, items.length - 1);
      highlightAc(items, acIndices[key]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      acIndices[key] = Math.max(acIndices[key] - 1, -1);
      highlightAc(items, acIndices[key]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (acIndices[key] >= 0 && items[acIndices[key]]) {
        inputEl.value = items[acIndices[key]].textContent;
        closeAc(acBox, key);
      }
      onSelect();
    } else if (e.key === 'Escape') {
      closeAc(acBox, key);
    }
  });
}

function showAc(prefix, acBox, key, inputEl, onSelect) {
  const results = suggest(prefix, 8);
  acBox.innerHTML = '';
  acIndices[key] = -1;
  if (results.length === 0) { closeAc(acBox, key); return; }
  results.forEach(word => {
    const div = document.createElement('div');
    div.textContent = word;
    div.addEventListener('click', () => {
      inputEl.value = word;
      closeAc(acBox, key);
      onSelect();
    });
    acBox.appendChild(div);
  });
  acBox.classList.add('open');
}

function highlightAc(items, idx) {
  items.forEach((el, i) => el.classList.toggle('active', i === idx));
}

function closeAc(acBox, key) {
  acBox.classList.remove('open');
  acIndices[key] = -1;
}

// Close all on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-box')) {
    Object.values(acBoxes).forEach(box => box.classList.remove('open'));
  }
});

// Wire up autocomplete for all inputs
setupAutocomplete(wordAInput, acBoxes.a, doCompare);
setupAutocomplete(wordBInput, acBoxes.b, doCompare);
setupAutocomplete(analyzeInput, acBoxes.analyze, doAnalyze);
setupAutocomplete(similarInput, acBoxes.similar, doSimilar);
setupAutocomplete(searchInput, acBoxes.search, doSearch);
setupAutocomplete(rimasInput, acBoxes.rimas, doRimas);

// ===== COMPARE MODE =====

compareBtn.addEventListener('click', doCompare);

contextPills.forEach(pill => {
  pill.addEventListener('click', () => {
    currentContext = pill.dataset.ctx;
    contextPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    if (lastCompareWords) doCompare();
  });
});

function doCompare() {
  const a = wordAInput.value.trim().toLowerCase();
  const b = wordBInput.value.trim().toLowerCase();
  if (!a || !b) return;

  lastCompareWords = { a, b };
  const result = compareWords(a, b, currentContext);

  compareHint.style.display = 'none';
  contextSwitcher.style.display = 'flex';
  compareResults.innerHTML = renderCompare(result);
}

function renderCompare(result) {
  const { wordA, wordB, match, allContexts, activeContext } = result;
  const pct = Math.round(match.total * 100);

  // Score header
  let html = `
    <div class="compare-score-header">
      <div class="score-value ${match.level}">${pct}%</div>
      <div class="score-level ${match.level}">Correspondência ${match.levelLabel}</div>
      <div class="context-scores">
        ${Object.entries(allContexts).map(([key, ctx]) =>
          `<span class="ctx-score ${key === activeContext ? 'active' : ''}">
            ${ctx.label}: <span class="val">${Math.round(ctx.total * 100)}%</span>
          </span>`
        ).join('')}
      </div>
    </div>
  `;

  // Side-by-side feature cards
  html += `<div class="features-pair">
    ${renderFeatureCard(wordA)}
    ${renderFeatureCard(wordB)}
  </div>`;

  // Dimension breakdown
  html += `<div class="dimensions">
    ${match.dimensions.map(d => renderDimension(d)).join('')}
  </div>`;

  return html;
}

function renderFeatureCard(f) {
  const syllablesHtml = f.s.map((syl, i) =>
    `<span class="syl ${i === f.stressIndex ? 'tonic' : ''}">${esc(syl)}</span>`
  ).join('');

  const tags = [];
  tags.push(`<span class="fc-tag stress">${esc(f.stressType)}</span>`);
  tags.push(`<span class="fc-tag vowel">tônica: ${esc(f.v)}</span>`);
  tags.push(`<span class="fc-tag rhyme">rima: -${esc(f.r)}</span>`);
  tags.push(`<span class="fc-tag">${f.n} síl.</span>`);
  if (f.tonicConsonant) tags.push(`<span class="fc-tag">cons: ${esc(f.tonicConsonant)}</span>`);
  if (f.prefix) tags.push(`<span class="fc-tag prefix">pre: ${esc(f.prefix)}-</span>`);
  if (f.suffix) tags.push(`<span class="fc-tag suffix">suf: -${esc(f.suffix)}</span>`);

  return `
    <div class="feature-card">
      <div class="fc-word">${esc(f.w)}</div>
      <div class="fc-syllables">${syllablesHtml}</div>
      <div class="fc-tags">${tags.join('')}</div>
    </div>
  `;
}

function renderDimension(d) {
  const pct = Math.round(d.score * 100);
  const barClass = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : pct >= 20 ? 'low' : 'none';
  const weightPct = Math.round(d.weight * 100);

  const checksHtml = d.checks.map(c => {
    const cls = c.pass === true ? 'pass' : c.pass === null ? 'partial' : 'fail';
    const icon = c.pass === true ? '+' : c.pass === null ? '~' : '-';
    return `<li class="${cls}"><span class="icon">${icon}</span>${esc(c.text)}</li>`;
  }).join('');

  return `
    <div class="dim-card">
      <div class="dim-header">
        <span class="dim-name">${esc(d.name)}</span>
        <span class="dim-score">${pct}%</span>
      </div>
      <div class="dim-desc">${esc(d.description)}</div>
      <div class="dim-bar"><div class="fill ${barClass}" style="width:${pct}%"></div></div>
      <div class="dim-weight">Peso: ${weightPct}% | Contribuição: ${Math.round(d.weighted * 100)}pts</div>
      <ul class="dim-checks">${checksHtml}</ul>
    </div>
  `;
}

// ===== ANALYZE MODE =====

analyzeBtn.addEventListener('click', doAnalyze);

function doAnalyze() {
  const word = analyzeInput.value.trim().toLowerCase();
  if (!word) return;

  const f = analyze(word);
  analyzeHint.style.display = 'none';
  analyzeResults.innerHTML = renderAnalysis(f);
}

function renderAnalysis(f) {
  const syllablesHtml = f.s.map((syl, i) =>
    `<span class="syl ${i === f.stressIndex ? 'tonic' : ''}">${esc(syl)}</span>`
  ).join('');

  const vowelSeq = f.vowelSequence.map(v => esc(v)).join(' - ');
  const consSeq = f.consonantSequence.map(c => esc(c)).join(' - ');

  return `
    <div class="analyze-card">
      <div class="a-word">${esc(f.w)}</div>
      <div class="a-syllables">${syllablesHtml}</div>
      <div class="analyze-features">
        <div class="af-item">
          <div class="af-label">Tipo Acentual</div>
          <div class="af-value stress">${esc(f.stressType)}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Posição Tônica</div>
          <div class="af-value stress">${f.stressFromEnd}a sílaba do fim</div>
        </div>
        <div class="af-item">
          <div class="af-label">Sílaba Tônica</div>
          <div class="af-value rhyme">${esc(f.tonicSyllable)}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Vogal Tônica</div>
          <div class="af-value vowel">${esc(f.v)}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Consoante Tônica</div>
          <div class="af-value">${f.tonicConsonant ? esc(f.tonicConsonant) : '(nenhuma)'}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Chave de Rima</div>
          <div class="af-value rhyme">-${esc(f.r)}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Sequência Vocálica</div>
          <div class="af-value seq">${vowelSeq || '—'}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Sequência Consonantal</div>
          <div class="af-value seq">${consSeq || '—'}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Prefixo</div>
          <div class="af-value morph">${f.prefix ? esc(f.prefix) + '-' : '(nenhum)'}</div>
        </div>
        <div class="af-item">
          <div class="af-label">Sufixo</div>
          <div class="af-value morph">${f.suffix ? '-' + esc(f.suffix) : '(nenhum)'}</div>
        </div>
      </div>
    </div>
  `;
}

// ===== SIMILAR MODE =====

similarBtn.addEventListener('click', doSimilar);

let expandedSimilarCard = null; // track which card is expanded
let similarCurrentResult = null; // store full result for pagination
let similarDisplayedCount = 0; // how many we're currently showing

function doSimilar() {
  const word = similarInput.value.trim().toLowerCase();
  if (!word || word.length < 2) {
    console.log('[RimaBR] Similar search: input too short or empty');
    return;
  }
  Object.values(acBoxes).forEach(box => box.classList.remove('open'));

  const allWords = getAllWords();
  if (!allWords) {
    console.error('[RimaBR] Similar search: word list not available');
    similarHint.style.display = 'none';
    similarResults.innerHTML = `
      <div class="empty-state">
        <p><strong>Dicionário não carregado</strong></p>
        <p style="margin-top:0.5rem">A busca por palavras similares requer o dicionário completo.</p>
        <p style="margin-top:0.3rem;font-size:0.85rem;color:var(--text-dim)">
          Verifique sua conexão e recarregue a página.
        </p>
      </div>
    `;
    return;
  }

  console.log('[RimaBR] Similar search starting for:', word);
  similarLoading.style.display = 'block';
  similarResults.innerHTML = '';
  similarHint.style.display = 'none';
  expandedSimilarCard = null;
  similarDisplayedCount = 0;

  // Use requestAnimationFrame to not block the spinner
  requestAnimationFrame(() => {
    try {
      // Get many results but only display first batch
      const result = searchSimilar(word, allWords, { maxResults: 300 });
      console.log('[RimaBR] Similar search completed:', result.results.length, 'total results');
      similarCurrentResult = result;
      renderSimilarResults(result, 25); // show first 25
    } catch (err) {
      console.error('[RimaBR] Similar search error:', err);
      similarResults.innerHTML = '<div class="empty-state"><p>Erro na busca. Tente outra palavra.</p></div>';
    } finally {
      similarLoading.style.display = 'none';
    }
  });
}

function loadMoreSimilar() {
  if (!similarCurrentResult) return;
  const newCount = similarDisplayedCount + 25;
  console.log('[RimaBR] Loading more similar results:', newCount);
  renderSimilarResults(similarCurrentResult, newCount);
}

function renderSimilarResults(result, displayCount = 25) {
  const q = result.query;

  // Only clear and rebuild the query card on first load
  if (similarDisplayedCount === 0) {
    similarResults.innerHTML = '';

    // Query word card
    const queryHtml = `
      <div class="analysis-card">
        <div class="word-title">${esc(q.w)}</div>
        <div class="syllables">${q.s.join(' · ')}</div>
        <div class="tags">
          <span class="tag stress">${stressLabel(q.t)}</span>
          <span class="tag vowel">vogal: ${esc(q.v)}</span>
          <span class="tag rhyme-key">rima: -${esc(q.r)}</span>
          <span class="tag">${q.w.length} car. | ${q.n} síl.</span>
        </div>
      </div>
      <div class="similar-stats-row">
        Analisadas <strong>${result.totalScanned.toLocaleString('pt-BR')}</strong> palavras
        &middot; Encontradas <strong>${result.results.length}</strong> similares
      </div>
    `;
    similarResults.insertAdjacentHTML('beforeend', queryHtml);

    if (result.results.length === 0) {
      similarResults.insertAdjacentHTML('beforeend', `
        <div class="empty-state">
          <p>Nenhuma palavra similar encontrada para "${esc(q.w)}".</p>
        </div>
      `);
      similarDisplayedCount = displayCount;
      return;
    }

    // Create the list container
    similarResults.insertAdjacentHTML('beforeend', '<div class="sim-list" id="sim-list-container"></div>');
  }

  // Only render NEW items (from current count to new count) to avoid duplication
  const startIdx = similarDisplayedCount;
  const resultsToShow = result.results.slice(startIdx, displayCount);
  const listContainer = document.getElementById('sim-list-container');

  // Results list
  const listHtml = resultsToShow.map((r, i) => {
    const idx = startIdx + i;
    const pct = Math.round(r.total * 100);
    const levelClass = simLevelClass(r.level);

    // Dimension mini-bars for inline preview
    const dimBars = r.dimensions.map(d => {
      const dp = Math.round(d.score * 100);
      const bc = dp >= 70 ? 'high' : dp >= 40 ? 'mid' : dp >= 20 ? 'low' : 'none';
      return `<span class="sim-dim-mini" title="${esc(d.name)}: ${dp}%">
        <span class="sim-dim-mini-label">${esc(d.name.slice(0, 3))}</span>
        <span class="sim-dim-mini-bar"><span class="fill ${bc}" style="width:${dp}%"></span></span>
      </span>`;
    }).join('');

    return `
      <div class="sim-card" data-idx="${idx}">
        <div class="sim-card-main">
          <span class="sim-rank">${idx + 1}</span>
          <span class="sim-word">${esc(r.word)}</span>
          <span class="sim-pct ${levelClass}">${pct}%</span>
          <span class="sim-level-label ${levelClass}">${esc(r.levelLabel)}</span>
        </div>
        <div class="sim-dims-preview">${dimBars}</div>
        <div class="sim-card-detail" id="sim-detail-${idx}" style="display:none">
          ${renderSimilarDetail(r)}
        </div>
      </div>
    `;
  }).join('');

  // Always append (on first load, container is empty so append = set)
  listContainer.insertAdjacentHTML('beforeend', listHtml);

  // Add "Load More" button if there are more results to show
  const loadMoreBtn = document.getElementById('sim-load-more-btn');
  if (loadMoreBtn) loadMoreBtn.remove();

  if (displayCount < result.results.length) {
    const remaining = result.results.length - displayCount;
    const nextBatch = Math.min(25, remaining);
    const loadMoreHtml = `
      <div style="text-align:center;margin-top:1.5rem;margin-bottom:1rem">
        <button id="sim-load-more-btn" class="action-btn" style="min-width:200px">
          Carregar mais ${nextBatch} de ${remaining}
        </button>
      </div>
    `;
    similarResults.insertAdjacentHTML('beforeend', loadMoreHtml);
    document.getElementById('sim-load-more-btn').addEventListener('click', loadMoreSimilar);
  }

  similarDisplayedCount = displayCount;

  // Use event delegation for dynamic cards
  // Remove old delegated listener if it exists
  const oldHandler = similarResults._simCardClickHandler;
  if (oldHandler) {
    similarResults.removeEventListener('click', oldHandler);
  }

  // Add new delegated click handler
  const cardClickHandler = (e) => {
    const card = e.target.closest('.sim-card');
    if (!card) return;

    const idx = card.dataset.idx;
    const detail = document.getElementById(`sim-detail-${idx}`);
    if (!detail) return;

    if (expandedSimilarCard && expandedSimilarCard !== detail) {
      expandedSimilarCard.style.display = 'none';
      expandedSimilarCard.closest('.sim-card').classList.remove('expanded');
    }

    if (detail.style.display === 'none') {
      detail.style.display = 'block';
      card.classList.add('expanded');
      expandedSimilarCard = detail;
    } else {
      detail.style.display = 'none';
      card.classList.remove('expanded');
      expandedSimilarCard = null;
    }
  };

  similarResults._simCardClickHandler = cardClickHandler;
  similarResults.addEventListener('click', cardClickHandler);
}

function renderSimilarDetail(r) {
  return r.dimensions.map(d => {
    const pct = Math.round(d.score * 100);
    const barClass = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : pct >= 20 ? 'low' : 'none';
    const weightPct = Math.round(d.weight * 100);

    const checksHtml = d.checks.map(c => {
      const cls = c.pass === true ? 'pass' : c.pass === null ? 'partial' : 'fail';
      const icon = c.pass === true ? '+' : c.pass === null ? '~' : '-';
      return `<li class="${cls}"><span class="icon">${icon}</span>${esc(c.text)}</li>`;
    }).join('');

    return `
      <div class="sim-dim-detail">
        <div class="dim-header">
          <span class="dim-name">${esc(d.name)}</span>
          <span class="dim-score">${pct}%</span>
        </div>
        <div class="dim-bar"><div class="fill ${barClass}" style="width:${pct}%"></div></div>
        <div class="dim-weight">Peso: ${weightPct}% | Contribuição: ${Math.round(d.weighted * 100)}pts</div>
        <ul class="dim-checks">${checksHtml}</ul>
      </div>
    `;
  }).join('');
}

function simLevelClass(level) {
  const map = {
    very_high: 'perfect',
    high: 'strong',
    moderate: 'good',
    low: 'weak',
    very_low: 'poor',
    none: 'none',
  };
  return map[level] || 'none';
}

// ===== RIMAS MODE (categorized rhyme search) =====

rimasBtn.addEventListener('click', doRimas);

let rimasCurrentResult = null;
let rimasDisplayCounts = { perfect: 30, toante: 30, consonantal: 30, approximate: 30 };
let rimasActiveFilter = 'all'; // 'all', 'vowels', 'consonants'

// Rimas filter pills handler
rimasFilterPills.forEach(pill => {
  pill.addEventListener('click', () => {
    rimasActiveFilter = pill.dataset.rimasFilter;
    rimasFilterPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    if (rimasCurrentResult) {
      rimasDisplayCounts = { perfect: 30, toante: 30, consonantal: 30, approximate: 30 };
      renderRimasResults(rimasCurrentResult);
    }
  });
});

async function doRimas() {
  const word = rimasInput.value.trim().toLowerCase();
  if (!word || word.length < 2) return;
  Object.values(acBoxes).forEach(box => box.classList.remove('open'));

  rimasLoading.style.display = 'block';
  rimasResults.innerHTML = '';
  rimasHint.style.display = 'none';
  rimasFilter.style.display = 'none';

  try {
    const result = await searchCategorizedRhymes(word, { maxPerCategory: 100 });
    rimasCurrentResult = result;
    rimasDisplayCounts = { perfect: 30, toante: 30, consonantal: 30, approximate: 30 };
    rimasFilter.style.display = 'flex';
    renderRimasResults(result);
  } catch (err) {
    console.error('[RimaBR] Rimas search error:', err);
    rimasResults.innerHTML = '<div class="empty-state"><p>Erro na busca. Tente outra palavra.</p></div>';
  } finally {
    rimasLoading.style.display = 'none';
  }
}

function renderRimasResults(result) {
  rimasResults.innerHTML = '';
  const m = result.motherEntry;

  // Analysis card for the queried word
  const vowelPatternStr = result.vowelPattern.join(' ');
  const consPatternStr = result.consonantPattern.join(' ');

  const analysisHtml = `
    <div class="analysis-card">
      <div class="word-title">${esc(m.w)}</div>
      <div class="syllables">${m.s.join(' · ')}</div>
      <div class="tags">
        <span class="tag stress">${stressLabel(m.t)}</span>
        <span class="tag vowel">vogal: ${esc(m.v)}</span>
        <span class="tag rhyme-key">rima: -${esc(m.r)}</span>
        <span class="tag">${m.n} sil.</span>
      </div>
      <div class="rimas-patterns">
        <span class="rimas-pattern-tag">
          <span class="rimas-pattern-label">Padrao vocalico:</span>
          <span class="rimas-pattern-value vowel">${esc(vowelPatternStr) || '—'}</span>
        </span>
        <span class="rimas-pattern-tag">
          <span class="rimas-pattern-label">Padrao consonantal:</span>
          <span class="rimas-pattern-value">${esc(consPatternStr) || '—'}</span>
        </span>
      </div>
    </div>
  `;
  rimasResults.insertAdjacentHTML('beforeend', analysisHtml);

  // Category definitions
  const allCategoryDefs = [
    {
      key: 'perfect',
      title: 'Rimas Perfeitas (Consoantes)',
      desc: 'Correspondencia total de som a partir da tonica',
      icon: '=',
      color: 'perfect',
    },
    {
      key: 'toante',
      title: 'Rimas Toantes (Assonancia)',
      desc: 'Mesmas vogais, consoantes diferentes',
      icon: '~',
      color: 'strong',
    },
    {
      key: 'consonantal',
      title: 'Rimas Consonantais',
      desc: 'Mesmas consoantes, vogais diferentes',
      icon: '#',
      color: 'good',
    },
    {
      key: 'approximate',
      title: 'Rimas Aproximadas (Slant)',
      desc: 'Sons parcialmente similares',
      icon: '%',
      color: 'weak',
    },
  ];

  // Filter categories based on active filter
  let categoryDefs;
  if (rimasActiveFilter === 'vowels') {
    categoryDefs = allCategoryDefs.filter(d => d.key === 'toante');
  } else if (rimasActiveFilter === 'consonants') {
    categoryDefs = allCategoryDefs.filter(d => d.key === 'consonantal');
  } else {
    categoryDefs = allCategoryDefs;
  }

  let totalFound = 0;

  for (const def of categoryDefs) {
    const cat = result.categories[def.key];
    if (!cat || cat.items.length === 0) continue;

    totalFound += cat.items.length;
    const displayCount = rimasDisplayCounts[def.key];
    const itemsToShow = cat.items.slice(0, displayCount);

    const rhymeKeysPreview = cat.rhymeKeys
      .slice(0, 8)
      .map(rk => `-${rk}`)
      .join(', ');
    const moreKeys = cat.totalKeys > 8 ? ` (+${cat.totalKeys - 8})` : '';

    const sectionHtml = `
      <div class="rimas-category" id="rimas-cat-${def.key}">
        <div class="rimas-cat-header ${def.color}">
          <div class="rimas-cat-title">
            <span class="rimas-cat-icon">${def.icon}</span>
            ${def.title}
            <span class="count">(${cat.items.length})</span>
          </div>
          <div class="rimas-cat-desc">${def.desc}</div>
          <div class="rimas-cat-keys">${esc(rhymeKeysPreview)}${moreKeys}</div>
        </div>
        <div class="word-grid" id="rimas-grid-${def.key}">
          ${itemsToShow.map(r => renderRimasCard(r)).join('')}
        </div>
        ${cat.items.length > displayCount ? renderRimasLoadMore(def.key, cat.items.length, displayCount) : ''}
      </div>
    `;
    rimasResults.insertAdjacentHTML('beforeend', sectionHtml);
  }

  if (totalFound === 0) {
    const filterMsg = rimasActiveFilter === 'vowels' ? ' com as mesmas vogais chave' :
                      rimasActiveFilter === 'consonants' ? ' com as mesmas consoantes chave' : '';
    rimasResults.insertAdjacentHTML('beforeend', `
      <div class="empty-state">
        <div class="icon">~</div>
        <p>Nenhuma rima encontrada para "<strong>${esc(m.w)}</strong>"${filterMsg}.</p>
        ${rimasActiveFilter !== 'all' ? '<p style="margin-top:0.4rem">Tente o filtro "Todas" para ver todos os tipos.</p>' : ''}
      </div>
    `);
  }

  // Wire up load-more buttons and card clicks
  attachRimasHandlers();
}

function renderRimasCard(r) {
  const pct = Math.round(r.total * 100);
  return `
    <div class="word-card rimas-word-card" data-word="${esc(r.word)}">
      <div class="word">${esc(r.word)}</div>
      <div class="meta">
        <div class="score-bar">
          <div class="fill ${r.level}" style="width:${pct}%"></div>
        </div>
        <span class="score-label">${pct}%</span>
      </div>
    </div>
  `;
}

function renderRimasLoadMore(key, total, displayed) {
  const remaining = total - displayed;
  const nextBatch = Math.min(30, remaining);
  return `
    <div style="text-align:center;margin-top:1rem">
      <button id="rimas-load-more-${key}" class="action-btn" style="min-width:180px">
        Carregar mais ${nextBatch} de ${remaining}
      </button>
    </div>
  `;
}

function loadMoreRimas(categoryKey) {
  if (!rimasCurrentResult) return;
  const cat = rimasCurrentResult.categories[categoryKey];
  if (!cat) return;

  const newCount = rimasDisplayCounts[categoryKey] + 30;
  rimasDisplayCounts[categoryKey] = newCount;

  const grid = document.getElementById(`rimas-grid-${categoryKey}`);
  const oldBtn = document.getElementById(`rimas-load-more-${categoryKey}`);
  if (oldBtn) oldBtn.parentElement.remove();

  // Append new cards
  const newItems = cat.items.slice(newCount - 30, newCount);
  grid.insertAdjacentHTML('beforeend', newItems.map(r => renderRimasCard(r)).join(''));

  // Add new load-more button if needed
  if (newCount < cat.items.length) {
    const container = document.getElementById(`rimas-cat-${categoryKey}`);
    container.insertAdjacentHTML('beforeend', renderRimasLoadMore(categoryKey, cat.items.length, newCount));
    attachRimasHandlers();
  }
}

function attachRimasHandlers() {
  // Load-more buttons
  for (const key of ['perfect', 'toante', 'consonantal', 'approximate']) {
    const btn = document.getElementById(`rimas-load-more-${key}`);
    if (btn && !btn._rimasWired) {
      btn._rimasWired = true;
      btn.addEventListener('click', () => loadMoreRimas(key));
    }
  }

  // Card clicks → search for that word
  const oldHandler = rimasResults._rimasCardClickHandler;
  if (oldHandler) {
    rimasResults.removeEventListener('click', oldHandler);
  }

  const cardClickHandler = (e) => {
    const card = e.target.closest('.rimas-word-card');
    if (!card) return;
    const w = card.dataset.word;
    if (w) {
      rimasInput.value = w;
      doRimas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  rimasResults._rimasCardClickHandler = cardClickHandler;
  rimasResults.addEventListener('click', cardClickHandler);
}

// ===== SEARCH MODE (existing, preserved) =====

searchBtn.addEventListener('click', doSearch);

async function doSearch() {
  const word = searchInput.value.trim().toLowerCase();
  if (!word || word.length < 2) return;
  Object.values(acBoxes).forEach(box => box.classList.remove('open'));

  loadingEl.style.display = 'block';
  searchResults.innerHTML = '';
  searchHint.style.display = 'none';

  try {
    const result = await searchRhymes(word, {
      includeNear: nearToggle.checked,
      maxResults: 150, // fetch more, display in batches
    });
    renderSearchResults(result, { displayPerfect: 30, displayNear: 30 });
  } catch (err) {
    console.error('Search error:', err);
    searchResults.innerHTML = '<div class="empty-state"><p>Erro na busca. Tente outra palavra.</p></div>';
  } finally {
    loadingEl.style.display = 'none';
  }
}

let searchCurrentResult = null;
let searchDisplayCounts = { perfect: 30, near: 30 };

function renderSearchResults(result, displayCounts = { displayPerfect: 30, displayNear: 30 }) {
  // Store result for pagination
  searchCurrentResult = result;
  const { displayPerfect, displayNear } = displayCounts;
  searchDisplayCounts = { perfect: displayPerfect, near: displayNear };

  searchResults.innerHTML = '';

  // Analysis card for the queried word
  const m = result.motherEntry;
  const analysisHtml = `
    <div class="analysis-card">
      <div class="word-title">${esc(m.w)}</div>
      <div class="syllables">${m.s.join(' · ')}</div>
      <div class="tags">
        <span class="tag stress">${stressLabel(m.t)}</span>
        <span class="tag vowel">vogal: ${esc(m.v)}</span>
        <span class="tag rhyme-key">rima: -${esc(m.r)}</span>
        <span class="tag">${m.n} sil.</span>
      </div>
    </div>
  `;
  searchResults.insertAdjacentHTML('beforeend', analysisHtml);

  if (result.perfect.length > 0) {
    const perfectToShow = result.perfect.slice(0, displayPerfect);
    searchResults.insertAdjacentHTML('beforeend', renderSection(
      'Rimas perfeitas', perfectToShow, result.totalPerfect, 'perfect', displayPerfect
    ));
  }

  if (result.near.length > 0) {
    const nearToShow = result.near.slice(0, displayNear);
    searchResults.insertAdjacentHTML('beforeend', renderSection(
      'Rimas aproximadas', nearToShow, result.totalNear, 'near', displayNear
    ));
  }

  if (result.perfect.length === 0 && result.near.length === 0) {
    searchResults.insertAdjacentHTML('beforeend', `
      <div class="empty-state">
        <div class="icon">~</div>
        <p>Nenhuma rima encontrada para "<strong>${esc(m.w)}</strong>".</p>
        <p style="margin-top:0.4rem">Tente ativar "rimas aproximadas" ou outra palavra.</p>
      </div>
    `);
  }

  attachSearchCardHandlers();
}

function attachSearchCardHandlers() {
  // Use event delegation
  const oldHandler = searchResults._searchCardClickHandler;
  if (oldHandler) {
    searchResults.removeEventListener('click', oldHandler);
  }

  const cardClickHandler = (e) => {
    const card = e.target.closest('.word-card');
    if (!card) return;
    const w = card.querySelector('.word').textContent;
    searchInput.value = w;
    doSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  searchResults._searchCardClickHandler = cardClickHandler;
  searchResults.addEventListener('click', cardClickHandler);
}

function loadMoreSearchResults(type) {
  if (!searchCurrentResult) return;
  const newCount = searchDisplayCounts[type] + 20;
  searchDisplayCounts[type] = newCount;

  const container = document.getElementById(`search-section-${type}`);
  if (!container) return;

  const results = type === 'perfect' ? searchCurrentResult.perfect : searchCurrentResult.near;
  const nextItems = results.slice(searchDisplayCounts[type] - 20, newCount);

  if (nextItems.length > 0) {
    const cardsHtml = nextItems.map(r => `
      <div class="word-card">
        <div class="word">${esc(r.word)}</div>
        <div class="meta">
          <div class="score-bar">
            <div class="fill ${r.level}" style="width:${Math.round(r.total * 100)}%"></div>
          </div>
          <span class="score-label">${Math.round(r.total * 100)}%</span>
        </div>
      </div>
    `).join('');

    const gridContainer = container.querySelector('.word-grid');
    if (gridContainer) {
      gridContainer.insertAdjacentHTML('beforeend', cardsHtml);
    }
  }

  // Update or remove the load-more button
  const loadMoreBtn = document.getElementById(`search-load-more-${type}`);
  if (loadMoreBtn) loadMoreBtn.remove();

  const total = type === 'perfect' ? searchCurrentResult.totalPerfect : searchCurrentResult.totalNear;
  const currentDisplay = searchDisplayCounts[type];

  if (currentDisplay < total) {
    const remaining = total - currentDisplay;
    const nextBatch = Math.min(20, remaining);
    const btnHtml = `
      <div style="text-align:center;margin-top:1rem">
        <button id="search-load-more-${type}" class="action-btn" style="min-width:180px">
          Carregar mais ${nextBatch} de ${remaining}
        </button>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', btnHtml);
    document.getElementById(`search-load-more-${type}`).addEventListener('click', () => loadMoreSearchResults(type));
  }

  attachSearchCardHandlers();
}

function renderSection(title, items, total, type, displayed) {
  const cards = items.map(r => `
    <div class="word-card">
      <div class="word">${esc(r.word)}</div>
      <div class="meta">
        <div class="score-bar">
          <div class="fill ${r.level}" style="width:${Math.round(r.total * 100)}%"></div>
        </div>
        <span class="score-label">${Math.round(r.total * 100)}%</span>
      </div>
    </div>
  `).join('');

  const remaining = total - displayed;
  const loadMoreBtn = remaining > 0 ? `
    <div style="text-align:center;margin-top:1rem">
      <button id="search-load-more-${type}" class="action-btn" style="min-width:180px">
        Carregar mais ${Math.min(20, remaining)} de ${remaining}
      </button>
    </div>
  ` : '';

  const html = `
    <div class="results-section" id="search-section-${type}">
      <h2>${title} <span class="count">(${displayed}${total > displayed ? ' de ' + total : ''})</span></h2>
      <div class="word-grid">${cards}</div>
      ${loadMoreBtn}
    </div>
  `;

  // Schedule handler attachment after render
  if (loadMoreBtn) {
    setTimeout(() => {
      const btn = document.getElementById(`search-load-more-${type}`);
      if (btn) btn.addEventListener('click', () => loadMoreSearchResults(type));
    }, 0);
  }

  return html;
}

function stressLabel(t) {
  if (t === 'ox') return 'oxitona';
  if (t === 'pa') return 'paroxitona';
  if (t === 'pr') return 'proparoxitona';
  return t;
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
