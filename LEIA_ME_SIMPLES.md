# 🚀 RimaBR - Versão SUPER SIMPLES

## ⚡ Como Usar (2 Passos)

### Passo 1: Baixe o código atualizado
```bash
git pull
```

### Passo 2: Inicie o servidor

**No Windows (CMD ou PowerShell):**
```
INICIAR.bat
```

**No Git Bash (Windows/Mac/Linux):**
```bash
bash iniciar.sh
```

**Ou direto (qualquer sistema):**
```bash
python rimabr_simples.py
```

### Passo 3: Abra no navegador
```
http://localhost:8000
```

---

## ✨ O que você vai ver:

- 📊 **Estatísticas** do banco (total de palavras, oxítonas, etc)
- 🔍 **Campo de busca** grande e bonito
- 🎛️ **Filtros** simples (tipo de acentuação, número de sílabas)
- 📋 **Resultados** com score colorido (verde = forte, amarelo = bom, vermelho = fraco)

---

## 🎯 Exemplo de uso:

1. Digite: **amor**
2. Clique em "Buscar"
3. Veja as rimas ordenadas por qualidade (score de 0-100)

---

## 🔧 Se der erro de banco de dados:

O sistema precisa do banco de dados gerado. Execute:

```bash
python rimabr_cli.py load data/palavras_completas.txt --batch-size 5000
```

Isso vai demorar 5-10 minutos mas só precisa fazer **uma vez**.

---

## 📱 Funciona em:

- ✅ Windows (CMD, PowerShell, Git Bash)
- ✅ Mac
- ✅ Linux
- ✅ Qualquer navegador moderno
- ✅ Mobile (acesse do celular usando o IP do seu PC)

---

## 💡 Dicas:

- **Pressione Enter** no campo de busca para pesquisar mais rápido
- **Use os checkboxes** para filtrar por tipo de acentuação
- **Ajuste o limite** de resultados (padrão: 30)
- O servidor **não precisa de internet** - 100% local!

---

## ❌ Para parar o servidor:

Pressione **Ctrl+C** no terminal

---

## 🎵 Recursos:

- Interface bonita com gradiente roxo
- Busca instantânea (< 1 segundo)
- Score colorido visual (verde/amarelo/vermelho)
- Filtros por tipo de acentuação
- Filtros por número de sílabas
- Estatísticas em tempo real
- 100% Python puro (sem dependências complexas)
- Roda em localhost (seguro e privado)

---

**Pronto! É só isso. Dois comandos e você está usando. 🎉**
