@echo off
for %%I in ("%~dp0.") do set PROJECT_DIR=%%~sI
cd /d "%PROJECT_DIR%"

powershell -NoProfile -Command "Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue"

echo ============================================================
echo  LAN mode - no ngrok needed
echo  Your phone must be on the SAME WiFi as this computer.
echo  Open Expo Go and scan the QR code.
echo ============================================================

npx.cmd expo start --go --clear --port 8081
