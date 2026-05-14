@echo off
for %%I in ("%~dp0.") do set PROJECT_DIR=%%~sI
cd /d "%PROJECT_DIR%"
set PORT=
for /f %%p in ('powershell -NoProfile -Command "$ports = 8081..8100; foreach ($p in $ports) { try { $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p); $listener.Start(); $listener.Stop(); Write-Output $p; break } catch { } }"') do set PORT=%%p

if "%PORT%"=="" (
  echo Could not find a free Expo port between 8081 and 8100.
  exit /b 1
)

echo Starting Expo on port %PORT%...
npx.cmd expo start --port %PORT%
