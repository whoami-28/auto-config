#!/usr/bin/env bash
set -e

# Change directory to script directory
cd "$(dirname "$0")"

echo "=============================================================="
echo "           PORSCHE CAR CONFIGURATOR (NODE.JS + SQLITE)        "
echo "=============================================================="
echo ""

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not found in PATH!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[INFO] Detected $(node -v)"

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing npm dependencies..."
    npm install
    echo "[INFO] Dependencies installed successfully."
    echo ""
fi

echo " URL:         http://localhost:3000"
echo " Database:    SQLite (server/data/configurator.db)"
echo " Demo User:   demo (password: porsche123)"
echo " Collection:  postman/Porsche_Configurator_API.postman_collection.json"
echo ""
echo "=============================================================="
echo " Starting server and opening browser..."
echo "=============================================================="
echo ""

# Open browser in background after 2 seconds
(
    sleep 2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:3000"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "http://localhost:3000"
    elif command -v sensible-browser >/dev/null 2>&1; then
        sensible-browser "http://localhost:3000"
    fi
) &

npm start
