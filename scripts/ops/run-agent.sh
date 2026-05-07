#!/usr/bin/env bash
set -euo pipefail

agent_id="${1:-}"
if [[ -z "$agent_id" ]]; then
  echo "usage: run-agent.sh <agent_id>" >&2
  exit 2
fi

repo_root="${CHAPAI_ROOT:-/opt/chapai}"
agent_env="/etc/chapai/agents/${agent_id}.env"
if [[ -f "$agent_env" ]]; then
  # shellcheck disable=SC1090
  source "$agent_env"
fi

export CHAPAI_AGENT_ID="${CHAPAI_AGENT_ID:-$agent_id}"
export CHAPAI_HEARTBEAT_URL="${CHAPAI_HEARTBEAT_URL:-http://127.0.0.1:3000/heartbeats}"

node "$repo_root/scripts/ops/chapai-heartbeat.mjs" --agent="$agent_id" --source=systemd-agent &
heartbeat_pid=$!

cleanup() {
  kill "$heartbeat_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ -z "${CHAPAI_AGENT_COMMAND:-}" ]]; then
  echo "CHAPAI_AGENT_COMMAND is required in $agent_env" >&2
  exit 3
fi

cd "$repo_root"
exec bash -lc "$CHAPAI_AGENT_COMMAND"
