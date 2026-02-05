# 🚀 Início Rápido - Windows

## Problema: "Python não foi encontrado"

### ✅ Solução 1: Use `py` (recomendado)

No Git Bash, execute:

```bash
# 1. Volte para o diretório principal
cd ~/language-play-ptbr

# 2. Teste se 'py' funciona
py --version

# 3. Se funcionou, use 'py' para todos os comandos:
py rimabr_cli.py load data/palavras_completas.txt --batch-size 5000
py rimabr_cli.py search amor --limit 20
py rimabr_cli.py stats
```

### ✅ Solução 2: Use o script helper

```bash
# 1. Volte para o diretório principal
cd ~/language-play-ptbr

# 2. Use o script que encontra Python automaticamente
bash run_cli.sh rimabr_cli.py stats
bash run_cli.sh rimabr_cli.py search amor --limit 20
```

### ✅ Solução 3: Adicione Python ao PATH

1. Abra "Configurações do Windows"
2. Pesquise "Variáveis de Ambiente"
3. Em "Variáveis do Sistema", encontre "Path"
4. Adicione: `C:\Users\usuario\AppData\Local\Programs\Python\Python311`
5. Adicione: `C:\Users\usuario\AppData\Local\Programs\Python\Python311\Scripts`
6. Reinicie o Git Bash

### ✅ Solução 4: Use CMD em vez de Git Bash

Abra o **CMD** (Prompt de Comando) do Windows:

```cmd
cd C:\Users\usuario\language-play-ptbr
py rimabr_cli.py stats
```

## 🎯 Comandos Rápidos (use `py` no lugar de `python`)

```bash
# Gerar banco de dados
py rimabr_cli.py load data/palavras_completas.txt --batch-size 5000

# Buscar rimas
py rimabr_cli.py search amor --limit 20
py rimabr_cli.py search solidão --stress paroxítona

# Ver estatísticas
py rimabr_cli.py stats

# Iniciar servidor web
cd webapp
py api.py
```

## 📝 Nota

O Windows tem diferentes formas de chamar Python:
- `py` - Python Launcher (mais comum no Windows)
- `python` - Se adicionado ao PATH manualmente
- `python3` - Menos comum no Windows
- Caminho completo - Sempre funciona

**Recomendação:** Use `py` que é o padrão do Windows.
