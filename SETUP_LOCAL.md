# RimaBR - Guia de Instalação Local

## Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/guitorte/language-play-ptbr.git
cd language-play-ptbr
```

### 2. Instale as dependências
```bash
pip3 install -r webapp/requirements.txt
```

### 3. Gere o banco de dados
```bash
# Carregar o banco de dados completo (320k palavras, ~5-10 minutos)
python3 rimabr_cli.py load data/palavras_completas.txt --batch-size 5000

# OU usar apenas exemplos para teste rápido
python3 rimabr_cli.py load data/palavras_exemplo.txt
```

### 4. Inicie o servidor web
```bash
bash start_webapp.sh

# OU manualmente:
cd webapp
python3 api.py
```

### 5. Acesse no navegador
```
http://localhost:5000
```

## Estatísticas do Banco de Dados Completo

Quando carregado com `palavras_completas.txt`:
- **Total de palavras:** 320,090
- **Paroxítonas:** 207,533 (72.4%)
- **Oxítonas:** 67,198 (23.4%)
- **Proparoxítonas:** 4,014 (1.4%)

## Uso via CLI

```bash
# Buscar rimas
python3 rimabr_cli.py search amor --limit 20

# Buscar com filtros
python3 rimabr_cli.py search solidão --stress paroxítona --details

# Buscar por padrão fonético
python3 rimabr_cli.py pattern --tonic-vowel a --suffix ção

# Ver estatísticas
python3 rimabr_cli.py stats
```

## Requisitos

- Python 3.7+
- Flask 3.0+
- Flask-CORS 4.0+

## Notas

- O arquivo `data/rimabr.db` é gerado localmente (não está no repositório por ser muito grande)
- A primeira carga do banco completo demora 5-10 minutos
- Após carregado, as buscas são instantâneas
- Interface 100% local, sem necessidade de conexão ou API externa
