# premium-pipeline.ps1 — the persistent content engine for claritynclex.
# Runs the work in priority order, looping:
#   1. PROMOTE dormant legacy questions (verify + enrich + publish the good ones)
#   2. GENERATE net-new verified questions
# Each step self-exits at its time budget or when its work is exhausted; the loop
# then moves on. gvp-supervisor.ps1 relaunches this whole thing if it ever dies.
# Stop everything:  schtasks /Delete /TN ClarityGVP /F   (then kill node)
$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Chapman\Desktop\ai\chapai'
Set-Location $repo
$tmp = Join-Path $repo '.genverify-tmp'
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Force -Path $tmp | Out-Null }
$env:GVP_DEBUG = '1'
. (Join-Path $repo 'scripts\content-window.ps1')

function Invoke-ContentStep {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [Parameter(Mandatory = $true)]
    [string]$LogStem
  )

  if (-not (Test-ChapaiContentWindow)) { return $false }

  $process = Start-Process -FilePath 'node' `
    -ArgumentList $Arguments `
    -WorkingDirectory $repo `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogStem.out.log" `
    -RedirectStandardError "$LogStem.err.log" `
    -PassThru

  while (-not $process.HasExited) {
    Start-Sleep -Seconds 15
    $process.Refresh()
    if (-not (Test-ChapaiContentWindow)) {
      & taskkill.exe /PID $process.Id /T /F *> $null
      return $false
    }
  }

  return (Test-ChapaiContentWindow)
}

for ($cycle = 0; $cycle -lt 60; $cycle++) {
  if (-not (Test-ChapaiContentWindow)) { break }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  # 0. Upgrade any already-LIVE rows still missing a premium deep rationale
  #    (exits in seconds once none remain).
  if (-not (Invoke-ContentStep -Arguments @('scripts/enrich-deep-rationales.mjs', '--limit=1000', '--minutes=30') -LogStem (Join-Path $tmp "pipe-enrich-$stamp"))) { break }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  # 0.5 Add uniform visual-rationale diagrams + structured rationale to LIVE rows
  #     that still lack them (hardest first = readiness-exam pool). Non-destructive.
  if (-not (Invoke-ContentStep -Arguments @('scripts/enrich-visual-rationales.mjs', '--limit=600', '--minutes=40', '--hardest') -LogStem (Join-Path $tmp "pipe-visual-$stamp"))) { break }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  # 1. Premium case studies FIRST (the marketing gap: 16 -> 50+). Runs
  #    sequentially with the full free-tier budget so verify isn't starved.
  if (-not (Invoke-ContentStep -Arguments @('scripts/generate-case-studies.mjs', '--target=200', '--minutes=90') -LogStem (Join-Path $tmp "pipe-casestudy-$stamp"))) { break }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  # 2. Integrate dormant premium (strict verify gate → only good ones publish).
  if (-not (Invoke-ContentStep -Arguments @('scripts/promote-dormant-questions.mjs', '--limit=4000', '--minutes=180') -LogStem (Join-Path $tmp "pipe-promote-$stamp"))) { break }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  # 3. Generate net-new cross-verified questions.
  if (-not (Invoke-ContentStep -Arguments @('scripts/generate-verify-publish.mjs', '--target=8000', '--minutes=120') -LogStem (Join-Path $tmp "pipe-generate-$stamp"))) { break }
}
