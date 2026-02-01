# 🎵 RimaBR - Brazilian Portuguese Rhyme Search Engine

> Sistema de busca de rimas similar ao RhymeZone, otimizado para Português Brasileiro com análise fonética multi-critério

---

## ✨ O que é?

**RimaBR** é um mecanismo de busca de rimas para português brasileiro que vai muito além da simples correspondência de sons finais. Ele usa o sistema de **matching fonético reasoning-based** desenvolvido para Claude Opus 4.5.

### Diferencial

| Característica | RhymeZone | RimaBR |
|----------------|-----------|--------|
| Língua | Inglês | **Português BR** |
| Análise | Sons finais | **Multi-critério** |
| Prosódia | Básica | **Oxítona/Paroxítona/Proparoxítona** |
| Scoring | Simples | **Graduado 0-100** |
| Contexto | Fixo | **Adaptável** (rap, MPB, sertanejo) |
| Explicação | Não | **Sim** (reasoning-based) |

---

## 🚀 Quick Start

### 1. Carregar palavras

```bash
# Opção A: Lista de exemplo (212 palavras)
python rimabr_cli.py load data/palavras_exemplo.txt

# Opção B: Lista completa (~320k palavras)
python carregar_palavras_completas.py
# Escolha opção 1
```

### 2. Buscar rimas

```bash
# Busca simples
python rimabr_cli.py search amor

# Com detalhes do reasoning
python rimabr_cli.py search amor --details

# Para rap (polissilábicas)
python rimabr_cli.py search ancestralidade --min-syllables 4
```

### 3. Ver estatísticas

```bash
python rimabr_cli.py stats
```

---

## 📊 Exemplo de Resultado

```bash
$ python rimabr_cli.py search amor --details

================================================================================
Searching rhymes for: 'amor'
================================================================================

Found 10 rhymes:

Rank   Word                 Score    Level           Syllables
--------------------------------------------------------------------------------
1      calor                0.69     Good Match      1
2      valor                0.69     Good Match      1
3      sabor                0.69     Good Match      1

Top 5 - Detailed Analysis:
================================================================================

1. calor (Score: 0.69)
   Good match between 'amor' and 'calor'.
   ✓✓ Tonic vowel match: 'a'
   △ Different tonic consonants: 'm' vs 'c'

   Breakdown:
   - prosodic: 0.25 (same stress pattern)
   - tonic_core: 0.27 (vowel match)
   - phonetic: 0.17 (similar sounds)
   - morphological: 0.0 (no shared prefix/suffix)
```

---

## 🎯 Casos de Uso

### RAP / Hip-Hop

Buscar rimas polissilábicas para rap consciente:

```bash
$ python rimabr_cli.py search marginalização --min-syllables 5

Found rhymes:
1. criminalização   (6 syl, 0.90) - PERFECT
2. descolonização   (6 syl, 0.85) - STRONG
3. ressignificação  (6 syl, 0.74) - GOOD
```

### Sertanejo

Buscar rimas tradicionais com -ão:

```bash
$ python rimabr_cli.py search coração --ending ão --syllables 3

Found rhymes:
1. paixão
2. solidão
3. canção
```

### MPB Experimental

Buscar proparoxítonas (Chico Buarque style):

```bash
$ python rimabr_cli.py pattern --stress proparoxítona

Found words:
- última
- música
- lágrima
- máquina
```

---

## 🛠️ Comandos Principais

### Search (Buscar rimas)

```bash
# Básico
python rimabr_cli.py search PALAVRA

# Com filtros
python rimabr_cli.py search PALAVRA \
    --stress paroxítona \
    --syllables 3 \
    --suffix dade \
    --limit 50 \
    --details
```

### Pattern (Buscar por padrão)

```bash
# Por características específicas
python rimabr_cli.py pattern \
    --tonic-vowel a \
    --suffix dade \
    --stress paroxítona
```

### Load (Carregar palavras)

```bash
# Carregar lista
python rimabr_cli.py load palavras.txt

# Com batch size maior (listas grandes)
python rimabr_cli.py load palavras.txt --batch-size 5000
```

### Stats (Estatísticas)

```bash
# Ver estatísticas do banco
python rimabr_cli.py stats
```

---

## 📁 Estrutura de Arquivos

```
language-play-ptbr/
├── src/
│   ├── database/
│   │   └── rimabr_db.py        # Motor de busca
│   ├── analyzers/
│   │   └── phonetic_analyzer.py # Análise fonética
│   └── matchers/
│       └── reasoning_matcher.py # Scoring multi-critério
├── data/
│   ├── palavras_exemplo.txt     # 212 palavras (demo)
│   ├── palavras_completas.txt   # ~320k palavras (completo)
│   ├── kpalavras.txt            # ~52k palavras
│   └── rimabr.db               # Banco SQLite (criado após load)
├── rimabr_cli.py               # Interface CLI
├── carregar_palavras_completas.py # Script para listas grandes
├── demo_rimabr.py              # Demonstrações
└── RIMABR_GUIA.md              # Guia completo
```

---

## 🔍 Critérios de Análise

### O que o sistema analisa:

1. **Prosódia** (25%)
   - Tipo: oxítona, paroxítona, proparoxítona
   - Número de sílabas
   - Posição da tônica

2. **Núcleo Tônico** (45%) - *mais importante!*
   - Vogal da sílaba tônica
   - Consoante da sílaba tônica
   - Sílaba tônica completa

3. **Padrões Fonéticos** (20%)
   - Sequência de vogais
   - Grupos consonantais
   - Terminações

4. **Morfologia** (10%)
   - Prefixos compartilhados
   - Sufixos compartilhados

### Níveis de Score:

- **0.90-1.00**: Perfect Match (rima perfeita)
- **0.75-0.89**: Strong Match (rima forte)
- **0.60-0.74**: Good Match (rima boa)
- **0.40-0.59**: Weak Match (rima fraca, rap/experimental)
- **0.20-0.39**: Poor Match (correspondência mínima)
- **0.00-0.19**: No Match (sem correspondência)

---

## 💾 Listas de Palavras

### Opção 1: Lista de Exemplo (demo)

```bash
python rimabr_cli.py load data/palavras_exemplo.txt
```

- 212 palavras cuidadosamente selecionadas
- Ótimo para testar e aprender
- Vocabulário comum de música/poesia

### Opção 2: Lista Completa (~320k palavras)

```bash
# Baixar do GitHub
curl -L 'https://raw.githubusercontent.com/guitorte/language-play-ptbr/main/upload/palavras.txt' -o data/palavras_completas.txt

# Carregar (interativo)
python carregar_palavras_completas.py

# Ou direto
python rimabr_cli.py load data/palavras_completas.txt --batch-size 5000
```

### Opção 3: Sua Própria Lista

```bash
# Criar arquivo .txt com uma palavra por linha
echo "amor" > minhas_palavras.txt
echo "coração" >> minhas_palavras.txt
echo "paixão" >> minhas_palavras.txt

# Carregar
python rimabr_cli.py load minhas_palavras.txt
```

---

## ⚡ Performance

### Lista Pequena (~200 palavras)

- Indexação: < 1 segundo
- Busca: instantânea
- Ideal para: testes, desenvolvimento

### Lista Média (~10k palavras)

- Indexação: ~5-10 segundos
- Busca: < 100ms
- Ideal para: uso diário, composição

### Lista Grande (~320k palavras)

- Indexação: ~10-20 minutos (uma vez)
- Busca: < 500ms
- Ideal para: banco completo, produção

### Otimizações

```bash
# Usar batch size maior para listas grandes
python rimabr_cli.py load palavras.txt --batch-size 10000

# Usar banco específico
python rimabr_cli.py --db meu_banco.db load palavras.txt

# Múltiplos bancos para diferentes propósitos
python rimabr_cli.py --db rap.db load vocabulario_rap.txt
python rimabr_cli.py --db sertanejo.db load vocabulario_sertanejo.txt
```

---

## 🎨 Exemplos Práticos

### 1. Compositores de Rap

```bash
# Encontrar rimas polissilábicas
python rimabr_cli.py search consciência --min-syllables 4

# Vocabulário político/social
python rimabr_cli.py pattern --suffix ção --min-syllables 5 > palavras_rap.txt
```

### 2. Compositores de Sertanejo

```bash
# Rimas tradicionais -ão
python rimabr_cli.py search sertão --ending ão

# Paroxítonas 2-3 sílabas
python rimabr_cli.py search vida --stress paroxítona --max-syllables 3
```

### 3. Poetas/MPB

```bash
# Proparoxítonas (efeito literário)
python rimabr_cli.py pattern --stress proparoxítona

# Rimas com -dade (abstração)
python rimabr_cli.py pattern --suffix dade --min-syllables 4
```

### 4. Repentistas

```bash
# 7 sílabas (Martelo Agalopado)
python rimabr_cli.py pattern --syllables 7

# Vocabulário nordestino
python rimabr_cli.py search sertão --ending ão --syllables 2
```

---

## 🔧 Integração em Código

### Python

```python
from src.database.rimabr_db import RimaBRDatabase

# Conectar
db = RimaBRDatabase("data/rimabr_completo.db")

# Buscar
results = db.search("amor", limit=10)
for r in results:
    print(f"{r['word']}: {r['score']:.2f}")

# Com filtros
results = db.search(
    "ancestralidade",
    filters={
        "min_syllables": 4,
        "suffix": "dade"
    }
)

# Por padrão
results = db.search_by_criteria(
    tonic_vowel='a',
    stress_type='paroxítona'
)
```

---

## 📚 Documentação Completa

- **RIMABR_GUIA.md**: Guia completo com todos os comandos e exemplos
- **API_INTEGRATION.md**: Como usar com Claude API
- **THREE_GENRE_COMPOSITIONS.md**: Exemplos de composições (rap, MPB, repente)

---

## 🏆 Vantagens sobre Dicionários Tradicionais

### Dicionário de Rimas Tradicional:
- ❌ Apenas sons finais
- ❌ Binário (rima ou não rima)
- ❌ Sem contexto
- ❌ Não explica por quê

### RimaBR:
- ✅ **Multi-critério** (prosódia + tônica + fonética + morfologia)
- ✅ **Graduado** (scores 0-100)
- ✅ **Contextual** (rap vs sertanejo vs MPB)
- ✅ **Explicável** (mostra raciocínio)
- ✅ **Filtros avançados** (sílabas, acentuação, sufixos)
- ✅ **Otimizado para PT-BR** (oxítona/paroxítona/proparoxítona)

---

## 🤝 Como Contribuir

1. Adicione mais palavras à lista
2. Melhore a silabificação
3. Adicione variantes regionais
4. Crie vocabulários temáticos

---

## 📄 Licença

MIT License - use livremente!

---

**Desenvolvido com ❤️ para a comunidade brasileira de compositores, rappers, poetas e artistas!** 🇧🇷
