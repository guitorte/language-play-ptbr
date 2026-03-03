#!/usr/bin/env node
/**
 * verificar-rimas.mjs — Verifica a qualidade das rimas nas letras originais
 *
 * Usa fonetica.js e padrao.js para pontuar cada par de rima usado nas letras.
 */

import { perfilFonetico } from './fonetica.js';
import { calcScore, classificar } from './padrao.js';
import { readFileSync } from 'fs';

const letras = JSON.parse(readFileSync(new URL('./letras-originais.json', import.meta.url), 'utf-8'));

// Extrair pares de rima por proximidade (linhas consecutivas ou alternadas)
function extrairPalavraFinal(linha) {
    let clean = linha.replace(/[.,;:!?—–\-"""''…]/g, '').trim();
    let words = clean.split(/\s+/).filter(w => w.length > 0);
    return words.length ? words[words.length - 1].toLowerCase() : null;
}

for (const musica of letras) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${musica.titulo} (${musica.genero}) — esquema: ${musica.esquema_rima}`);
    console.log(`${'═'.repeat(60)}`);

    // Collect non-empty, non-header lines
    const linhas = musica.letra.filter(l => l.trim() && !l.startsWith('['));
    const finais = linhas.map(extrairPalavraFinal).filter(Boolean);

    // Check consecutive pairs (AABB) and alternating pairs (ABAB)
    let pares = new Set();

    // AABB pairs
    for (let i = 0; i < finais.length - 1; i += 2) {
        pares.add(`${finais[i]}|${finais[i+1]}`);
    }
    // ABAB pairs
    for (let i = 0; i < finais.length - 3; i += 4) {
        pares.add(`${finais[i]}|${finais[i+2]}`);
        pares.add(`${finais[i+1]}|${finais[i+3]}`);
    }

    let total = 0, somaScore = 0;
    for (const par of pares) {
        const [a, b] = par.split('|');
        if (a === b) continue;
        const pa = perfilFonetico(a);
        const pb = perfilFonetico(b);
        if (!pa || !pb) continue;

        const score = calcScore(pb, pa);
        const banda = classificar(score);
        total++;
        somaScore += score;

        const rimaA = pa.rimaPerfeita.padEnd(8);
        const rimaB = pb.rimaPerfeita.padEnd(8);
        console.log(`  ${a.padEnd(16)} ↔ ${b.padEnd(16)}  score: ${String(score).padStart(3)}  [${banda.label}]  rima: -${rimaA} / -${rimaB}`);
    }

    if (total > 0) {
        console.log(`  ${'─'.repeat(56)}`);
        console.log(`  Média: ${(somaScore / total).toFixed(0)} pontos  |  ${total} pares analisados`);
    }
}
