@echo off
setlocal
set CHAPAI_PORT=8787
powershell -NoProfile -WindowStyle Hidden -File "C:\Users\Chapman\Desktop\ai\chapai\scripts\start-prod-from-legacy-env.ps1"
endlocal
