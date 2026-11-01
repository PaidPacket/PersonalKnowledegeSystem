@echo off
setlocal
title Your Notes - Engineering Knowledge Vault (http://localhost:3000)

cd /d "%~dp0"

echo ========================================================
echo   Your Notes - Engineering Knowledge Vault Launcher
echo ========================================================
echo.

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js and npm were not found in your PATH.
    echo Please install Node.js LTS from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing dependencies for first-time setup...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [INFO] Opening http://localhost:3000 in your default browser...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

echo [INFO] Starting development server (npm run dev)...
call npm run dev

pause
