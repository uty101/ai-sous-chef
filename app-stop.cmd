@echo off
echo Closing old Expo/Metro servers on ports 8081-8100...

for /f "tokens=5" %%P in ('netstat -ano -p tcp ^| findstr /R /C:":808[1-9] " /C:":809[0-9] " /C:":8100 "') do (
  echo Stopping process %%P
  taskkill /PID %%P /T /F >nul 2>nul
)

echo Done. You can now run app-phone-tunnel.cmd again.
