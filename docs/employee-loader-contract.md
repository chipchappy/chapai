# Guild Employee Loader

Use [`C:\Users\Chapman\Desktop\ai\chapai\scripts\new-guild-employee.ps1`](C:\Users\Chapman\Desktop\ai\chapai\scripts\new-guild-employee.ps1) to add every new employee through one cheap, repeatable flow.

## What it creates
- brain file in `brains/agents`
- queue file in `config`
- state file in `config`
- registry entry in [`employee-registry.json`](C:\Users\Chapman\Desktop\ai\chapai\config\employee-registry.json)
- heartbeat stub in [`agent-heartbeats.json`](C:\Users\Chapman\Desktop\ai\chapai\config\agent-heartbeats.json)

## Required inputs
- `AgentId`
- `DisplayName`
- `Role`

## Example
```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\new-guild-employee.ps1 `
  -AgentId explorer `
  -DisplayName "Euler" `
  -Role "Market Explorer" `
  -Runtime codex `
  -Mission "Study adjacent healthcare SaaS and surface one bounded next-product memo at a time."
```

## Rules
- Every employee starts `sleeping`, not `live`.
- Sleeping employees still carry a scheduled review time so the manager can wake them cheaply without losing continuity.
- Brains are the canonical truth.
- Only durable, reusable workflow memory should be promoted.
- The manager lane owns the short human-fix queue and keeps employees bounded.
