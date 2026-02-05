@echo off
echo ===============================================================================
echo                      RimaBR Web App - Windows
echo ===============================================================================
echo.

REM Check if database exists
if not exist "data\rimabr.db" (
    echo Database nao encontrado. Gerando banco de dados...
    echo Isso pode demorar 5-10 minutos...
    echo.
    python rimabr_cli.py load data\palavras_completas.txt --batch-size 5000
    echo.
    echo Banco de dados criado!
    echo.
)

echo Iniciando servidor web...
echo.
echo Acesse: http://localhost:5000
echo.
echo Pressione Ctrl+C para parar
echo ===============================================================================
echo.

cd webapp
python api.py
