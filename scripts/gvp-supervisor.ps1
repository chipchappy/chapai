# gvp-supervisor.ps1 — keeps the claritynclex content pipeline alive.
# Run on a schedule (ClarityGVP task, every 15 min). If no pipeline component is
# running, it (re)launches premium-pipeline.ps1 (promote dormant → generate new,
# looping). Safe to run anytime — it never double-launches.
# Stop persistence with:  schtasks /Delete /TN ClarityGVP /F
$ErrorActionPreference = 'SilentlyContinue'
$repo = 'C:\Users\Chapman\Desktop\ai\chapai'
. (Join-Path $repo 'scripts\content-window.ps1')

if (-not (Test-ChapaiContentWindow)) { exit 0 }

# Any pipeline component already working? (node steps or the wrapper itself)
$markers = 'promote-dormant-questions', 'generate-verify-publish', 'enrich-deep-rationales', 'premium-pipeline.ps1'
$busy = Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='powershell.exe' OR Name='pwsh.exe'" |
  Where-Object { $cl = $_.CommandLine; $markers | Where-Object { $cl -like "*$_*" } }
if ($busy) { exit 0 }

$tmp = Join-Path $repo '.genverify-tmp'
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Force -Path $tmp | Out-Null }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Start-Process -FilePath 'powershell' `
  -ArgumentList '-NoProfile', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $repo 'scripts\premium-pipeline.ps1') `
  -WorkingDirectory $repo `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $tmp "supervisor-$stamp.out.log") `
  -RedirectStandardError  (Join-Path $tmp "supervisor-$stamp.err.log")
