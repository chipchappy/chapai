$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$chapaiRoot = Split-Path -Parent $scriptRoot
$gamingSentinel = Join-Path $env:LOCALAPPDATA "ChappiAi\gaming-mode.enabled"
. (Join-Path $scriptRoot "content-window.ps1")

function Test-FreshGamingMode {
  if (-not (Test-Path -LiteralPath $gamingSentinel)) {
    return $false
  }

  $maxHours = 12
  if ($env:CHAPAI_GAMING_MODE_MAX_HOURS) {
    try { $maxHours = [double]$env:CHAPAI_GAMING_MODE_MAX_HOURS } catch { $maxHours = 12 }
  }

  $sentinelItem = Get-Item -LiteralPath $gamingSentinel -ErrorAction SilentlyContinue
  $startedAt = if ($sentinelItem) { $sentinelItem.LastWriteTime } else { Get-Date }
  try {
    $raw = Get-Content -LiteralPath $gamingSentinel -Raw -ErrorAction Stop
    $match = [regex]::Match($raw, "\d{4}-\d{2}-\d{2}T[^\s]+")
    if ($match.Success) { $startedAt = Get-Date $match.Value }
  } catch {
  }

  if (((Get-Date) - $startedAt).TotalHours -le $maxHours) {
    return $true
  }

  $expiredPath = "$gamingSentinel.expired.$((Get-Date).ToString('yyyyMMddHHmmss'))"
  Move-Item -LiteralPath $gamingSentinel -Destination $expiredPath -Force -ErrorAction SilentlyContinue
  return $false
}

if (Test-FreshGamingMode) {
  return
}
if (-not (Test-ChapaiContentWindow)) {
  return
}
$legacyRoot = "C:\Users\Chapman\Desktop\ai\ccrn-agent"
$execRoute = Join-Path $legacyRoot "remote-control\scripts\exec_route.py"
$statePath = Join-Path $chapaiRoot "config\content-engine-state.json"
$promotedDir = Join-Path $chapaiRoot "packages\content\staging\promoted"

function Write-Utf8Json([string]$Path, $Object, [int]$Depth = 8) {
  $json = $Object | ConvertTo-Json -Depth $Depth
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $json, $utf8NoBom)
}

function Invoke-ExecRoute([string]$route) {
  try {
    $output = & py $execRoute $route 2>&1 | Out-String
    return [pscustomobject]@{
      route = $route
      ok = $LASTEXITCODE -eq 0
      output = $output.Trim()
      ranAt = (Get-Date).ToString("o")
    }
  } catch {
    return [pscustomobject]@{
      route = $route
      ok = $false
      output = ($_ | Out-String).Trim()
      ranAt = (Get-Date).ToString("o")
    }
  }
}

function Get-LatestPromotedBatchInfo() {
  if (-not (Test-Path $promotedDir)) {
    return $null
  }

  $latest = Get-ChildItem -Path $promotedDir -Filter "mixed-batch-*.json" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $latest) {
    return $null
  }

  return [pscustomobject]@{
    file = $latest.Name
    lastWriteTime = $latest.LastWriteTime.ToString("o")
    ageMinutes = [math]::Round(((Get-Date) - $latest.LastWriteTime).TotalMinutes, 1)
  }
}

$state = [ordered]@{
  lane = "content-engine"
  startedAt = (Get-Date).ToString("o")
}

$batchStatus = Invoke-ExecRoute "batch-status"
$latestPromoted = Get-LatestPromotedBatchInfo
$runWorkerCycle = $false
$reason = "batch fresh"

if (-not $latestPromoted) {
  $runWorkerCycle = $true
  $reason = "no promoted batch"
} elseif ($latestPromoted.ageMinutes -ge 20) {
  $runWorkerCycle = $true
  $reason = "batch older than 20 minutes"
}

if ($batchStatus.output -match "failed") {
  $runWorkerCycle = $true
  $reason = "batch-status failure"
}

$workerCycle = $null
if ($runWorkerCycle) {
  $workerCycle = Invoke-ExecRoute "worker-cycle"
  $latestPromoted = Get-LatestPromotedBatchInfo
}

$state.status = if ($workerCycle -and -not $workerCycle.ok) { "blocked" } elseif ($runWorkerCycle) { "ran" } else { "idle" }
$state.reason = $reason
$state.batchStatus = $batchStatus
$state.workerCycle = $workerCycle
$state.latestPromoted = $latestPromoted
$state.lastUpdatedAt = (Get-Date).ToString("o")

Write-Utf8Json -Path $statePath -Object $state
