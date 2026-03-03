/**
 * fonetica.js — Motor fonético PT-BR (standalone)
 *
 * Extraído de dic/index.html (seções 1 "MOTOR FONÉTICO" e 2 "CAMPOS FONÉTICOS")
 * sem alterar o arquivo original.
 *
 * Uso (browser):
 *   <script type="module">
 *     import { silabificar, perfilFonetico } from './fonetica.js';
 *     console.log(perfilFonetico('recato'));
 *   </script>
 *
 * Uso (Node ≥ 14, com extensão .mjs ou "type":"module" no package.json):
 *   import { silabificar, perfilFonetico } from './fonetica.js';
 */

// ── helpers ──────────────────────────────────────────────────────
const vRegex = /[aeiouáàâãéêíóôõúü]/i;

function normV(s) {
    return s.toLowerCase()
        .replace(/[áàâ]/g, 'a').replace(/[éê]/g, 'e').replace(/í/g, 'i')
        .replace(/[óô]/g, 'o').replace(/[úü]/g, 'u');
}

// ═════════════════════════════════════════════════════════════════
//  1. MOTOR FONÉTICO — syllabification & stress
// ═════════════════════════════════════════════════════════════════

function tratarHiatosVogais(blocoVoc, pLower) {
    if (blocoVoc.length <= 1) return [blocoVoc];
    let resultado = [], atual = blocoVoc[0];
    for (let i = 1; i < blocoVoc.length; i++) {
        let char = blocoVoc[i], par = (atual.slice(-1) + char).toLowerCase();
        let formamDitongo   = /^(ai|au|ei|eu|iu|oi|ou|ui|ão|õe|ãe|ia|ie|io|ua|ue|uo)$/.test(par);
        let vogaisIdenticas = par[0] === par[1];
        let temHiatoAcent   = /[aeiouáéíóúâêôãõü][íú]/.test(par);
        let ehHiatoFinal    = /^(ai|ui|au|oe)$/.test(par) &&
                              (pLower.endsWith(par+"r")||pLower.endsWith(par+"z")||pLower.endsWith(par+"l"));
        let seguidoDeNh     = pLower.includes(par+"nh");
        let formaHiatoDit   = false;
        if (blocoVoc.length >= 3 && /^[aeo]$/.test(atual.slice(-1))) {
            let prox = blocoVoc[i+1] ? blocoVoc[i+1].toLowerCase() : "";
            if (/^(iu|ia|io|ie|ui)$/.test(char+prox)) formaHiatoDit = true;
        }
        if (formamDitongo && !temHiatoAcent && !vogaisIdenticas && !ehHiatoFinal && !seguidoDeNh && !formaHiatoDit)
            atual += char;
        else { resultado.push(atual); atual = char; }
    }
    resultado.push(atual);
    return resultado;
}

function separarConsoantes(cBlock) {
    if (cBlock.length <= 1) return ["", cBlock];
    let tL = cBlock.toLowerCase();
    if (cBlock.length === 2) {
        if (/^(ch|lh|nh|gu|qu|br|cr|dr|fr|gr|pr|tr|vr|bl|cl|fl|gl|pl|tl)$/.test(tL)) return ["", cBlock];
        return [cBlock.slice(0,1), cBlock.slice(1)];
    }
    if (/^(ch|lh|nh|gu|qu|br|cr|dr|fr|gr|pr|tr|vr|bl|cl|fl|gl|pl|tl)$/.test(tL.slice(-2)))
        return [cBlock.slice(0,-2), cBlock.slice(-2)];
    return [cBlock.slice(0,-1), cBlock.slice(-1)];
}

/**
 * Divide uma palavra PT-BR em sílabas.
 * @param {string} palavra
 * @returns {string[]}
 */
export function silabificar(palavra) {
    let blocos = [], tipoAt = '', textoAt = '';
    for (let i = 0; i < palavra.length; i++) {
        let ch = palavra[i], chL = ch.toLowerCase();
        if ((chL==='q'||chL==='g') && palavra[i+1] && palavra[i+1].toLowerCase()==='u'
            && palavra[i+2] && vRegex.test(palavra[i+2])) {
            if (tipoAt==='V') { blocos.push({tipo:'V',texto:textoAt}); textoAt=''; }
            blocos.push({tipo:'C',texto:ch+palavra[i+1]}); i++; tipoAt=''; continue;
        }
        let tipo = vRegex.test(ch) ? 'V' : 'C';
        if (tipo !== tipoAt) { if (textoAt) blocos.push({tipo:tipoAt,texto:textoAt}); tipoAt=tipo; textoAt=ch; }
        else textoAt += ch;
    }
    if (textoAt) blocos.push({tipo:tipoAt,texto:textoAt});
    let bExp = [];
    for (let b of blocos) {
        if (b.tipo==='V') tratarHiatosVogais(b.texto, palavra.toLowerCase()).forEach(v=>bExp.push({tipo:'V',texto:v}));
        else bExp.push(b);
    }
    let idxV = bExp.reduce((a,b,i)=>(b.tipo==='V'?[...a,i]:a),[]);
    if (!idxV.length) return [palavra];
    let sil = new Array(idxV.length).fill("");
    for (let i=0; i<idxV[0]; i++) sil[0] += bExp[i].texto;
    for (let k=0; k<idxV.length-1; k++) {
        sil[k] += bExp[idxV[k]].texto;
        let cT=""; for (let j=idxV[k]+1; j<idxV[k+1]; j++) cT+=bExp[j].texto;
        let [esq,dir] = separarConsoantes(cT); sil[k]+=esq; sil[k+1]+=dir;
    }
    let uV = idxV[idxV.length-1];
    sil[sil.length-1] += bExp[uV].texto;
    for (let i=uV+1; i<bExp.length; i++) sil[sil.length-1]+=bExp[i].texto;
    return sil;
}

/**
 * Identifica o índice da sílaba tônica.
 * @param {string[]} silabas
 * @param {string}   p  — palavra original
 * @returns {number}
 */
export function identificarTonica(silabas, p) {
    let t = p.toLowerCase();
    for (let i=0;i<silabas.length;i++) if(/[áéíóúâêô]/i.test(silabas[i])) return i;
    for (let i=0;i<silabas.length;i++) if(/[ãõ]/i.test(silabas[i])) return i;
    if (t.match(/(r|l|z|x|i|is|u|us|im|ins|um|uns)$/)) return silabas.length-1;
    if (t.match(/(a|as|e|es|o|os|am|em|ens)$/))        return Math.max(0,silabas.length-2);
    return Math.max(0,silabas.length-2);
}

// ═════════════════════════════════════════════════════════════════
//  2. CAMPOS FONÉTICOS — feature extraction
// ═════════════════════════════════════════════════════════════════

const CLUSTER_FAM = {
    br:'pl',cr:'pl',dr:'pl',fr:'fl',gr:'pl',pr:'pl',tr:'pl',vr:'fl',
    bl:'pl',cl:'pl',fl:'fl',gl:'pl',pl:'pl',tl:'pl',
    ch:'af',lh:'lp',nh:'np'
};

export const ACENT_LABEL = { ox:'Oxítona', px:'Paroxítona', ppx:'Proparoxítona', spx:'Superproparox.' };
export const FAM_LABEL   = {
    pl:'plosiva+líquida', fl:'fricativa+líquida', af:'africada',
    lp:'lateral palatal', np:'nasal palatal', si:'simples', vz:'—', cx:'complexo'
};
export const CLASSE_LABEL = { sub:'Subst.', adj:'Adj.', vrb:'Verbo', adv:'Adv.', outro:'Outro' };
export const FREQ_LABEL   = { comum:'Comum', media:'Neutra', rara:'Rara' };

export function calcOnset(sil)         { let m=sil.match(/^([^aeiouáàâãéêíóôõúü]*)/i); return m?m[1].toLowerCase():''; }
export function calcVogalT(sil)        { let m=sil.match(/[aeiouáàâãéêíóôõúü]/i); return m?normV(m[0]):''; }
export function calcVogaisRima(sil,ti) { return normV(sil.slice(ti).join('')).replace(/[^aeiouãõ]/g,''); }
export function calcEspinha(p)         { return normV(p).replace(/[^aeiouãõ]/g,''); }
export function calcAssC(sil,ti) {
    let span = sil.slice(ti).join('').toLowerCase().replace(/[aeiouáàâãéêíóôõúü]/g,'');
    return [...new Set(span)].sort().join('');
}
export function calcFam(o)   { return !o?'vz':o.length===1?'si':(CLUSTER_FAM[o]||'cx'); }
export function calcAcent(sil,ti) { let d=sil.length-1-ti; return d===0?'ox':d===1?'px':d===2?'ppx':'spx'; }
export function extrairRima(sil,ti) {
    let pf=sil.slice(ti).join(''),m=pf.match(vRegex);
    return m?pf.slice(m.index).toLowerCase():pf.toLowerCase();
}

export function calcCoda(p) {
    let pL = p.toLowerCase();
    for (let i = pL.length - 1; i >= 0; i--) {
        if (vRegex.test(pL[i])) return pL.slice(i + 1);
    }
    return '';
}

export function calcFreq(p, numSil) {
    let len = p.length;
    if (len <= 4) return 'comum';
    if (numSil <= 2 && len <= 6) return 'comum';
    if (len >= 12 || numSil >= 6) return 'rara';
    if (/(?:ismo|fobia|filia|grafia|logia|metria|nomia|scopia|cracia|genia|terapia)$/i.test(p)) return 'rara';
    if (/^(?:pseudo|proto|infra|ultra|supra|hiper|macro|micro)/.test(p) && len > 9) return 'rara';
    return 'media';
}

/**
 * Classe morfológica por heurística de sufixo.
 * @param {string} p
 * @returns {'sub'|'adj'|'vrb'|'adv'|'outro'}
 */
export function calcClasse(p) {
    const pL = p.toLowerCase();
    const len = pL.length;

    if (pL.endsWith('mente')) return 'adv';

    if (/(?:ção|são|xão)$/.test(pL))                           return 'sub';
    if (/(?:dade|tude)$/.test(pL))                             return 'sub';
    if (/(?:ismo|ista)$/.test(pL))                             return 'sub';
    if (/(?:eiro|eira)$/.test(pL))                             return 'sub';
    if (/(?:agem|igem)$/.test(pL))                             return 'sub';
    if (/mento$/.test(pL))                                     return 'sub';
    if (/(?:ência|ância|encia|ancia)$/.test(pL))               return 'sub';
    if (/(?:ança|ença)$/.test(pL))                             return 'sub';
    if (/eza$/.test(pL))                                       return 'sub';
    if (/ura$/.test(pL) && len > 4)                            return 'sub';
    if (/(?:logia|grafia|nomia|metria|fobia|filia|cracia|terapia|scopia|algia|mania|latria|genia)$/.test(pL)) return 'sub';

    if (/(?:oso|osa|ivo|iva)$/.test(pL))                       return 'adj';
    if (/(?:ável|ível)$/.test(pL))                             return 'adj';
    if (/vel$/.test(pL) && len > 5)                            return 'adj';
    if (/nte$/.test(pL) && len > 5)                            return 'adj';
    if (/(?:ório|ória)$/.test(pL))                             return 'adj';
    if (/(?:olar|unar)$/.test(pL) && len > 4)                             return 'adj';
    if (/(?:ular|onal|inal|eral|ival|ural)$/.test(pL) && len > 5)         return 'adj';

    if (/(?:ando|endo|indo)$/.test(pL))                        return 'vrb';
    if (/(?:asse|esse|isse)$/.test(pL))                        return 'vrb';
    if (/(?:aria|eria|iria)$/.test(pL))                        return 'vrb';
    if (/(?:aram|eram|iram)$/.test(pL))                        return 'vrb';
    if (/ava$/.test(pL) && len > 4)                            return 'vrb';
    if (/rria$/.test(pL))                                      return 'vrb';

    if (/ir$/.test(pL) && len > 3)                             return 'vrb';
    if (/er$/.test(pL) && len > 3)                             return 'vrb';
    if (/ar$/.test(pL) && len > 3)                             return 'vrb';

    if (/(?:ado|ada|ido|ida)$/.test(pL) && len > 4)            return 'outro';
    if (/ia$/.test(pL) && len > 4)                             return 'outro';
    if (/(?:ário|ária)$/.test(pL))                             return 'outro';

    return 'outro';
}

/**
 * Análise fonética completa de uma palavra PT-BR.
 *
 * @param {string} palavra
 * @returns {object|null}  Perfil fonético com todas as features, ou null se inválida.
 *
 * Campos retornados:
 *   palavra, silabas, tonicaIndex, numSilabas, acentuacao,
 *   rimaPerfeita, vogaisRima, onsetTonico, vogalTonica,
 *   espinhaVocal, assConsonantal, familiaCluster, coda, classe, freq
 */
export function perfilFonetico(palavra) {
    let pL = palavra.toLowerCase().trim();
    if (!pL || !/[a-záàâãéêíóôõúü]/i.test(pL)) return null;
    let sil = silabificar(pL), ti = identificarTonica(sil, pL), onset = calcOnset(sil[ti]);
    let numSil = sil.length;
    return {
        palavra:        pL,
        silabas:        sil,
        tonicaIndex:    ti,
        numSilabas:     numSil,
        acentuacao:     calcAcent(sil, ti),
        rimaPerfeita:   extrairRima(sil, ti),
        vogaisRima:     calcVogaisRima(sil, ti),
        onsetTonico:    onset,
        vogalTonica:    calcVogalT(sil[ti]),
        espinhaVocal:   calcEspinha(pL),
        assConsonantal: calcAssC(sil, ti),
        familiaCluster: calcFam(onset),
        coda:           calcCoda(pL),
        classe:         calcClasse(pL),
        freq:           calcFreq(pL, numSil),
    };
}

// ── convenience re-export of the vowel regex ─────────────────────
export { vRegex, normV };
