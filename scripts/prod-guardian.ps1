# prod-guardian.ps1 — self-healing production guardian for claritynclex.com.
#
# Runs every few minutes. Fetches the live site and checks a FUNCTIONAL health
# fingerprint (the exact things a rogue/old-build deploy breaks): /pricing must be
# 200, and the homepage must carry the "Study now" nav + the sand --c-bg token.
# If prod is confirmed broken on TWO consecutive checks, it auto-rolls-back to the
# stable gate's recorded last-good version. Healthy gate deploys always pass this
# check, so the guardian never fights a legitimate deploy — it only heals breakage.
#
# Install (one time):
#   schtasks /Create /TN "Clarity Prod Guardian" /SC MINUTE /MO 7 /RL LIMITED ^
#     /TR "powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai-p0.1-rewrite-distractors\scripts\prod-guardian.ps1"

$ErrorActionPreference = 'Continue'
$stable = 'C:\Users\Chapman\Desktop\ai\chapai-p0.1-rewrite-distractors'
$stateDir = Join-Path $env:LOCALAPPDATA 'ChappiAi'
if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Force -Path $stateDir | Out-Null }
$strikeFile = Join-Path $stateDir 'prod-guardian-strike.txt'
$logFile = Join-Path $stateDir 'prod-guardian.log'
function Log($m) { Add-Content -Path $logFile -Value ("{0}  {1}" -f (Get-Date -Format o), $m) }

# 1. Functional health probe (a real network error is NOT treated as broken —
#    only a successful response that is missing the fingerprint counts).
$broken = $false
$detail = ''
try {
  $home = Invoke-WebRequest -Uri ("https://claritynclex.com/?g={0}" -f (Get-Random)) -UseBasicParsing -TimeoutSec 25
  $pricing = 0
  try { $pricing = (Invoke-WebRequest -Uri 'https://claritynclex.com/pricing' -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0).StatusCode }
  catch { $pricing = [int]$_.Exception.Response.StatusCode.value__ }
  $hasNav = $home.Content -match '>Study now<'
  $hasBg = $home.Content -match '--c-bg'
  if (($pricing -ne 200) -or (-not $hasNav) -or (-not $hasBg)) {
    $broken = $true
    $detail = "pricing=$pricing nav=$hasNav bg=$hasBg"
  }
} catch {
  # Network/transient error — do not act. Clear nothing; just exit.
  exit 0
}

if (-not $broken) {
  if (Test-Path $strikeFile) { Remove-Item $strikeFile -Force -ErrorAction SilentlyContinue }
  exit 0
}

# 2. Two-strike guard: require the breakage to persist across two runs so a
#    mid-deploy blip never triggers a rollback.
$priorStrike = (Test-Path $strikeFile)
if (-not $priorStrike) {
  Set-Content -Path $strikeFile -Value $detail
  Log "STRIKE 1 (broken: $detail) — will restore on next confirmation"
  exit 0
}

# 3. Confirmed broken twice → restore to the stable gate's last-good version.
$lastGood = ''
try { $lastGood = (Get-Content (Join-Path $stable 'scripts\.last-good-version') -Raw).Trim() } catch {}
if (-not $lastGood) { Log "BROKEN ($detail) but no last-good-version recorded — cannot auto-restore"; exit 1 }

$env:CLOUDFLARE_API_TOKEN = $null
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
Set-Location (Join-Path $stable 'apps\web')
Log "CONFIRMED BROKEN ($detail) - rolling back to last-good $lastGood"
$rbLog = Join-Path $stateDir 'prod-guardian-rollback.log'
npx wrangler rollback $lastGood --name chapai-web --message 'prod-guardian auto-restore (broken build detected)' -y 2>&1 | Out-File -FilePath $rbLog -Encoding utf8
Log "RESTORE issued for $lastGood"
Remove-Item $strikeFile -Force -ErrorAction SilentlyContinue
