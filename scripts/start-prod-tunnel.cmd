@echo off
setlocal
start "ChapAI Prod" powershell -NoProfile -File "C:\Users\Chapman\Desktop\ai\chapai\scripts\start-prod-from-legacy-env.ps1"
timeout /t 8 /nobreak >nul
if exist "%USERPROFILE%\.cloudflared\ccrn-live-config.yml" (
  "C:\Program Files (x86)\cloudflared\cloudflared.exe" --config "%USERPROFILE%\.cloudflared\ccrn-live-config.yml" tunnel run 46ef0967-62ab-4f4f-a766-41fb93b4a3fe
) else (
  "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3001 --no-autoupdate
)
endlocal
