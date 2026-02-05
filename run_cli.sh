#!/bin/bash
# Helper script for Windows users to run Python commands

# Try to find Python executable
if command -v py &> /dev/null; then
    PYTHON_CMD="py"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif [ -f "/c/Users/usuario/AppData/Local/Programs/Python/Python311/python.exe" ]; then
    PYTHON_CMD="/c/Users/usuario/AppData/Local/Programs/Python/Python311/python.exe"
else
    echo "❌ Python não encontrado!"
    echo "Instale Python de: https://www.python.org/downloads/"
    exit 1
fi

echo "Using Python: $PYTHON_CMD"
$PYTHON_CMD "$@"
