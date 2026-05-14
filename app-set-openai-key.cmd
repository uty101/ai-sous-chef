@echo off
setlocal
cd /d "%~dp0"
C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0app-set-openai-key.ps1"
