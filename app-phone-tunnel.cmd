@echo off
for %%I in ("%~dp0.") do set PROJECT_DIR=%%~sI
cd /d "%PROJECT_DIR%"

echo Stopping any existing ngrok processes...
powershell -NoProfile -Command "Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 800"

set PORT=
for /f %%p in ('powershell -NoProfile -Command "$used = @{}; netstat -ano -p tcp | Select-String '^\s*TCP\s+\S+:(\d+)\s+' | ForEach-Object { $used[[int]$_.Matches[0].Groups[1].Value] = $true }; foreach ($p in 8081..8100) { if (-not $used.ContainsKey($p)) { Write-Output $p; break } }"') do set PORT=%%p

if "%PORT%"=="" (
  echo Could not find a free Expo port between 8081 and 8100.
  exit /b 1
)

echo Starting Expo for phone on port %PORT%...
echo Using tunnel mode...
echo Keep this window open after the QR code appears.
npx.cmd expo start --tunnel --go --clear --port %PORT%
