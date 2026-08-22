@echo off
title PdfFlow Launcher
cd /d "%~dp0"

echo Starting PdfFlow backend (port 5000)...
start "PdfFlow API" cmd /k "cd /d "%~dp0server" && node index.js"

timeout /t 2 /nobreak >nul

echo Starting PdfFlow frontend (port 3000)...
start "PdfFlow Web" cmd /k "cd /d "%~dp0client" && npm run dev"

timeout /t 5 /nobreak >nul

echo Opening http://localhost:3000
start http://localhost:3000

echo.
echo PdfFlow is starting. Keep BOTH terminal windows open.
echo   - API server:  http://localhost:5000
echo   - Website:     http://localhost:3000
pause
