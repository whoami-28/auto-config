@echo off
setlocal
chcp 65001 >nul
title Porsche Car Configurator Server

cd /d "%~dp0"

echo ==============================================================
echo            PORSCHE CAR CONFIGURATOR (NODE.JS + SQLITE)
echo ==============================================================
echo.

node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [INFO] Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
    echo.
)

echo  URL:         http://localhost:3000
echo  Database:    SQLite (server/data/configurator.db)
echo  Demo User:   demo (password: porsche123)
echo  Collection:  postman/Porsche_Configurator_API.postman_collection.json
echo.
echo ==============================================================
echo  Starting server and opening browser...
echo ==============================================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

call npm start
if errorlevel 1 (
    echo.
    echo [INFO] Server stopped.
    pause
)
