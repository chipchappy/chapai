#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return fallback


def resolve_chapai_root() -> Path:
    return Path(__file__).resolve().parents[1]


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def age_minutes(value: str | None) -> float | None:
    parsed = parse_iso(value)
    if not parsed:
        return None
    return round((datetime.now(parsed.tzinfo or timezone.utc) - parsed).total_seconds() / 60.0, 1)


def parse_generated_summary(summary_path: Path) -> dict:
    text = summary_path.read_text(encoding="utf-8") if summary_path.exists() else ""
    if not text:
        return {"ccrn": {"live": 0, "draft": 0}, "nclex": {"live": 0, "draft": 0}}
    payload_match = re.search(r"=\s*(\{[\s\S]*\})\s*as const;", text)
    if payload_match:
        try:
            return json.loads(payload_match.group(1))
        except json.JSONDecodeError:
            pass
    pattern = re.compile(
        r'"?ccrn"?\s*:\s*\{\s*"?(?:live)"?\s*:\s*(\d+),\s*"?(?:draft)"?\s*:\s*(\d+)\s*\}[\s\S]*?"?nclex"?\s*:\s*\{\s*"?(?:live)"?\s*:\s*(\d+),\s*"?(?:draft)"?\s*:\s*(\d+)\s*\}',
        re.MULTILINE,
    )
    match = pattern.search(text)
    if not match:
        return {"ccrn": {"live": 0, "draft": 0}, "nclex": {"live": 0, "draft": 0}}
    return {
        "ccrn": {"live": int(match.group(1)), "draft": int(match.group(2))},
        "nclex": {"live": int(match.group(3)), "draft": int(match.group(4))},
    }


def normalize_state(raw: str) -> str:
    token = (raw or "").strip().lower()
    if token in {"running", "live", "working"}:
        return "live"
    if token in {"sleeping", "ready", "idle", "brain-linked"}:
        return "sleeping"
    if token == "blocked":
        return "blocked"
    if token == "stale":
        return "stale"
    return token or "sleeping"


def load_agents(chapai_root: Path) -> list[dict]:
    registry = read_json(chapai_root / "config" / "employee-registry.json", {"employees": []})
    heartbeats = read_json(chapai_root / "config" / "agent-heartbeats.json", {"agents": []})
    heartbeat_map = {item.get("id"): item for item in heartbeats.get("agents", []) if item.get("id")}
    agents: list[dict] = []
    seen: set[str] = set()

    for entry in registry.get("employees", []):
        agent_id = entry.get("id")
        if not agent_id:
            continue
        seen.add(agent_id)
        state_path = chapai_root / (entry.get("statePath") or "")
        state = read_json(state_path, {}) if state_path.exists() else {}
        heartbeat = heartbeat_map.get(agent_id, {})
        last_seen = heartbeat.get("lastSeenAt") or state.get("lastRunAt") or state.get("lastSuccessAt")
        semantic_state = normalize_state(str(heartbeat.get("state") or state.get("status") or "sleeping"))

        agents.append(
            {
                "id": agent_id,
                "nickname": entry.get("nickname") or agent_id,
                "role": entry.get("role") or "Guild lane",
                "runtime": entry.get("runtime") or "unknown",
                "avatar": entry.get("avatar") or {},
                "state": semantic_state,
                "current": heartbeat.get("current") or ((state.get("currentTask") or {}).get("title")) or "No active task",
                "latest": heartbeat.get("latest") or ((state.get("latestResult") or {}).get("summary")) or "No recent result",
                "blocker": heartbeat.get("blocker") or state.get("blocker") or "none",
                "lastSeenAt": last_seen,
                "lastSeenAgeMinutes": age_minutes(last_seen),
                "nextWakeAt": state.get("nextWakeAt") or state.get("blockedUntil") or state.get("nextEligibleRunAt"),
                "source": heartbeat.get("source") or "employee-state",
            }
        )

    for agent_id, heartbeat in heartbeat_map.items():
        if agent_id in seen:
            continue
        last_seen = heartbeat.get("lastSeenAt")
        agents.append(
            {
                "id": agent_id,
                "nickname": agent_id,
                "role": "Guild lane",
                "runtime": "unknown",
                "avatar": {},
                "state": normalize_state(str(heartbeat.get("state") or "sleeping")),
                "current": heartbeat.get("current") or "No active task",
                "latest": heartbeat.get("latest") or "No recent result",
                "blocker": heartbeat.get("blocker") or "none",
                "lastSeenAt": last_seen,
                "lastSeenAgeMinutes": age_minutes(last_seen),
                "nextWakeAt": None,
                "source": heartbeat.get("source") or "heartbeat",
            }
        )

    return agents


def summarize_agents(agents: list[dict]) -> dict:
    counts = {"live": 0, "sleeping": 0, "blocked": 0, "stale": 0}
    for item in agents:
        state = item.get("state") or "sleeping"
        counts[state] = counts.get(state, 0) + 1
    counts["total"] = len(agents)
    return counts


def main() -> None:
    chapai_root = resolve_chapai_root()
    retrospective = read_json(chapai_root / "config" / "guild-retrospective.json", {})
    guild_loop = read_json(chapai_root / "config" / "guild-loop-state.json", {})
    content_engine = read_json(chapai_root / "config" / "content-engine-state.json", {})
    content_summary = parse_generated_summary(chapai_root / "packages" / "content" / "src" / "generated-summary.ts")
    agents = load_agents(chapai_root)
    counts = summarize_agents(agents)

    snapshot = {
        "generatedAt": utc_now_iso(),
        "chapaiRoot": str(chapai_root),
        "counts": counts,
        "agents": agents,
        "room": {
            "state": retrospective.get("roomState") or "guild-sync",
            "wins": retrospective.get("wins") or [],
            "blockers": retrospective.get("blockers") or [],
            "next": retrospective.get("next") or [],
        },
        "content": {
            "ccrn": content_summary.get("ccrn", {"live": 0, "draft": 0}),
            "nclex": content_summary.get("nclex", {"live": 0, "draft": 0}),
            "latestPromoted": guild_loop.get("latestPromoted") or content_engine.get("latestPromoted"),
            "engineStatus": content_engine.get("status") or "unknown",
            "engineReason": content_engine.get("reason") or "",
        },
    }

    output_path = chapai_root / "config" / "guild-snapshot.json"
    output_path.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "output": str(output_path), "generatedAt": snapshot["generatedAt"]}))


if __name__ == "__main__":
    main()
