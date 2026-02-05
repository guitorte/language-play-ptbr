#!/bin/bash
# Start RimaBR Web App

echo "═══════════════════════════════════════════════════════════════════════"
echo "                     RimaBR Web App - Inicialização"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Check if database exists
if [ ! -f "data/rimabr.db" ]; then
    echo "⚠️  Banco de dados não encontrado!"
    echo ""
    echo "Criando banco com palavras de exemplo..."
    python3 rimabr_cli.py load data/palavras_exemplo.txt
    echo ""
fi

# Install dependencies
echo "📦 Instalando dependências..."
pip3 install -q -r webapp/requirements.txt

echo ""
echo "🚀 Iniciando servidor web..."
echo ""
echo "Acesse: http://localhost:5000"
echo ""
echo "Pressione Ctrl+C para parar"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Start server
cd webapp && python3 api.py
