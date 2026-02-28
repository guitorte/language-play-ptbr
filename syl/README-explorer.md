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
| `coda` | Consoante(s) após última vogal | `""` (aberta) |
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

## Interface — Estado Atual (v3 — Gold Standard)

Arquitetura Bottom Sheet (100dvh) com infinite scroll silencioso e filtros precisos:

```
┌─────────────────────────────────────────────────────────────────┐
│ ● 266 palavras  ● Rima 23  ● Eco 87  ● Ass 156  ● Prox 412     │  ← sticky header
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [abs·TRA·to]  [fogo]  [logo]  [pogo]  [bogo]  [jogo]  ...      │
│ [amor]  [dor]  [cor]  [flor]  [mor]  [sor]  ...                │
│ ...                                                             │
│                                                                 │  ← #viewport
│                                           ↓ infinite scroll       │
│ ...  [caro]  [para]  [mara]  [tara]                             │
│                          ◄ sentinel (trigger)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
  ╭─ #bottom-panel (border-radius 18px 18px 0 0) ────────────────╮
  │                                                                 │
  │  ─────  ← handle (drag/click para colapsar)                   │
  │                                                                 │
  │  🔍 Molde          🏗 Construtor                               │  ← tabs (sempre visíveis)
  │ ┌──────────────────────────────────────────────────────────┐  │
  │ │ [____________ Digite uma palavra ____________] [🎤]      │  │  ← search-wrap
  │ │                                                          │  │
  │ │ [🔒 3 síl.] [Parox.] [vogal /a/] [coda: -o] [≠ onset]  │  │  ← lego pills
  │ │ ┌─────────────────────────────────────────────────────┐ │  │     travado | padrão
  │ │ │    (long-press nas pills = negação ≠)              │ │  │
  │ │ └─────────────────────────────────────────────────────┘ │  │     negado | desmontado
  │ │                                                          │  │
  │ │ Status: ✅ 51.234 palavras prontas                       │  │
  │ └──────────────────────────────────────────────────────────┘  │  ← aba-molde
  │                                                                 │
  │ OU (se em Construtor):                                         │
  │ ┌──────────────────────────────────────────────────────────┐  │
  │ │ Número de sílabas: [−] 3 [+]                           │  │
  │ │ Acentuação: [Qualquer] [Ox.] [Par.] [Prox.]            │  │
  │ │ Vogal tônica: [A] [E] [I] [O] [U]                      │  │
  │ │ Onset tônico: [_____________]  ex: tr, pr, fl…         │  │
  │ └──────────────────────────────────────────────────────────┘  │  ← aba-construtor
  │                                                                 │
  │  (max-height: 0 quando colapsado; auto-collapse ao rolar ↓)   │
  ╰─────────────────────────────────────────────────────────────╯
```

**Detalhes técnicos v3:**

- **Zona de leitura:** `#viewport` (flex: 1, overflow-y: auto) ocupa todo espaço. Infinite scroll via IntersectionObserver (chunk 60 itens).
- **Zona do polegar:** `#bottom-panel` (flex-shrink: 0) com Bottom Sheet clássico. Handle clicável + abas sempre visíveis.
- **Auto-collapse:** colapsa ao rolar ↓ (y > 80px + delta > 20px); reabre ao voltar ao topo (y < 60px). Nunca por direção intermediária de scroll.
- **Sticky header:** contagem + chips coloridos de faixa (só no modo Molde com score).
- **Lego pills:** três estados visuais:
  - **Padrão:** cinza (não aplicado)
  - **Travado:** laranja com 🔒 (toque curto = toggle)
  - **Negado:** vermelho com ≠ (toque longo 500ms = ativa negação)
- **Blocos Molde:** numSílabas, acentuação, vogalTonica, onsetTonico, **coda**, familiaCluster, rimaPerfeita, vogaisRima, espinhaVocal (9 campos).
- **Construtor:** acesso a numSílabas (stepper), acentuação (radio), vogalTonica (grid), **onsetTonico** (texto).
- **Microfone:** Web Speech API progressiva (não quebra sem ela); recognição em pt-BR, pega última palavra da frase.
- **Vibração:** feedback háptico diferenciado (travar, negar, buscar).
- **CORS:** fetch('./palavras.txt') requer servidor local.

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

| Arquivo | Versão | Data | Descrição |
|---|---|---|---|
| `index.html` | v3 (atual) | 2026-02-28 | Bottom Sheet + Lego Locks + negação + onset |
| `index-v2-flatheader.html` | v2 | 2026-02-27 | Flat header + seções colapsáveis (backup) |
| `index-v1-bandas.html` | v1 | v1 | Faixas toggleáveis, layout original (backup) |

---

## Roadmap

### ✅ Implementado (v3 — Gold Standard)

**Arquitetura Bottom Sheet (Fase 3)**
- [x] `100dvh` body com overflow: hidden
- [x] `#viewport` (flex: 1, overflow-y: auto) para zona de leitura
- [x] `#bottom-panel` com border-radius 18px 18px 0 0
- [x] Handle clicável + abas sempre visíveis
- [x] Tab-wrapper com max-height animado (cubic-bezier)
- [x] Auto-collapse ao rolar ↓ (y > 80px + delta > 20px); reabre ao topo (y < 60px)
- [x] Sticky header com contagem + chips de faixa
- [x] `interactive-widget=resizes-content` + `safe-area-inset-bottom` (iOS)
- [x] `overscroll-behavior-y: contain` (evita pull-to-refresh)

**Infinite Scroll (Fase 5)**
- [x] IntersectionObserver no sentinel
- [x] Chunk de 60 itens, carregamento silencioso
- [x] rootMargin: 120px (antecipa carregamento)

**Molde: Lego Locks (Fase 5)**
- [x] Extração de blocos fonéticos como pílulas clicáveis
- [x] Toque curto = travada/destrava (toggle simples)
- [x] FILTROS[campo] aplicado como eliminação (não por peso)

**Construtor (Fase 4 — parcial)**
- [x] Stepper de sílabas
- [x] Radio de acentuação
- [x] Grid de vogais tônicas
- [x] Campo texto para onset tônico (novo!)

**Novos Blocos Fonéticos**
- [x] `coda` como campo no perfilFonetico() (consoante final)
- [x] `coda` aparece como lego pill no Molde
- [x] `coda` filtrável no Construtor (texto)

**Negação de Filtros (Fase 5+)**
- [x] FILTROS_NEG[campo] = true/false para negar
- [x] Toque longo 500ms (pointer events) = ativa negação
- [x] Visual: pill.locked (laranja) | pill.negated (vermelho ≠)
- [x] Cancelamento robusto de timer via pointerup/cancel
- [x] Vibração: curto [15/45ms] | longo [10,30,70ms]

**Funcionalidades Extras**
- [x] Web Speech API (microphone 🎤, pt-BR, pega última palavra)
- [x] Debounce 280ms no input + Enter imediato
- [x] Vibração háptica em ações
- [x] Event delegation robusto para pills (suporta nomes especiais)

---

### 📅 Planejado (Fase 6+)

**Pesos e Equalizador (Fase 4 — completo)**
- [ ] 3º tab "Pesos" integrado ao Bottom Sheet
- [ ] Sliders para os 9 critérios (rima, assonância, eco exato, etc.)
- [ ] Debounce 150ms para não re-score a cada pixel
- [ ] Salvar pesos no localStorage

```javascript
let PESOS = {
  rimaPerfeita: 100, vogaisRima: 60, ecoExato: 50, ecoCompartilhado: 25,
  familiaCluster: 20, assConsonantal: 30, espinhaVocal: 40, vogalTonica: 15, ritmo: 10
};
```

**Frequência de Uso (prioridade alta)**
- [ ] Anotar dicionário com classe 1–5 derivada de corpus
- [ ] Filter no Construtor: "comum / raro"
- [ ] Muda caráter das sugestões (erudita vs popular)

**Rima Imperfeita (near-rhyme)**
- [ ] Levenshtein/edição na string de rima
- [ ] Nova faixa "Quase-rima" com score ~120–140
- [ ] Abre espaço para sonoridades menos óbvias

**Classe Morfológica**
- [ ] Heurística por sufixo: -ção (subst), -mente (adv), -oso (adj), -ar (verb)
- [ ] Filter no Construtor: "substantivos apenas", "adjetivos…"

**Modo Exploração: Faixas Isoladas**
- [ ] Vista alternativa horizontal: swipe entre faixas
- [ ] Vê só "Rima" → swipe → vê só "Eco forte"
- [ ] Útil para listas longas de uma faixa específica

**Comparar Dois Moldes**
- [ ] 2º campo input: palavra B
- [ ] Intersecção de rimas de A ∩ rimas de B
- [ ] "Quais palavras rimam com X E com Y?"

**Histórico e Favoritos**
- [ ] localStorage: últimas 20 palavras buscadas
- [ ] Marcar com ⭐ para "lista pessoal"
- [ ] Exportar favoritos como texto/CSV

**Compartilhar via URL Hash**
- [ ] `#molde=fogo&locks=rima,3sil&onset=&coda=-o`
- [ ] Restaura estado completo ao abrir
- [ ] Permite mandar busca específica para outra pessoa

**Análise de Verso**
- [ ] Campo "colar um verso" → silabifica, marca tônicas
- [ ] Identifica esquema rítmico (decassílabo, redondilha…)
- [ ] Feedback imediato ao escrever poesia

**Verificador de Métrica**
- [ ] Digitar estrofe inteira → checa esquema (ABAB, ABBA…)
- [ ] Aponta divergências linha a linha

**Sugestor de Continuação**
- [ ] Verso incompleto + esquema desejado
- [ ] Sugere palavras que rimam + cabem no ritmo + classe morfológica correta

**IndexedDB Cache**
- [ ] Salva dicionário indexado após 1ª carga
- [ ] ~300% mais rápido na 2ª visita
- [ ] Estratégia: serialize() / deserialize() com workers

**Dark Mode**
- [ ] `prefers-color-scheme: dark` automático
- [ ] Conforto noturno

---

### 🎯 Prioridades Imediatas

| # | Item | Esforço | Impacto | Status |
|---|------|---------|---------|--------|
| 1 | Frequência de uso (corpus) | médio | alto | planejado |
| 2 | Rima imperfeita (Levenshtein) | médio | alto | planejado |
| 3 | Classe morfológica | médio | médio | planejado |
| 4 | Historico + Favoritos | baixo | médio | planejado |
| 5 | URL hash sharing | baixo | alto | planejado |
| 6 | Dark mode | baixo | médio | planejado |
| 7 | Analisador de verso | alto | alto | laboratório |

---

### 📚 Referências Técnicas Anteriores

**Pesos (Fase 4 — Labs)**

Sliders para os 9 critérios do score composto.
Os pesos substituem as constantes hardcoded (+100, +60, +50...) por variáveis ajustáveis.
Debounce de 150ms para não recalcular 50K palavras a cada pixel do slider.

### 🧪 Funcionalidades Extras — Backlog (Fase 6+)

| Feature | Descrição | Impacto |
|---|---|---|
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

---

## Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| v3 (atual) | 2026-02-28 | Bottom Sheet completo, Lego Locks, negação ≠, onset+coda, infinite scroll, auto-collapse robusto |
| v2 | 2026-02-27 | Flat header, seções colapsáveis, sistema de faixas consolidado |
| v1 | (anterior) | Faixas toggleáveis, layout original |

**Motor fonético:** estável desde v1.
**Interface:** v3 — Bottom Sheet Gold Standard (2026-02-28).
