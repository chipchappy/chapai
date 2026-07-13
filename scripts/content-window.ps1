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

function Test-ChapaiContentWindow {
  param([datetime]$At = (Get-Date))

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
