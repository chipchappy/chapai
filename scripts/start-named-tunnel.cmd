@echo off
setlocal
if not exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
  echo cloudflared not found at C:\Program Files (x86)\cloudflared\cloudflared.exe
  exit /b 1
)
if not exist "%USERPROFILE%\.cloudflared\ccrn-live-config.yml" (
  echo named tunnel config missing at %USERPROFILE%\.cloudflared\ccrn-live-config.yml
  exit /b 1
)
"C:\Program Files (x86)\cloudflared\cloudflared.exe" --config "%USERPROFILE%\.cloudflared\ccrn-live-config.yml" tunnel run 46ef0967-62ab-4f4f-a766-41fb93b4a3fe
endlocal
