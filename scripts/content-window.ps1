function Get-ChapaiContentWindowHour {
  param(
    [Parameter(Mandatory = $true)]
    [string]$EnvironmentVariable,
    [Parameter(Mandatory = $true)]
    [int]$Default
  )

  $raw = [Environment]::GetEnvironmentVariable($EnvironmentVariable)
  if ($raw) {
    $parsed = 0
    if ([int]::TryParse($raw, [ref]$parsed) -and $parsed -ge 0 -and $parsed -le 23) {
      return $parsed
    }
  }

  return $Default
}

function Test-ChapaiDemoPause {
  param([datetime]$At = (Get-Date))

  $pausePath = Join-Path $env:LOCALAPPDATA "ChappiAi\clarity-demo-pause.txt"
  if (-not (Test-Path -LiteralPath $pausePath)) {
    return $false
  }

  try {
    $raw = Get-Content -LiteralPath $pausePath -Raw -ErrorAction Stop
    $resumeAt = [datetimeoffset]::Parse($raw.Trim()).LocalDateTime
    if ($At -lt $resumeAt) {
      return $true
    }
  } catch {
    # A malformed sentinel must fail open so it cannot stall agents forever.
  }

  Remove-Item -LiteralPath $pausePath -Force -ErrorAction SilentlyContinue
  return $false
}

function Test-ChapaiContentWindow {
  param([datetime]$At = (Get-Date))

  if (Test-ChapaiDemoPause -At $At) {
    return $false
  }

  $startHour = Get-ChapaiContentWindowHour -EnvironmentVariable "CHAPAI_CONTENT_WINDOW_START_HOUR" -Default 22
  $endHour = Get-ChapaiContentWindowHour -EnvironmentVariable "CHAPAI_CONTENT_WINDOW_END_HOUR" -Default 6

  if ($startHour -eq $endHour) {
    return $true
  }

  if ($startHour -lt $endHour) {
    return $At.Hour -ge $startHour -and $At.Hour -lt $endHour
  }

  return $At.Hour -ge $startHour -or $At.Hour -lt $endHour
}
