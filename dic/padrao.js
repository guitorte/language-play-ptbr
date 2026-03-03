/**
 * padrao.js — Pattern builder & scoring PT-BR (standalone)
 *
 * Extraído de dic/index.html (seções 3 "SCORE + FAIXAS" e lógica de
 * filtragem/construtor) sem alterar o arquivo original.
 *
 * Depende de fonetica.js para análise das palavras.
 *
 * Uso (browser):
 *   <script type="module">
 *     import { perfilFonetico } from './fonetica.js';
 *     import { calcScore, classificar, filtrar, buscar } from './padrao.js';
 *
 *     // Score entre dois perfis
 *     const alvo = perfilFonetico('recato');
 *     const cand = perfilFonetico('relato');
 *     console.log(calcScore(cand, alvo));          // número
 *     console.log(classificar(calcScore(cand, alvo))); // { key, label, cls, ... }
 *
 *     // Buscar em lote
 *     const banco = ['gato','pato','fato','mesa'].map(perfilFonetico);
 *     const resultados = buscar(alvo, banco);       // ordenado por score
 *   </script>
 *
 * Uso (Node ≥ 14):
 *   import { perfilFonetico } from './fonetica.js';
 *   import { buscar } from './padrao.js';
 */

import { perfilFonetico } from './fonetica.js';

// ═════════════════════════════════════════════════════════════════
//  Levenshtein — distância de edição (para rima imperfeita)
// ═════════════════════════════════════════════════════════════════

export function levenshtein(a, b) {
    let la = a.length, lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;
    let prev = Array.from({length: lb + 1}, (_, i) => i);
    for (let i = 1; i <= la; i++) {
        let curr = [i];
        for (let j = 1; j <= lb; j++) {
            curr[j] = a[i-1] === b[j-1]
                ? prev[j-1]
                : 1 + Math.min(prev[j-1], prev[j], curr[j-1]);
        }
        prev = curr;
    }
    return prev[lb];
}

// ═════════════════════════════════════════════════════════════════
//  Score — pontuação multi-dimensional
// ═════════════════════════════════════════════════════════════════

/**
 * Calcula o score de similaridade fonética entre um candidato e um alvo.
 *
 * Usa os mesmos pesos e regras que dic/index.html seção 3.
 * O score é um número inteiro (sem máximo teórico, mas tipicamente 0–325).
 *
 * @param {object} item  — perfil fonético do candidato (via perfilFonetico)
 * @param {object} alvo  — perfil fonético da palavra-alvo
 * @param {Set}    [setOnset]  — Set de chars do onset do alvo (cache opcional)
 * @param {Set}    [setAssC]   — Set de chars da assonância consonantal do alvo
 * @param {number} [lenAssC]   — comprimento da assConsonantal do alvo
 * @returns {number}
 */
export function calcScore(item, alvo, setOnset, setAssC, lenAssC) {
    // Lazy-build cache sets when not provided
    if (!setOnset) setOnset = new Set(alvo.onsetTonico);
    if (!setAssC)  setAssC  = new Set(alvo.assConsonantal);
    if (lenAssC === undefined) lenAssC = alvo.assConsonantal.length;

    let s = 0;
    if (item.rimaPerfeita === alvo.rimaPerfeita) {
        s += 100;
    } else if (alvo.rimaPerfeita.length >= 2) {
        let d = levenshtein(item.rimaPerfeita, alvo.rimaPerfeita);
        if (d === 1) s += 70;
        else if (d === 2 && alvo.rimaPerfeita.length >= 3) s += 40;
    }
    if (alvo.vogaisRima && item.vogaisRima === alvo.vogaisRima)      s +=  60;
    if (alvo.onsetTonico) {
        if (item.onsetTonico === alvo.onsetTonico) {
            s += 50;
        } else if (item.onsetTonico) {
            for (let c of item.onsetTonico) if (setOnset.has(c)) { s += 25; break; }
        }
    }
    if (alvo.familiaCluster !== 'vz' && alvo.familiaCluster !== 'si'
        && item.familiaCluster === alvo.familiaCluster)              s += 20;
    if (lenAssC > 0 && item.assConsonantal) {
        let inter = 0;
        for (let c of item.assConsonantal) if (setAssC.has(c)) inter++;
        let union = lenAssC + item.assConsonantal.length - inter;
        if (union > 0 && inter / union >= 0.5)                      s += 30;
    }
    if (alvo.espinhaVocal.length > 1 && item.espinhaVocal === alvo.espinhaVocal) s += 40;
    if (alvo.vogalTonica && item.vogalTonica === alvo.vogalTonica)   s +=  15;
    if (item.numSilabas === alvo.numSilabas && item.acentuacao === alvo.acentuacao) s += 10;
    return s;
}

// ═════════════════════════════════════════════════════════════════
//  Bandas — faixas de classificação
// ═════════════════════════════════════════════════════════════════

export const BANDAS = [
    { key:160, label:'Rima',        cls:'b-rima',  color:'var(--c-rima)' },
    { key:130, label:'Quase-rima',  cls:'b-qrima', color:'var(--c-qrima)' },
    { key:100, label:'Eco forte',   cls:'b-eco',   color:'var(--c-eco)' },
    { key:60,  label:'Assonância',  cls:'b-ass',   color:'var(--c-ass)' },
    { key:25,  label:'Proximidade', cls:'b-prox',  color:'var(--c-prox)' },
    { key:10,  label:'Ritmo',       cls:'b-ritmo', color:'var(--c-ritmo)' },
];

/**
 * Retorna a chave da banda (faixa) para um dado score.
 * @param {number} score
 * @returns {number}  Uma das chaves: 160, 130, 100, 60, 25, 10
 */
export function getBandaKey(score) {
    if (score >= 160) return 160;
    if (score >= 130) return 130;
    if (score >= 100) return 100;
    if (score >= 60)  return 60;
    if (score >= 25)  return 25;
    return 10;
}

/**
 * Retorna o objeto de banda completo para um score.
 * @param {number} score
 * @returns {{ key:number, label:string, cls:string, color:string }}
 */
export function classificar(score) {
    let k = getBandaKey(score);
    return BANDAS.find(b => b.key === k);
}

// ═════════════════════════════════════════════════════════════════
//  Filtrar — filtragem por critérios fonéticos
// ═════════════════════════════════════════════════════════════════

/**
 * Filtra um banco de perfis fonéticos por critérios exatos.
 *
 * @param {object[]} banco   — array de objetos retornados por perfilFonetico()
 * @param {object}   filtros — mapa campo→valor (campos ausentes ou null são ignorados)
 *   Campos válidos: numSilabas, acentuacao, vogalTonica, onsetTonico,
 *                   familiaCluster, rimaPerfeita, vogaisRima, espinhaVocal,
 *                   coda, classe, freq
 * @param {object}   [neg]   — mapa campo→boolean; se true, inverte o critério (≠ valor)
 * @returns {object[]}
 *
 * @example
 *   filtrar(banco, { acentuacao: 'px', vogalTonica: 'a' });
 *   filtrar(banco, { classe: 'vrb' }, { classe: true }); // tudo que NÃO é verbo
 */
export function filtrar(banco, filtros, neg) {
    if (!filtros) return banco;
    neg = neg || {};
    return banco.filter(item => {
        for (let [k, v] of Object.entries(filtros)) {
            if (v === null || v === undefined) continue;
            let match = item[k] === v;
            if (neg[k]) { if (match)  return false; }
            else        { if (!match) return false; }
        }
        return true;
    });
}

// ═════════════════════════════════════════════════════════════════
//  Buscar — busca completa (filtrar + pontuar + classificar)
// ═════════════════════════════════════════════════════════════════

/**
 * Busca palavras similares a um alvo num banco de perfis fonéticos.
 *
 * Retorna resultados ordenados por score decrescente, cada um enriquecido com
 * `score` (número) e `banda` (objeto com key/label/cls/color).
 *
 * @param {object}   alvo     — perfil fonético da palavra-alvo
 * @param {object[]} banco    — array de perfis fonéticos
 * @param {object}   [opts]
 * @param {object}   [opts.filtros]   — filtros de campo (ver `filtrar`)
 * @param {object}   [opts.neg]       — negações de filtro
 * @param {number}   [opts.minScore=1]— score mínimo para incluir
 * @param {number}   [opts.limite]    — máximo de resultados (default: sem limite)
 * @param {Set}      [opts.bandas]    — se definido, filtra só estas bandas (Set de keys)
 * @returns {Array<object & {score:number, banda:object}>}
 *
 * @example
 *   import { perfilFonetico } from './fonetica.js';
 *   import { buscar } from './padrao.js';
 *
 *   const alvo  = perfilFonetico('fogo');
 *   const banco = palavras.map(perfilFonetico).filter(Boolean);
 *   const top20 = buscar(alvo, banco, { limite: 20 });
 *   top20.forEach(r => console.log(r.palavra, r.score, r.banda.label));
 */
export function buscar(alvo, banco, opts) {
    opts = opts || {};
    let minScore = opts.minScore !== undefined ? opts.minScore : 1;
    let base = banco.filter(i => i.palavra !== alvo.palavra);

    // Apply filters
    if (opts.filtros) base = filtrar(base, opts.filtros, opts.neg);

    // Pre-compute cache sets for scoring
    let setOnset = new Set(alvo.onsetTonico);
    let setAssC  = new Set(alvo.assConsonantal);
    let lenAssC  = alvo.assConsonantal.length;

    // Score & classify
    let resultados = base
        .map(i => {
            let score = calcScore(i, alvo, setOnset, setAssC, lenAssC);
            return { ...i, score, banda: classificar(score) };
        })
        .filter(i => i.score >= minScore)
        .sort((a, b) => b.score - a.score);

    // Filter by band keys
    if (opts.bandas && opts.bandas.size > 0) {
        resultados = resultados.filter(i => opts.bandas.has(i.banda.key));
    }

    // Limit
    if (opts.limite) resultados = resultados.slice(0, opts.limite);

    return resultados;
}

/**
 * Interseção A∩B: pontua candidatos contra dois alvos e mantém o menor score.
 *
 * @param {object}   alvoA   — perfil fonético da palavra A
 * @param {object}   alvoB   — perfil fonético da palavra B
 * @param {object[]} banco   — array de perfis fonéticos
 * @param {object}   [opts]  — mesmas opções de `buscar`
 * @returns {Array<object & {score:number, banda:object}>}
 */
export function buscarIntersecao(alvoA, alvoB, banco, opts) {
    opts = opts || {};
    let minScore = opts.minScore !== undefined ? opts.minScore : 1;
    let base = banco.filter(i => i.palavra !== alvoA.palavra && i.palavra !== alvoB.palavra);

    if (opts.filtros) base = filtrar(base, opts.filtros, opts.neg);

    let setOnsetA = new Set(alvoA.onsetTonico);
    let setAsscA  = new Set(alvoA.assConsonantal);
    let lenAsscA  = alvoA.assConsonantal.length;

    let setOnsetB = new Set(alvoB.onsetTonico);
    let setAsscB  = new Set(alvoB.assConsonantal);
    let lenAsscB  = alvoB.assConsonantal.length;

    let resultados = base
        .map(i => {
            let sA = calcScore(i, alvoA, setOnsetA, setAsscA, lenAsscA);
            let sB = calcScore(i, alvoB, setOnsetB, setAsscB, lenAsscB);
            let score = Math.min(sA, sB);
            return { ...i, score, banda: classificar(score) };
        })
        .filter(i => i.score >= minScore)
        .sort((a, b) => b.score - a.score);

    if (opts.bandas && opts.bandas.size > 0) {
        resultados = resultados.filter(i => opts.bandas.has(i.banda.key));
    }

    if (opts.limite) resultados = resultados.slice(0, opts.limite);

    return resultados;
}

// Re-export perfilFonetico for convenience (single import)
export { perfilFonetico };
