# Agent Architecture Next

## Goal
- Keep the current file-backed employee brains, but make the agent system more scalable, more truthful, and cheaper to run as more workers come online.

## What is working already
- File-backed brains are the canonical memory source.
- Claude has a bounded employee queue.
- Nemoclaw handles cheap local generation.
- The guild dashboard surfaces live state, brain growth, and blockers.

## Next system upgrade
### 1. Split the agent model into three pieces
- `RoleBrain`
- `WorkerInstance`
- `TaskRun`

Reason:
- A persistent employee identity should not be the same object as a temporary runtime session or a single task attempt.

### 2. Move queue and runtime state into a lightweight local DB
- Candidate path:
  - `C:\Users\Chapman\Desktop\ai\chapai\config\agent-control.db`

Keep:
- brains as file-backed canonical memory

Move into DB:
- queue state
- leases
- attempts
- heartbeats
- task outcomes

### 3. Add brain-update proposals
- Workers should not write directly into durable memory.
- They should submit:
  - normalized durable-memory proposals
  - skill proposals
  - workflow proposals
- A curator layer should promote only high-signal updates.

### 4. Add capability routing
- Each worker should advertise:
  - runtime
  - cost class
  - latency class
  - can review
  - can write
  - can generate content
  - interactive-auth dependency
- Then tasks can route based on capability and cost, not just name.

### 5. Add lease-based multi-worker execution
- Before expanding into deeper swarms:
  - task claim
  - lease timeout
  - retry
  - dead-letter
- This prevents multiple workers from colliding on the same task.

## Order of implementation
1. Add schemas for `RoleBrain`, `WorkerInstance`, `TaskSpec`, `TaskAttempt`, and `BrainUpdateProposal`.
2. Move the Claude queue and guild loop state into SQLite.
3. Keep JSON exports for dashboard compatibility.
4. Add a small curator that promotes good brain updates.
5. Only then expand toward more parallel autonomous workers.

## Principle
- More autonomy should come from a better harness and cleaner state, not from pretending the models are learning on their own.
