# RimaBR - Guia de Instalação para Windows

## 🪟 Instalação Rápida no Windows

### Pré-requisitos
- Python 3.7+ instalado
- Git Bash ou CMD

### Passos de Instalação

Você já está no repositório! Agora siga:

#### 1. Confirme que está no diretório correto
```bash
pwd
# Deve mostrar: ~/language-play-ptbr
```

#### 2. Instale as dependências Python
```bash
pip install Flask Flask-CORS
```

#### 3. Gere o banco de dados (5-10 minutos)
```bash
python rimabr_cli.py load data/palavras_completas.txt --batch-size 5000
```

Você verá o progresso:
```
Indexed 5000 words... (skipped: 0)
Indexed 10000 words... (skipped: 0)
...
Total indexed: 320090
```

#### 4. Inicie o servidor web

**Opção A - Script automático (CMD):**
```cmd
start_webapp_windows.bat
```

**Opção B - Manual (Git Bash ou CMD):**
```bash
cd webapp
python api.py
```

#### 5. Abra no navegador
```
http://localhost:5000
```

## 🎯 Uso via Linha de Comando

```bash
# Buscar rimas para "amor"
python rimabr_cli.py search amor --limit 20

# Buscar com filtros específicos
python rimabr_cli.py search solidão --stress paroxítona --details

# Buscar por padrão fonético
python rimabr_cli.py pattern --tonic-vowel a --suffix ção

# Ver estatísticas do banco
python rimabr_cli.py stats
```

## ❓ Problemas Comuns

### "Python não foi encontrado"
- Instale Python 3.7+ do site oficial: https://www.python.org/downloads/
- Durante instalação, marque "Add Python to PATH"

### "ModuleNotFoundError: No module named 'flask'"
```bash
pip install Flask Flask-CORS
```

### "No such file or directory: data/rimabr.db"
- Execute o comando de geração do banco de dados (passo 3)

### Porta 5000 já em uso
- Algum outro programa está usando a porta
- Finalize o outro programa ou edite `webapp/api.py` para usar outra porta

## 📊 O que esperar

Após gerar o banco completo:
- **320.090 palavras** indexadas
- **Buscas instantâneas** (< 1 segundo)
- **Interface responsiva** funcionando no navegador
- **100% offline** - sem necessidade de internet

## 🚀 Próximos Passos

Depois que o servidor estiver rodando:
1. Abra http://localhost:5000 no navegador
2. Digite uma palavra (ex: "amor", "paixão", "liberdade")
3. Explore os filtros e opções de gênero
4. Ative o modo escuro (botão 🌙)
