@echo off
setlocal
if not exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
  echo cloudflared not found at C:\Program Files (x86)\cloudflared\cloudflared.exe
  exit /b 1
)
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:3001 --no-autoupdate
endlocal
