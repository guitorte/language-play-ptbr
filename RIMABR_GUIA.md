# RimaBR - Guia Completo

**Sistema de busca de rimas para Português Brasileiro baseado em análise fonética multi-critério**

Similar ao RhymeZone, mas otimizado para PT-BR com critérios linguísticos sofisticados.

---

## 🎯 O Que é o RimaBR?

RimaBR é um mecanismo de busca de rimas que vai além da simples correspondência de sons finais. Ele analisa:

- ✅ **Prosódia**: Tipo de acentuação (oxítona, paroxítona, proparoxítona)
- ✅ **Núcleo tônico**: Vogal e consoante da sílaba tônica
- ✅ **Padrões fonéticos**: Sequências de vogais e consoantes
- ✅ **Morfologia**: Prefixos e sufixos
- ✅ **Contexto**: Adaptação por gênero (rap, MPB, sertanejo, etc.)

---

## 🚀 Quick Start

### 1. Carregar lista de palavras

```bash
# Com a lista de exemplo
python rimabr_cli.py load data/palavras_exemplo.txt

# Com sua própria lista (uma palavra por linha)
python rimabr_cli.py load palavras.txt

# Com lista grande (ajustar batch size)
python rimabr_cli.py load palavras.txt --batch-size 5000
```

### 2. Buscar rimas

```bash
# Busca simples
python rimabr_cli.py search amor

# Com detalhes
python rimabr_cli.py search amor --details

# Mais resultados
python rimabr_cli.py search amor --limit 50
```

### 3. Ver estatísticas

```bash
python rimabr_cli.py stats
```

---

## 📖 Exemplos de Uso

### Exemplo 1: Busca Básica

```bash
$ python rimabr_cli.py search amor --limit 5

Found 5 rhymes:

Rank   Word                 Score    Level           Syllables
--------------------------------------------------------------------------------
1      calor                0.69     Good Match      1
2      valor                0.69     Good Match      1
3      sabor                0.69     Good Match      1
4      vapor                0.69     Good Match      1
5      rumor                0.40     Weak Match      1
```

### Exemplo 2: Filtrar por Acentuação

```bash
# Apenas paroxítonas
$ python rimabr_cli.py search amor --stress paroxítona

# Apenas oxítonas
$ python rimabr_cli.py search paixão --stress oxítona
```

### Exemplo 3: Filtrar por Número de Sílabas

```bash
# Exatamente 3 sílabas
$ python rimabr_cli.py search coração --syllables 3

# Mínimo 4 sílabas (para rap)
$ python rimabr_cli.py search ancestralidade --min-syllables 4

# Entre 2 e 4 sílabas
$ python rimabr_cli.py search vida --min-syllables 2 --max-syllables 4
```

### Exemplo 4: Filtrar por Sufixo

```bash
# Apenas palavras terminadas em -dade
$ python rimabr_cli.py search liberdade --suffix dade

# Apenas palavras terminadas em -ção
$ python rimabr_cli.py search criminalização --suffix ção
```

### Exemplo 5: Busca por Padrão

```bash
# Todas palavras com vogal tônica 'a'
$ python rimabr_cli.py pattern --tonic-vowel a

# Todas palavras com sílaba tônica 'ca'
$ python rimabr_cli.py pattern --tonic-syllable ca

# Combinar critérios
$ python rimabr_cli.py pattern --tonic-vowel a --suffix dade --stress paroxítona
```

---

## 🎤 Casos de Uso por Gênero

### RAP / Hip-Hop

**Buscar rimas polissilábicas:**

```bash
# Palavras longas com -ção (político/social)
$ python rimabr_cli.py search marginalização --min-syllables 5

Resultado:
1. criminalização   (6 syl, 0.90)
2. descolonização   (6 syl, 0.85)
3. ressignificação  (6 syl, 0.74)
```

**Vocabulário consciente:**

```bash
$ python rimabr_cli.py search ancestralidade --min-syllables 4

Resultado:
1. criminalidade    (5 syl, 0.82)
2. modernidade      (4 syl, 0.61)
3. identidade       (4 syl, 0.61)
```

### MPB / Bossa Nova

**Buscar proparoxítonas (Chico Buarque style):**

```bash
$ python rimabr_cli.py pattern --stress proparoxítona --limit 20

Resultado:
- última
- música
- lágrima
- máquina
- pássaro
```

### Sertanejo

**Rimas tradicionais -ão:**

```bash
$ python rimabr_cli.py search sertão --ending ão --syllables 2

Resultado:
1. coração
2. paixão
3. solidão
4. canção
```

### Repente / Cordel

**7 sílabas (Martelo Agalopado):**

```bash
$ python rimabr_cli.py pattern --syllables 7 --limit 30

# Ou buscar rimas com contagem específica
$ python rimabr_cli.py search "palavra mãe" --syllables 7
```

---

## 🔍 Recursos Avançados

### 1. Busca Multi-Critério

Combine vários filtros para buscas precisas:

```bash
python rimabr_cli.py search resistência \
    --stress paroxítona \
    --min-syllables 4 \
    --suffix ência \
    --limit 20
```

### 2. Análise Detalhada

Use `--details` para ver o raciocínio do sistema:

```bash
$ python rimabr_cli.py search amor --details

Top 5 - Detailed Analysis:

1. calor (Score: 0.69)
   Good match between 'amor' and 'calor'.
   ✓✓ Tonic vowel match: 'a'
   △ Different tonic consonants: 'm' vs 'c'

   Breakdown:
   - prosodic: 0.25
   - tonic_core: 0.27
   - phonetic: 0.17
   - morphological: 0.0
```

### 3. Busca por Terminação

```bash
# Todas palavras terminadas em "ado"
$ python rimabr_cli.py pattern --ending ado --limit 50

# Terminações longas
$ python rimabr_cli.py pattern --ending mente --limit 30
```

### 4. Estatísticas do Banco

```bash
$ python rimabr_cli.py stats

RimaBR Database Statistics
================================================================================

Total words: 212

By stress type:
  paroxítona       145 words
  oxítona           48 words
  proparoxítona     19 words

Top 10 suffixes:
  1. -ado            14 words
  2. -ar             10 words
  3. -ção             9 words
  4. -dade            9 words
  5. -ência           5 words
```

---

## 📊 Critérios de Pontuação

O sistema calcula scores de 0.00 a 1.00 baseado em:

### Pesos Padrão (contexto "general"):

| Critério | Peso | Descrição |
|----------|------|-----------|
| **Prosódia** | 0.25 | Tipo de acentuação, posição tônica, número de sílabas |
| **Núcleo Tônico** | 0.45 | Vogal e consoante da sílaba tônica (mais importante!) |
| **Fonética** | 0.20 | Sequências de vogais/consoantes, terminações |
| **Morfologia** | 0.10 | Prefixos e sufixos compartilhados |

### Níveis de Correspondência:

| Score | Nível | Uso |
|-------|-------|-----|
| 0.90-1.00 | **Perfect Match** | Rima perfeita, qualquer contexto |
| 0.75-0.89 | **Strong Match** | Rima forte, maioria dos contextos |
| 0.60-0.74 | **Good Match** | Rima boa, funciona em poesia moderna/rap |
| 0.40-0.59 | **Weak Match** | Rima fraca, apenas rap/experimental |
| 0.20-0.39 | **Poor Match** | Correspondência mínima |
| 0.00-0.19 | **No Match** | Sem correspondência |

---

## 💾 Formatos de Lista de Palavras

### Formato Aceito

O sistema aceita arquivos de texto simples:

```
# palavras.txt (uma palavra por linha)
amor
coração
paixão
liberdade
ancestralidade
...
```

### Encoding

Use UTF-8 para caracteres acentuados:

```bash
# Verificar encoding do arquivo
file -i palavras.txt

# Converter se necessário
iconv -f ISO-8859-1 -t UTF-8 palavras.txt > palavras_utf8.txt
```

### Tamanho

O sistema foi testado com:
- ✅ 200+ palavras (demo)
- ✅ ~10,000 palavras (performance boa)
- ⚡ ~100,000+ palavras (usar batch size maior)

```bash
# Para listas muito grandes
python rimabr_cli.py load palavras_completas.txt --batch-size 10000
```

---

## 🗄️ Estrutura do Banco de Dados

### SQLite com Índices Otimizados

O banco usa SQLite3 com índices para buscas rápidas:

```sql
-- Índices criados automaticamente
idx_tonic_vowel      (busca por vogal tônica)
idx_tonic_syllable   (busca por sílaba tônica)
idx_stress_type      (busca por tipo de acentuação)
idx_syllable_count   (busca por número de sílabas)
idx_suffix           (busca por sufixo)
idx_ending_2/3/4     (busca por terminações)
```

### Localização

Por padrão: `data/rimabr.db`

Personalizar:

```bash
python rimabr_cli.py --db meu_banco.db search amor
```

---

## 🎨 Integração com Código

### Python

```python
from src.database.rimabr_db import RimaBRDatabase

# Criar/conectar banco
db = RimaBRDatabase("data/rimabr.db")

# Buscar rimas
results = db.search("amor", limit=10)

for r in results:
    print(f"{r['word']}: {r['score']:.2f}")

# Busca com filtros
results = db.search(
    "ancestralidade",
    filters={
        "stress_type": "paroxítona",
        "min_syllables": 4
    },
    limit=20
)

# Busca por padrão
results = db.search_by_criteria(
    tonic_vowel='a',
    suffix='dade',
    stress_type='paroxítona'
)

# Estatísticas
stats = db.get_stats()
print(f"Total words: {stats['total_words']}")
```

---

## 📝 Dicas e Truques

### 1. Encontrar Rimas para Rap

```bash
# Polissilábicas com -ção
python rimabr_cli.py pattern --suffix ção --min-syllables 5

# Vocabulário político/social
python rimabr_cli.py search marginalização --min-syllables 4
```

### 2. Rimas Tradicionais (Sertanejo/MPB)

```bash
# Paroxítonas com 2-3 sílabas
python rimabr_cli.py search coração --stress paroxítona --max-syllables 3

# Terminações -ão
python rimabr_cli.py pattern --ending ão --syllables 2
```

### 3. Poesia Experimental

```bash
# Proparoxítonas (raras, efeito literário)
python rimabr_cli.py pattern --stress proparoxítona

# Palavras longas
python rimabr_cli.py pattern --min-syllables 6
```

### 4. Encontrar Famílias de Palavras

```bash
# Todas com prefixo "re-"
python rimabr_cli.py pattern --prefix re

# Todas com sufixo "-mente"
python rimabr_cli.py pattern --suffix mente
```

---

## 🔧 Troubleshooting

### Problema: "No rhymes found"

**Solução:**
1. Verificar se o banco foi carregado: `python rimabr_cli.py stats`
2. Tentar sem filtros primeiro
3. Reduzir restrições (remover --stress, aumentar --limit)

### Problema: Busca muito lenta

**Solução:**
1. Database muito grande? Adicionar mais índices
2. Reduzir `--limit`
3. Usar filtros para reduzir espaço de busca

### Problema: Scores muito baixos

**Explicação:**
- O sistema é rigoroso! Scores 0.50-0.70 são aceitáveis em rap/poesia moderna
- Use `--details` para entender por quê
- Considere buscar por padrão específico em vez de score geral

---

## 🚀 Próximos Passos

### Carregar suas listas completas

```bash
# Se você tem palavras.txt e kpalavras.txt
python rimabr_cli.py load palavras.txt
python rimabr_cli.py load kpalavras.txt

# Verificar quantidade
python rimabr_cli.py stats
```

### Experimentar

```bash
# Buscar suas palavras favoritas
python rimabr_cli.py search [sua palavra]

# Explorar padrões
python rimabr_cli.py pattern --tonic-vowel a --limit 100

# Criar listas temáticas
python rimabr_cli.py pattern --suffix dade > rimas_dade.txt
```

---

## 📚 Referências

- Sistema baseado em análise fonética PT-BR
- Critérios adaptados para diferentes gêneros musicais
- Matching multi-dimensional (não apenas sons finais)
- Otimizado para Claude Opus 4.5's reasoning capabilities

---

## ❓ Suporte

Para ajuda adicional:

```bash
# Ajuda geral
python rimabr_cli.py --help

# Ajuda para comando específico
python rimabr_cli.py search --help
python rimabr_cli.py pattern --help
```

---

**Desenvolvido com o sistema de matching fonético reasoning-based para PT-BR** 🇧🇷
