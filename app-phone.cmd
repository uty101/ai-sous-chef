@echo off
for %%I in ("%~dp0.") do set PROJECT_DIR=%%~sI
cd /d "%PROJECT_DIR%"

rem Get IP specifically from the Wi-Fi adapter (avoids VPN/VM adapters)
set LOCAL_IP=
for /f %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress"') do (
  set LOCAL_IP=%%a
)

rem Fallback: grab first non-loopback IPv4 if Wi-Fi alias not found
if "%LOCAL_IP%"=="" (
  for /f %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1).IPAddress"') do (
    set LOCAL_IP=%%a
  )
)

if "%LOCAL_IP%"=="" (
  echo Could not find your Wi-Fi IPv4 address automatically.
  echo Make sure your laptop is connected to Wi-Fi, then try again.
  exit /b 1
)

set PORT=
for /f %%p in ('powershell -NoProfile -Command "$used = @{}; netstat -ano -p tcp | Select-String '^\s*TCP\s+\S+:(\d+)\s+' | ForEach-Object { $used[[int]$_.Matches[0].Groups[1].Value] = $true }; foreach ($p in 8081..8100) { if (-not $used.ContainsKey($p)) { Write-Output $p; break } }"') do set PORT=%%p

if "%PORT%"=="" (
  echo Could not find a free Expo port between 8081 and 8100.
  exit /b 1
)

echo Starting Expo for phone on port %PORT%...
echo Using LAN mode at %LOCAL_IP%.
echo.
echo If the QR scan fails, open Expo Go and manually enter:
echo   exp://%LOCAL_IP%:%PORT%
echo.
set REACT_NATIVE_PACKAGER_HOSTNAME=%LOCAL_IP%
npx.cmd expo start --lan --go --clear --port %PORT%
