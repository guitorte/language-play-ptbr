/**
 * Comparison orchestration layer.
 * Takes two words, analyzes both, scores across all contexts,
 * and returns a structured result for the Compare view.
 */

import { analyze } from './analyzer.js';
import { scorePair, WEIGHT_PRESETS } from './matcher.js';

/**
 * Compare two words with full phonetic analysis and multi-context scoring.
 *
 * @param {string} wordA - first word
 * @param {string} wordB - second word
 * @param {string} context - active context preset key (default: 'general')
 * @returns {object} comparison result
 */
function compareWords(wordA, wordB, context = 'general') {
  const a = analyze(wordA);
  const b = analyze(wordB);
  const result = scorePair(a, b, context);

  // Also compute scores for all other contexts (for the context switcher)
  const allContexts = {};
  for (const key of Object.keys(WEIGHT_PRESETS)) {
    const r = scorePair(a, b, key);
    allContexts[key] = {
      total: r.total,
      level: r.level,
      levelLabel: r.levelLabel,
      label: WEIGHT_PRESETS[key].label,
    };
  }

  return {
    wordA: a,
    wordB: b,
    activeContext: context,
    match: result,
    allContexts,
  };
}

export { compareWords };
