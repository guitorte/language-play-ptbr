# 🚀 RimaBR no Google Colab - Início Instantâneo

## ⚡ Abrir e Executar (1 clique!)

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/guitorte/language-play-ptbr/blob/claude/analyze-word-syllables-zn3b8/RimaBR_Colab.ipynb)

**👆 Clique no botão acima para abrir o notebook no Google Colab**

## 📋 O que você vai poder fazer:

- ✅ **Sem instalação** - tudo roda na nuvem do Google
- ✅ **Gratuito** - não precisa pagar nada
- ✅ **Rápido** - 5 minutos de setup
- ✅ **Completo** - 320k palavras em português
- ✅ **Interface visual** - tabelas bonitas com pandas
- ✅ **Opcional:** Interface web via ngrok

## 🎯 Como usar:

1. Clique no botão "Open in Colab" acima
2. Execute as células em ordem (Shift + Enter)
3. Aguarde a geração do banco de dados (~5-10 min)
4. Comece a buscar rimas!

## 💡 Exemplos de uso no notebook:

```python
# Buscar rimas para "amor"
buscar_rimas('amor', limite=20)

# Buscar rimas para "solidão" (apenas paroxítonas)
buscar_rimas('solidão', limite=30, filtros={'stress_type': 'paroxítona'})

# Buscar por padrão fonético
buscar_por_padrao({'stress_type': 'oxítona', 'tonic_vowel': 'a'})
```

## 📊 O que o sistema faz:

- Analisa **sílabas**, **tonicidade**, **vogais** e **consoantes**
- Calcula **score de 0-100** para cada rima
- Explica **por que** duas palavras rimam ou não
- Filtra por **tipo de stress**, **número de sílabas**, **terminações**
- Suporta contextos de **gêneros musicais** (Rap, Sertanejo, MPB, Repente)

## 🎵 Perfeito para:

- Compositores de música
- Poetas
- Escritores de letras (Rap, Hip-Hop, Sertanejo, MPB)
- Estudantes de linguística
- Qualquer pessoa que goste de rimas!

## 📱 Funciona em:

- Computador
- Tablet
- Celular (via Google Colab app)

---

**Problemas com instalação local no Windows?**
Use o Colab! É muito mais fácil e rápido. 🚀
