# Explorador de Sonoridades — Documentação Técnica

Motor fonético + interface de exploração de proximidade sonora em Português Brasileiro.
Vanilla JS, zero dependências, arquivo único.

---

## Contexto e Linhagem

Este arquivo (`index.html`) é o produto de uma linha de desenvolvimento específica dentro do projeto
`ptbrwp/syl`, que começou como um analisador silábico de texto corrido (`sep.htm`) e evoluiu em
paralelo com experimentos de layout do próprio repositório.

```
sep.htm          → analisador silábico de texto corrido (origem do motor)
  └─ index.html  → explorador de busca por palavra-base (esta linha)
       v1-bandas   snapshot: sistema de faixas toggleáveis
       v2-flatheader (atual): cabeçalho flat + seções colapsáveis

Linha paralela do repositório (experimentação independente):
  v3 / v4 / v5   → layout flat com sticky header progressivamente refinado
  x2 / x3        → arquitetura Bottom Sheet ("Sintetizador Fonético PRO")
```

O `README.md` existente no repositório documenta a visão arquitetural da linha x3 (Bottom Sheet).
Este documento foca no motor fonético e na interface da linha `index.html`, e inclui um roadmap
de convergência com a visão x3.

---

## O Motor Fonético

### Silabificação

Algoritmo próprio para Português Brasileiro. Cobre:

- **Dígrafos** (`ch`, `lh`, `nh`, `gu`, `qu`) tratados como unidades consonantais
- **Ditongos** vs **hiatos** com 5 regras de distinção:
  - vogais idênticas → hiato
  - hiatos com acento gráfico (`saúde`, `raíz`)
  - hiatos finais específicos (`juiz`, `Paul`)
  - sequências `VNH` bloqueiam ditongo (`manhã`)
  - hiatos triplos com semivogal medial (`miolos`, `tiolos`)
- **Separação de grupos consonantais**: ingloba clusters à sílaba seguinte;
  separa sequências não-inseparáveis (ex: `abs·tra·to`, não `ab·stra·to`)
- **Identificação de tônica** por acento gráfico, terminação, depois regra padrão

### Campos Fonéticos

Cada palavra indexada recebe 8 campos calculados uma vez na indexação:

| Campo | Descrição | Exemplo (`abstrato`) |
|---|---|---|
| `silabas` | Array de sílabas | `['abs','tra','to']` |
| `tonicaIndex` | Índice da tônica | `1` |
| `rimaPerfeita` | Vogal tônica → fim | `"ato"` |
| `vogaisRima` | Só vogais do span tônico→fim | `"ao"` |
| `onsetTonico` | Consoante(s) de ataque da tônica | `"tr"` |
| `familiaCluster` | Tipo estrutural do onset | `"pl"` (plosiva+líquida) |
| `espinhaVocal` | Sequência de todas as vogais | `"aao"` |
| `assConsonantal` | Conjunto de consoantes do span | `"bsrt"` |

> **Nota sobre vogais nasais:** `ã` e `õ` são preservados como classe distinta em `espinhaVocal`
> e `vogaisRima` (ex: `limão` → espinha `"iãõ"`). Isto difere de alguns experimentos paralelos
> que as normalizam para `a`/`o`, o que perderia a distinção entre `mão` e `mau`.

---

## Sistema de Pontuação Composta

Score calculado por comparação de dois perfis fonéticos. Máximo teórico: **350 pts**.

```
Critério                   Pontos   Condição
─────────────────────────────────────────────────────────────
Rima perfeita              +100     rimaPerfeita idêntica
Assonância                 + 60     vogaisRima idênticas
Eco consonantal exato      + 50     onsetTonico idêntico
Consoante compartilhada    + 25     onset tem ≥1 letra em comum
Família de cluster         + 20     mesmo tipo estrutural (plosiva+líq, etc.)
Assonância consonantal     + 30     Jaccard ≥ 0.5 nas consoantes do span
Espinha vocal              + 40     espinhaVocal completa idêntica
Vogal tônica               + 15     vogalTonica idêntica
Padrão rítmico             + 10     mesmo nº sílabas + mesmo tipo de acento
```

Os critérios são **independentes e cumulativos**: uma palavra pode pontuar em vários ao mesmo tempo.
O algoritmo é otimizado para 50K+ palavras: os Sets do alvo são pré-computados fora do loop.

### Faixas de Proximidade

Os resultados são classificados em 5 faixas com cores distintas:

| Faixa | Score | Significado |
|---|---|---|
| Rima | ≥ 160 | Rima perfeita clássica |
| Eco forte | 100–159 | Múltiplos critérios sobrepostos |
| Assonância | 60–99 | Ressonância vocálica sem rima exata |
| Proximidade | 25–59 | Conexão consonantal / espinha (zona soramimi) |
| Ritmo | 10–24 | Só estrutura silábica e acentual em comum |

---

## Interface — Estado Atual (v2)

Cinco elementos verticais pós-busca, mobile-aware mas sem Bottom Sheet:

```
┌──────────────────────────────────────────────────────────────┐
│ Explorador de Sonoridades              [✅ 51.234 palavras]   │  ← app-header
├──────────────────────────────────────────────────────────────┤
│ [_________________________palavra_______________________ →]   │  ← search-wrap
│                                                              │    input full-width, botão embutido
│ abs·TRA·to  [3 síl.] [Parox.] [vogal /a/] [onset: tr] [···] │  ← perfil-linha
│                                                              │
│ [● Rima 23] [● Eco 87] [● Ass 156] [○ Prox 412] [○ Ritmo 1K]│  ← banda-row (scrollável)
│                                                              │
│ 266 palavras        [⊞][≡]   [2s][3s][4s] | [Parox.][Oxít.] │  ← result-header
├──────────────────────────────────────────────────────────────┤
│  [card][card][card][card][card][card][card][card][card][card] │  ← ⊞ grid paginado
│  ...                                                         │     ou
│  ▼ Rima (≥160) ─────────────────────────── 23 palavras       │  ← ≡ seções colapsáveis
│    [card][card][card][card]  [+ 20 mais]                     │
│  ▼ Eco forte (100-159) ─────────────────── 87 palavras       │
│    [card][card][card]...                                      │
└──────────────────────────────────────────────────────────────┘
```

**Detalhes de implementação:**
- `inputPalavra.blur()` após busca fecha o teclado no mobile
- Foco condicional no input: só em viewport > 768px (evita abertura involuntária de teclado)
- Cards com `data-palavra` + event delegation (suporta palavras com apóstrofo)
- `modoView` persiste entre buscas (usuário não perde o modo ≡ ao buscar nova palavra)
- Estado de colapso e limite de seções persiste ao mudar facetas/faixas (reset só na nova busca)
- `color-mix()` evitado: cores de seções hardcoded no array `BANDAS` (rgb inline)

---

## Como Rodar

O projeto usa `fetch('./palavras.txt')` e precisa de servidor local (CORS).

```bash
# Python
python -m http.server 8000
# Acesse: http://localhost:8000/syl/index.html

# Node (npx)
npx serve syl/
```

**Formato do `palavras.txt`:** uma palavra por linha, sem cabeçalho.
O arquivo atual tem ~51.800 linhas. Linhas sem letra são ignoradas automaticamente.

---

## Snapshots de Versões

| Arquivo | Versão | Descrição |
|---|---|---|
| `index.html` | v2 (atual) | Flat header + seções colapsáveis |
| `index-v2-flatheader.html` | v2 backup | Cópia antes da próxima iteração |
| `index-v1-bandas.html` | v1 backup | Faixas toggleáveis, layout original |

---

## Roadmap

O roadmap de convergência com a visão Bottom Sheet do `x3.html`.

### Fase 3 — Arquitetura Bottom Sheet (próxima iteração)

Migrar para o paradigma `100dvh` com controles na zona do polegar:

```
body height: 100dvh; overflow: hidden
  ├─ #viewport (flex:1, overflow-y:auto, overscroll-behavior-y:contain)
  │   └─ cards grid + infinite scroll
  └─ #bottom-panel (fixed height, border-radius 24px 24px 0 0)
       ├─ handle (drag-to-resize)
       ├─ tabs [Molde] [Pesos] [Raio-X]
       └─ tab-wrapper (max-height animado para auto-collapse no scroll)
```

Manter o motor fonético atual intacto. Só muda a camada de UI.

**Auto-collapse:** ao rolar para baixo no viewport, o `bottom-panel` retrai via
`classList.add('collapsed')` com `max-height: 0` animado no `.tab-wrapper`.

**Proteções mobile:**
- `interactive-widget=resizes-content` no viewport meta
- `safe-area-inset-bottom` no padding do painel inferior
- `overscroll-behavior-y: contain` no viewport (evita pull-to-refresh)
- `inputmode="search"` + `enterkeyhint="search"` no input

### Fase 4 — Labs: Pesos e Raio-X

Dois tabs adicionais integrados ao Bottom Sheet:

**Pesos (Equalizador):** Sliders para os 9 critérios do score composto.
Os pesos substituem as constantes hardcoded (+100, +60, +50...) por variáveis ajustáveis.
Debounce de 150ms para não recalcular 50K palavras a cada pixel do slider.

```javascript
// Estrutura de pesos:
let PESOS = {
  rima: 100, assonancia: 60, ecoExato: 50, ecoCompartilhado: 25,
  familiaCluster: 20, assConsonantal: 30, espinha: 40, vogalTonica: 15, ritmo: 10
};
```

**Raio-X (Construtor):** Busca sem palavra-base. O usuário define critérios diretamente:
- Steppers para número de sílabas (`+` / `-`, 44px mínimo)
- Radio buttons para tipo de acentuação
- Grid de botões de vogal tônica (A/E/I/O/U)
- Resultado filtra o dicionário inteiro pelos critérios definidos

Quando o Raio-X está ativo, `alvoAtual = null` e `calcScore` é substituído por `passaNosFiltros`.

### Fase 5 — Infinite Scroll com IntersectionObserver

Substituir a paginação/load-more atual por injeção silenciosa no fim do scroll:

```javascript
// Sentinel no fim do grid
const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) injetarProximoLote();
}, { root: document.getElementById('viewport'), rootMargin: '120px' });
```

Vantagem: o usuário nunca clica em "carregar mais" — a lista simplesmente continua.
Memória controlada: só os cards visíveis estão no DOM (virtual scroll é desnecessário para 50K).

### Fase 5 — Molde: Lego Locks

Na aba Molde, ao buscar uma palavra, as características extraídas viram pílulas clicáveis.
Clicar em uma pílula "trava" aquele critério como filtro absoluto (não por peso, por eliminação).

```
abs·TRA·to
  [🔒 3 sílabas]  [Parox.]  [vogal /a/]  [onset: tr]
```

Lego travado → aplica `FILTROS[campo] = valor` antes do cálculo de score.
Lego destravado → `FILTROS[campo] = null`.

### Fase 6 — IndexedDB e Funcionalidades Extras

| Feature | Descrição | Impacto |
|---|---|---|
| **IndexedDB cache** | Salva o dicionário indexado no browser após 1ª carga | ~300% mais rápido na 2ª visita |
| **Web Speech API** | Botão 🎤 no input, `recognition.lang = 'pt-BR'`, pega última palavra da frase | Já protótipado no v5.html |
| **Vibration API** | `navigator.vibrate(30)` ao travar lego, `vibrate(50)` ao buscar | Feedback háptico no Android |
| **Exportar lista** | Copiar resultados filtrados como texto/CSV | Para uso em letras e poemas |
| **Dark mode** | `prefers-color-scheme: dark` automático | Conforto noturno |

---

## Notas Técnicas e Decisões de Design

**Por que não IndexedDB ainda?**
O `perfilFonetico()` de 51K palavras roda em ~80ms num celular mediano. Até que o dicionário
cresça para centenas de milhares de palavras, a latência de IndexedDB (serialização/desserialização
dos perfis) pode custar mais do que a indexação em memória custa hoje.

**Por que 5 faixas e não score contínuo?**
Faixas criam *ancoragem cognitiva*: o usuário entende imediatamente "isso é uma rima, isso é
assonância". Score puro de 0-350 seria mais preciso mas menos comunicativo. As faixas também
permitem filtragem por inclusão/exclusão sem precisar de slider.

**Por que preservar ã e õ na espinha?**
Português tem pares mínimos por nasalidade: `mão` vs `mau`, `limão` vs `limão`.
Normalizar `ã→a` e `õ→o` faz a espinha de `limão` (`iãõ`) colidir com `vitrão` de forma
indevida. A classe nasal é foneticamente distinta e merece tratamento separado.

**Por que event delegation e não onclick inline?**
Palavras com apóstrofo (`d'água`) ou aspas quebram `onclick="...valor..."` em innerHTML.
Event delegation no container pai é mais robusto e elimina o problema completamente.

---

*Motor fonético estável desde v1. Interface: v2 (2026-02-27).*
