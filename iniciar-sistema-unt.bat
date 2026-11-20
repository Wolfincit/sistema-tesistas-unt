@echo off
title Sistema de Gestion de Tesistas - Ing. Industrial UNT (Produccion)
cd /d "%~dp0"
echo ===================================================================
echo   UNIVERSIDAD NACIONAL DE TRUJILLO - INGENIERIA INDUSTRIAL
echo   Iniciando Servidor de Produccion en http://localhost:3000
echo ===================================================================
set PORT=3000
set HOST=0.0.0.0
node server/index.mjs
pause
