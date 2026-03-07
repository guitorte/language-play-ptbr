#!/usr/bin/env node
/**
 * extract-rhyme-data.js
 *
 * Processes lyrics corpora and produces:
 *   1. rhyme_pairs.json   — empirical rhyme pairs extracted from stanza structure
 *   2. phrase_rhymes.json — multi-word phrase endings indexed by rimaPerfeita
 *
 * Usage:
 *   node extract-rhyme-data.js [--out-dir ./output]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
    silabificar, identificarTonica, perfilFonetico, calcScore,
    normV, extrairRima, calcAcent,
} from './motor-fonetico.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD = join(__dirname, '..', 'upload');

const outDir = process.argv.includes('--out-dir')
    ? process.argv[process.argv.indexOf('--out-dir') + 1]
    : join(__dirname, '..', 'data');

// ── Parse corpora ──────────────────────────────────────────────

function parseLetrasJson(path) {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return raw.map(s => ({
        artist: s.artista,
        title:  s.titulo,
        genre:  s.genero || 'Indefinido',
        lines:  s.letra.split('\n'),
    }));
}

function parseTrainingCorpus(path) {
    const text = readFileSync(path, 'utf-8');
    const songs = [];
    let current = null;

    for (const line of text.split('\n')) {
        const headerMatch = line.match(/^### (.+?) - (.+?) \[(.+?)\]$/);
        if (headerMatch) {
            if (current) songs.push(current);
            current = {
                artist: headerMatch[2],
                title:  headerMatch[1],
                genre:  headerMatch[3],
                lines:  [],
            };
            continue;
        }
        if (/^={5,}/.test(line)) continue;
        if (current) current.lines.push(line);
    }
    if (current) songs.push(current);
    return songs;
}

// ── Helpers ────────────────────────────────────────────────────

/** Clean a lyric line: remove parenthetical ad-libs, trailing punctuation */
function cleanLine(line) {
    let s = line.trim();
    // Remove parenthetical ad-libs like (Saudade!) or (É teu nome que eu chamo!)
    s = s.replace(/\([^)]*\)/g, '').trim();
    // Remove leading/trailing punctuation but keep accented chars
    s = s.replace(/[!?.,;:…"'"']+$/g, '').trim();
    return s;
}

/** Extract the last word of a line (lowercased, cleaned) */
function lastWord(line) {
    const clean = cleanLine(line);
    if (!clean) return null;
    const words = clean.split(/\s+/);
    const w = words[words.length - 1].toLowerCase().replace(/[^a-záàâãéêíóôõúü]/g, '');
    return w || null;
}

/** Extract the last N words as a phrase ending */
function phraseEnding(line, maxWords = 3) {
    const clean = cleanLine(line);
    if (!clean) return null;
    const words = clean.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return null;
    const n = Math.min(maxWords, words.length);
    return words.slice(-n).join(' ').toLowerCase();
}

/** Split a song's lines into stanzas (separated by blank lines) */
function splitStanzas(lines) {
    const stanzas = [];
    let current = [];
    for (const line of lines) {
        if (!line.trim()) {
            if (current.length > 0) stanzas.push(current);
            current = [];
        } else {
            current.push(line);
        }
    }
    if (current.length > 0) stanzas.push(current);
    return stanzas;
}

// ── 1. Rhyme pair extraction ───────────────────────────────────

/**
 * From a stanza, extract candidate rhyme pairs by testing
 * adjacent (AABB), alternating (ABAB), and triplet (AABCCB) positions.
 * Only keep pairs where calcScore > threshold.
 */
function extractPairsFromStanza(stanza, genre, scoreThreshold = 25) {
    const endings = stanza.map(line => {
        const w = lastWord(line);
        if (!w) return null;
        const p = perfilFonetico(w);
        return p;
    });

    const pairs = [];

    // Test all pairings within the stanza, weighted by distance
    const offsets = [
        { d: 1, label: 'adjacent' },   // AABB: lines 0-1, 1-2, ...
        { d: 2, label: 'alternate' },   // ABAB: lines 0-2, 1-3, ...
        { d: 3, label: 'triplet' },     // AABCCB-like: lines 0-3, ...
        { d: 5, label: 'distant' },     // ABABCDCD: 0-5 patterns
    ];

    for (const { d, label } of offsets) {
        for (let i = 0; i + d < endings.length; i++) {
            const a = endings[i], b = endings[i + d];
            if (!a || !b) continue;
            if (a.palavra === b.palavra) continue; // skip identical words

            const setOnset = new Set(a.onsetTonico);
            const setAssC  = new Set(a.assConsonantal);
            const lenAssC  = a.assConsonantal.length;
            const score    = calcScore(b, a, setOnset, setAssC, lenAssC);

            if (score >= scoreThreshold) {
                pairs.push({
                    wordA: a.palavra,
                    wordB: b.palavra,
                    score,
                    rimaA: a.rimaPerfeita,
                    rimaB: b.rimaPerfeita,
                    acentA: a.acentuacao,
                    acentB: b.acentuacao,
                    distance: d,
                    pattern: label,
                    genre,
                });
            }
        }
    }

    return pairs;
}

// ── 2. Phrase rhyme extraction ─────────────────────────────────

function extractPhraseEndings(lines, genre, artist, title) {
    const results = [];
    for (const line of lines) {
        const clean = cleanLine(line);
        if (!clean || clean.length < 5) continue;

        // Get last word profile
        const lw = lastWord(line);
        if (!lw) continue;
        const perfil = perfilFonetico(lw);
        if (!perfil) continue;

        // Get phrase (last 2-4 words)
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        if (words.length < 2) continue;

        // Compute total syllable count of the full line
        let totalSyl = 0;
        for (const w of words) {
            const wClean = w.toLowerCase().replace(/[^a-záàâãéêíóôõúü]/g, '');
            if (wClean) totalSyl += silabificar(wClean).length;
        }

        // Phrase endings of different lengths
        for (const n of [2, 3]) {
            if (words.length < n) continue;
            const phrase = words.slice(-n).join(' ').toLowerCase();

            // Compute syllable count of the phrase
            let phraseSyl = 0;
            for (const w of words.slice(-n)) {
                const wClean = w.toLowerCase().replace(/[^a-záàâãéêíóôõúü]/g, '');
                if (wClean) phraseSyl += silabificar(wClean).length;
            }

            results.push({
                phrase,
                lastWord: perfil.palavra,
                rima: perfil.rimaPerfeita,
                vogaisRima: perfil.vogaisRima,
                acentuacao: perfil.acentuacao,
                phraseSyl,
                lineSyl: totalSyl,
                genre,
            });
        }
    }
    return results;
}

// ── Main ───────────────────────────────────────────────────────

function main() {
    console.log('Loading corpora...');

    const letrasPath  = join(UPLOAD, 'letras_final.json');
    const corpusPath  = join(UPLOAD, 'training_corpus.txt');

    const songs = [
        ...parseLetrasJson(letrasPath),
        ...parseTrainingCorpus(corpusPath),
    ];

    console.log(`Loaded ${songs.length} songs total.`);

    // ── Extract rhyme pairs ────────────────────────────────────
    console.log('\nExtracting rhyme pairs...');
    const allPairs = [];
    for (const song of songs) {
        const stanzas = splitStanzas(song.lines);
        for (const stanza of stanzas) {
            const pairs = extractPairsFromStanza(stanza, song.genre);
            allPairs.push(...pairs);
        }
    }

    // Deduplicate: normalize pair order and keep highest score
    const pairMap = new Map();
    for (const p of allPairs) {
        const [a, b] = [p.wordA, p.wordB].sort();
        const key = `${a}|${b}`;
        const existing = pairMap.get(key);
        if (!existing || p.score > existing.score) {
            pairMap.set(key, {
                wordA: a,
                wordB: b,
                score: p.score,
                rimaA: a === p.wordA ? p.rimaA : p.rimaB,
                rimaB: a === p.wordA ? p.rimaB : p.rimaA,
                acentA: a === p.wordA ? p.acentA : p.acentB,
                acentB: a === p.wordA ? p.acentB : p.acentA,
                genres: new Set(),
                patterns: new Set(),
                count: 0,
            });
        }
        const entry = pairMap.get(key);
        entry.genres.add(p.genre);
        entry.patterns.add(p.pattern);
        entry.count++;
    }

    // Convert to array, serialize sets
    const rhymePairs = [...pairMap.values()]
        .map(p => ({
            ...p,
            genres:   [...p.genres],
            patterns: [...p.patterns],
        }))
        .sort((a, b) => b.score - a.score || b.count - a.count);

    console.log(`  Found ${allPairs.length} raw pairs -> ${rhymePairs.length} unique pairs`);

    // Score distribution
    const bands = { 160: 0, 130: 0, 100: 0, 60: 0, 25: 0 };
    for (const p of rhymePairs) {
        if (p.score >= 160) bands[160]++;
        else if (p.score >= 130) bands[130]++;
        else if (p.score >= 100) bands[100]++;
        else if (p.score >= 60) bands[60]++;
        else bands[25]++;
    }
    console.log('  Score distribution:');
    console.log(`    Rima (>=160):       ${bands[160]}`);
    console.log(`    Quase-rima (>=130): ${bands[130]}`);
    console.log(`    Eco forte (>=100):  ${bands[100]}`);
    console.log(`    Assonância (>=60):  ${bands[60]}`);
    console.log(`    Proximidade (>=25): ${bands[25]}`);

    // Genre breakdown
    const genreCounts = {};
    for (const p of rhymePairs) {
        for (const g of p.genres) {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        }
    }
    console.log('  By genre:');
    for (const [g, c] of Object.entries(genreCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${g}: ${c}`);
    }

    // ── Extract phrase rhymes ──────────────────────────────────
    console.log('\nExtracting phrase endings...');
    const allPhrases = [];
    for (const song of songs) {
        const phrases = extractPhraseEndings(song.lines, song.genre, song.artist, song.title);
        allPhrases.push(...phrases);
    }

    // Deduplicate phrases, count occurrences, track genres
    const phraseMap = new Map();
    for (const p of allPhrases) {
        const key = p.phrase;
        if (!phraseMap.has(key)) {
            phraseMap.set(key, {
                phrase: p.phrase,
                lastWord: p.lastWord,
                rima: p.rima,
                vogaisRima: p.vogaisRima,
                acentuacao: p.acentuacao,
                phraseSyl: p.phraseSyl,
                lineSyl: p.lineSyl,
                genres: new Set(),
                count: 0,
            });
        }
        const entry = phraseMap.get(key);
        entry.genres.add(p.genre);
        entry.count++;
    }

    const phraseRhymes = [...phraseMap.values()]
        .map(p => ({ ...p, genres: [...p.genres] }))
        .sort((a, b) => b.count - a.count);

    console.log(`  Found ${allPhrases.length} raw phrase endings -> ${phraseRhymes.length} unique phrases`);

    // Build rima index for fast lookup
    const rimaIndex = {};
    for (const p of phraseRhymes) {
        if (!rimaIndex[p.rima]) rimaIndex[p.rima] = [];
        rimaIndex[p.rima].push(p.phrase);
    }
    const topRimas = Object.entries(rimaIndex)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 15);
    console.log('  Top rhyme endings:');
    for (const [rima, phrases] of topRimas) {
        console.log(`    -${rima}: ${phrases.length} phrases`);
    }

    // ── Write output ───────────────────────────────────────────
    mkdirSync(outDir, { recursive: true });

    const pairsPath   = join(outDir, 'rhyme_pairs.json');
    const phrasesPath = join(outDir, 'phrase_rhymes.json');

    writeFileSync(pairsPath, JSON.stringify({
        meta: {
            generated: new Date().toISOString(),
            totalSongs: songs.length,
            totalRawPairs: allPairs.length,
            uniquePairs: rhymePairs.length,
            scoreBands: bands,
            genreCounts,
        },
        pairs: rhymePairs,
    }, null, 2));

    writeFileSync(phrasesPath, JSON.stringify({
        meta: {
            generated: new Date().toISOString(),
            totalSongs: songs.length,
            totalRawPhrases: allPhrases.length,
            uniquePhrases: phraseRhymes.length,
            topRimas: Object.fromEntries(topRimas.map(([r, p]) => [r, p.length])),
        },
        phrases: phraseRhymes,
        rimaIndex,
    }, null, 2));

    console.log(`\nOutput written to:`);
    console.log(`  ${pairsPath}`);
    console.log(`  ${phrasesPath}`);

    // Show some example pairs
    console.log('\n── Sample rhyme pairs (top 20) ──');
    for (const p of rhymePairs.slice(0, 20)) {
        console.log(`  ${p.wordA} / ${p.wordB}  score=${p.score}  count=${p.count}  [${p.genres.join(', ')}]`);
    }

    console.log('\n── Sample phrase rhymes for "-ão" ──');
    const aoEntries = phraseRhymes.filter(p => p.rima === 'ão').slice(0, 15);
    for (const p of aoEntries) {
        console.log(`  "${p.phrase}" (${p.phraseSyl} syl, ${p.count}x) [${p.genres.join(', ')}]`);
    }

    console.log('\n── Sample phrase rhymes for "-ade" ──');
    const adeEntries = phraseRhymes.filter(p => p.rima === 'ade').slice(0, 15);
    for (const p of adeEntries) {
        console.log(`  "${p.phrase}" (${p.phraseSyl} syl, ${p.count}x) [${p.genres.join(', ')}]`);
    }

    console.log('\n── Sample phrase rhymes for "-or" ──');
    const orEntries = phraseRhymes.filter(p => p.rima === 'or').slice(0, 15);
    for (const p of orEntries) {
        console.log(`  "${p.phrase}" (${p.phraseSyl} syl, ${p.count}x) [${p.genres.join(', ')}]`);
    }
}

main();
