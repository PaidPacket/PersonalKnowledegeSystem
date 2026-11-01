#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "========================================================"
echo "  Your Notes - Engineering Knowledge Vault Launcher"
echo "========================================================"

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] Node.js and npm are not installed or not in PATH."
  echo "Please install Node.js from https://nodejs.org/ and try again."
  exit 1
fi

if [ ! -f "node_modules/.bin/tsx" ]; then
  echo "[INFO] Installing dependencies..."
  npm install --legacy-peer-deps
fi

(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" >/dev/null 2>&1 || true
  fi
) &

echo "[INFO] Starting development server on http://localhost:3000 ..."
npm run dev
