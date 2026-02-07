#!/bin/bash
clear
echo "==============================================================================="
echo "                      RimaBR - Versão Simplificada"
echo "==============================================================================="
echo ""
echo "Iniciando servidor..."
echo ""
echo "Depois de iniciar, abra no navegador: http://localhost:8000"
echo ""
echo "Pressione Ctrl+C para parar"
echo "==============================================================================="
echo ""

# Tentar encontrar Python
if command -v python3 &> /dev/null; then
    python3 rimabr_simples.py
elif command -v python &> /dev/null; then
    python rimabr_simples.py
elif command -v py &> /dev/null; then
    py rimabr_simples.py
else
    echo "❌ Python não encontrado!"
    echo "Instale Python de: https://www.python.org/downloads/"
    exit 1
fi
