# 🎵 RimaBR Web App

Interface web moderna e mobile-responsive para busca de rimas em Português Brasileiro.

**✨ 100% Local - SEM dependência de IA!**

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
pip install -r webapp/requirements.txt
```

### 2. Criar Banco de Dados (se não existir)

```bash
# Opção A: Palavras de exemplo (rápido)
python rimabr_cli.py load data/palavras_exemplo.txt

# Opção B: Lista completa (~320k palavras)
python carregar_palavras_completas.py
```

### 3. Iniciar Servidor

```bash
# Maneira mais fácil
bash start_webapp.sh

# Ou manualmente
cd webapp
python api.py
```

### 4. Acessar

Abra o navegador em: **http://localhost:5000**

---

## 📱 Features

### Interface

- ✅ **Mobile-first responsive** (funciona em celular, tablet, desktop)
- ✅ **Dark mode** (alternância claro/escuro)
- ✅ **Design moderno** (gradientes, animações suaves)
- ✅ **Busca em tempo real**
- ✅ **Filtros avançados**

### Funcionalidades

#### 1. Busca de Rimas

```
Digite: "amor"
Resultado: calor, valor, sabor, etc.
```

#### 2. Filtros Avançados

- **Acentuação**: Oxítona, Paroxítona, Proparoxítona
- **Sílabas**: Mínimo e máximo
- **Sufixo**: -dade, -ção, -ado, etc.
- **Terminação**: -ão, -ente, etc.
- **Limite**: Quantidade de resultados

#### 3. Filtros Rápidos por Gênero

- 🎤 **Rap/Hip-Hop**: Min 4 sílabas (polissilábicas)
- 🎸 **Sertanejo**: Paroxítonas 2-3 sílabas
- 🎵 **MPB**: Foco em qualidade
- 🎻 **Repente**: Exatamente 7 sílabas (Martelo)

#### 4. Resultados Detalhados

Cada resultado mostra:
- **Score** (0-100): Qualidade da rima
- **Nível**: Perfeita, Forte, Boa, Fraca
- **Características**: Acentuação, sílabas, tônica
- **Explicação**: Por que funciona

#### 5. Estatísticas

Visualize:
- Total de palavras no banco
- Distribuição por acentuação
- Contagem por tipo

---

## 🎨 Screenshots

### Desktop

```
┌─────────────────────────────────────────────────┐
│  🎵 RimaBR                              🌙      │
│  Buscador de Rimas para Português Brasileiro   │
├─────────────────────────────────────────────────┤
│  [ Digite uma palavra...        ] [ Buscar ]    │
│  ⚙️ Filtros Avançados                           │
│  Rápido: [Rap] [Sertanejo] [MPB] [Repente]     │
├─────────────────────────────────────────────────┤
│  Rimas para "amor" - 10 resultados              │
│  ┌───────────────────────────────────────────┐  │
│  │ #1 calor                            69    │  │
│  │ paroxítona • 1 sílaba • tônica: "ca"      │  │
│  │ Good match: tonic vowel 'a'               │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Mobile

```
┌──────────────────┐
│ 🎵 RimaBR    🌙 │
├──────────────────┤
│ [ amor...     ]  │
│ [ Buscar      ]  │
├──────────────────┤
│ ⚙️ Filtros       │
├──────────────────┤
│ #1 calor    [69] │
│ paroxítona • 1   │
│ Good match       │
├──────────────────┤
│ #2 valor    [69] │
│ ...              │
└──────────────────┘
```

---

## 🔧 Arquitetura

### Backend (Flask API)

```
webapp/api.py
  ├── GET  /                    → Serve HTML
  ├── POST /api/search          → Buscar rimas
  ├── POST /api/pattern         → Buscar por padrão
  ├── POST /api/analyze         → Analisar palavra
  └── GET  /api/stats           → Estatísticas
```

### Frontend (Vanilla JS)

```
webapp/
  ├── templates/index.html      → Interface
  ├── static/css/style.css      → Estilos responsivos
  └── static/js/app.js          → Lógica (sem frameworks)
```

**Sem dependências pesadas:**
- ❌ Sem React/Vue/Angular
- ❌ Sem jQuery
- ❌ Sem IA/API externa
- ✅ Apenas HTML/CSS/JS puro
- ✅ 100% local

---

## 📊 API Endpoints

### POST /api/search

Buscar rimas para uma palavra.

**Request:**
```json
{
  "word": "amor",
  "filters": {
    "stress_type": "paroxítona",
    "min_syllables": 2,
    "max_syllables": 4,
    "suffix": "ado"
  },
  "limit": 50
}
```

**Response:**
```json
{
  "query": "amor",
  "count": 10,
  "results": [
    {
      "word": "calor",
      "score": 0.69,
      "level": "good_match",
      "features": {
        "stress_type": "oxítona",
        "syllable_count": 1,
        "tonic_syllable": "lor"
      },
      "explanation": "Good match: tonic vowel 'a'",
      "breakdown": {
        "prosodic": 0.25,
        "tonic_core": 0.27,
        "phonetic": 0.17
      }
    }
  ]
}
```

### POST /api/pattern

Buscar por padrão fonético.

**Request:**
```json
{
  "tonic_vowel": "a",
  "stress_type": "paroxítona",
  "syllables": 3,
  "suffix": "dade",
  "limit": 50
}
```

### GET /api/stats

Estatísticas do banco.

**Response:**
```json
{
  "total_words": 212,
  "by_stress_type": {
    "oxítona": 48,
    "paroxítona": 145,
    "proparoxítona": 19
  },
  "by_syllable_count": {
    "1": 25,
    "2": 68,
    "3": 89
  },
  "top_suffixes": {
    "ado": 14,
    "ar": 10,
    "ção": 9
  }
}
```

---

## 🎯 Casos de Uso

### Compositor de Rap

1. Digite: "marginalização"
2. Ative filtro "Rap/Hip-Hop" (min 4 sílabas)
3. Receba: criminalização, descolonização, etc.

### Compositor de Sertanejo

1. Digite: "coração"
2. Ative filtro "Sertanejo" (paroxítonas 2-3 sílabas)
3. Receba: paixão, solidão, canção, etc.

### Poeta

1. Digite: "liberdade"
2. Filtro: sufixo "dade"
3. Receba: verdade, felicidade, vontade, etc.

### Repentista

1. Digite: "sertão"
2. Ative filtro "Repente" (7 sílabas)
3. Receba palavras com métrica exata

---

## 💻 Desenvolvimento

### Estrutura

```
webapp/
├── api.py                  # Flask backend
├── requirements.txt        # Dependências
├── templates/
│   └── index.html         # Interface HTML
├── static/
│   ├── css/
│   │   └── style.css      # Estilos responsivos
│   └── js/
│       └── app.js         # JavaScript vanilla
└── README.md              # Este arquivo
```

### Adicionar Features

**Novo endpoint:**

```python
@app.route('/api/meu-endpoint', methods=['POST'])
def meu_endpoint():
    data = request.get_json()
    # Sua lógica aqui
    return jsonify({"result": "..."})
```

**Novo filtro no frontend:**

```javascript
// Em app.js
function meuFiltro() {
    // Sua lógica
}
```

---

## 🚢 Deploy

### Opção 1: Local (Desenvolvimento)

```bash
bash start_webapp.sh
# Acesse: http://localhost:5000
```

### Opção 2: Produção (Gunicorn)

```bash
pip install gunicorn
cd webapp
gunicorn -w 4 -b 0.0.0.0:5000 api:app
```

### Opção 3: Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r webapp/requirements.txt
EXPOSE 5000
CMD ["python", "webapp/api.py"]
```

```bash
docker build -t rimabr .
docker run -p 5000:5000 rimabr
```

### Opção 4: Heroku/Railway/Render

Adicione `Procfile`:

```
web: gunicorn -w 4 webapp.api:app
```

---

## 🎨 Personalização

### Cores

Edite `static/css/style.css`:

```css
:root {
    --primary-color: #2563eb;  /* Azul */
    --secondary-color: #10b981; /* Verde */
    /* ... */
}
```

### Dark Mode

Já incluído! Botão no canto superior direito.

### Logos

Substitua os emojis no `index.html`:

```html
<h1>🎵 RimaBR</h1>
<!-- Para -->
<h1><img src="logo.png"> RimaBR</h1>
```

---

## 📱 Mobile Features

- ✅ **Touch-friendly**: Botões grandes, fácil de tocar
- ✅ **Swipe-friendly**: Scroll suave
- ✅ **Responsive grid**: Adapta a diferentes telas
- ✅ **Hamburger menu**: (se adicionar navegação)
- ✅ **PWA-ready**: Adicione manifest.json para instalar como app

### Fazer PWA (Progressive Web App)

Adicione `manifest.json`:

```json
{
  "name": "RimaBR",
  "short_name": "RimaBR",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/static/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Problema: Porta 5000 ocupada

**Solução:** Mude a porta em `api.py`:

```python
app.run(debug=True, host='0.0.0.0', port=8000)
```

### Problema: Database not found

**Solução:**

```bash
python rimabr_cli.py load data/palavras_exemplo.txt
```

### Problema: CORS errors

Já está configurado com Flask-CORS. Se persistir:

```python
CORS(app, origins=["http://localhost:3000"])
```

---

## 📚 Recursos

- **Backend**: Flask (micro-framework Python)
- **Frontend**: Vanilla JS (sem frameworks)
- **Banco**: SQLite (embutido)
- **Estilo**: CSS moderno (Grid, Flexbox)

---

## 🎉 Pronto!

Você agora tem uma **interface web completa** para o RimaBR:

✅ Mobile-responsive
✅ Dark mode
✅ Sem dependência de IA
✅ 100% local
✅ Rápido e eficiente

**Enjoy! 🇧🇷🎵**
