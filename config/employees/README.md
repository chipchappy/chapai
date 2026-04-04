Canonical employee metadata lives here.

Provision a new employee with:

`powershell -ExecutionPolicy Bypass -File .\scripts\employee-loader.ps1 -EmployeeId <id> -DisplayName <name> -Runtime <runtime> -Role <role> -Mission "<mission>"`

The loader provisions:
- `config\<id>-queue.json`
- `config\<id>-state.json`
- `config\employees\<id>.metadata.json`
- `brains\agents\<id>.json`
- a seed heartbeat entry in `config\agent-heartbeats.json`

Semantic status rules:
- `live`: actively executing or freshly produced useful output
- `ready`: no blocker, waiting for work or next sweep
- `sleeping`: intentionally paused until a known wake time
- `blocked`: waiting on a human or external unblock with no reliable wake time
- `stale`: heartbeat or lane state is older than the configured freshness window
