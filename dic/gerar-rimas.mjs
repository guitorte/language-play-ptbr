#!/usr/bin/env node
/**
 * gerar-rimas.mjs — Gerador de paletas de rima para composição
 *
 * Usa fonetica.js e padrao.js para montar paletas de rima a partir de
 * palavras-semente. Ferramenta de apoio à composição de letras.
 *
 * Uso:
 *   node dic/gerar-rimas.mjs coração saudade noite
 */

import { readFileSync } from 'fs';
import { perfilFonetico } from './fonetica.js';
import { buscar, BANDAS } from './padrao.js';

// ── carregar dicionário ──────────────────────────────────────────
const raw = readFileSync(new URL('./palavras.txt', import.meta.url), 'utf-8');
const palavras = raw.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 1);
const banco = palavras.map(perfilFonetico).filter(Boolean);
console.log(`Dicionário: ${banco.length} palavras indexadas.\n`);

// ── palavras-semente ─────────────────────────────────────────────
const sementes = process.argv.slice(2);
if (!sementes.length) {
    console.log('Uso: node gerar-rimas.mjs <palavra1> [palavra2] ...');
    console.log('Exemplo: node gerar-rimas.mjs coração saudade noite');
    process.exit(0);
}

// ── gerar paleta por semente ─────────────────────────────────────
for (const semente of sementes) {
    const alvo = perfilFonetico(semente);
    if (!alvo) { console.log(`⚠ "${semente}" não reconhecida.\n`); continue; }

    console.log(`═══ ${semente.toUpperCase()} ═══`);
    console.log(`  sílabas: ${alvo.silabas.join('·')}  |  rima: -${alvo.rimaPerfeita}  |  ${alvo.acentuacao}  |  vogal: /${alvo.vogalTonica}/\n`);

    const resultados = buscar(alvo, banco, { limite: 60 });

    // Agrupar por banda
    const grupos = {};
    for (const b of BANDAS) grupos[b.key] = [];
    for (const r of resultados) grupos[r.banda.key].push(r);

    for (const b of BANDAS) {
        const lista = grupos[b.key];
        if (!lista.length) continue;
        const tag = `  [${b.label}]`;
        const words = lista.map(r => r.palavra).join(', ');
        console.log(`${tag} ${words}`);
    }
    console.log('');
}
