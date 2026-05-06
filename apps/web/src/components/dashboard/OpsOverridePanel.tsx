"use client";

import { useMemo, useState, useTransition } from "react";
import { Ban, Crosshair, RotateCcw, ShieldAlert, Square, Trash2 } from "lucide-react";
import type { OpsOverrideAction, OpsOverrideRecord } from "@/lib/ops-control";

type OverrideTarget = {
  id: string;
  label: string;
};

type OpsOverridePanelProps = {
  targets: OverrideTarget[];
  recentOverrides: OpsOverrideRecord[];
};

const ACTION_LABELS: Record<OpsOverrideAction, { label: string; icon: typeof Ban; help: string }> = {
  "pause-lane": {
    label: "Pause lane",
    icon: Square,
    help: "Queue a hold command for an agent or lane.",
  },
  "drain-queue": {
    label: "Drain queue",
    icon: Trash2,
    help: "Queue a command to stop taking new work and clear pending work safely.",
  },
  "rollback-memory": {
    label: "Rollback memory",
    icon: RotateCcw,
    help: "Queue a Memory-Steward rollback request for the selected brain.",
  },
  "force-rebaseline": {
    label: "Force re-baseline",
    icon: Crosshair,
    help: "Queue a fresh state and memory baseline capture.",
  },
  "kill-agent": {
    label: "Kill agent",
    icon: ShieldAlert,
    help: "Queue a hard-stop command requiring watchdog enforcement.",
  },
};

const ACTIONS = Object.keys(ACTION_LABELS) as OpsOverrideAction[];

export default function OpsOverridePanel({ targets, recentOverrides }: OpsOverridePanelProps) {
  const [action, setAction] = useState<OpsOverrideAction>("pause-lane");
  const [target, setTarget] = useState(targets[0]?.id ?? "orchestrator");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAction = ACTION_LABELS[action];
  const selectedTarget = useMemo(
    () => targets.find((item) => item.id === target) ?? targets[0],
    [target, targets],
  );
  const SelectedIcon = selectedAction.icon;

  function submitOverride() {
    setMessage(null);
    setError(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/ops/override", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action,
            target,
            reason: reason || `${selectedAction.label} requested for ${selectedTarget?.label ?? target}.`,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; record?: OpsOverrideRecord; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.record) {
          setError(payload?.error ?? "Override command failed.");
          return;
        }

        setMessage(`Queued ${payload.record.action} for ${payload.record.target}.`);
        setReason("");
      })();
    });
  }

  return (
    <div className="rounded-lg border border-[#273241] bg-[#121720] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#d99b72]">manual overrides</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f4eee5]">Operator command bus</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8f9aaa]">
            Commands are persisted to config/ops-overrides.json and config/ops-overrides.jsonl for watchdog and lane consumers.
          </p>
        </div>
        <SelectedIcon className="h-5 w-5 text-[#d99b72]" aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <label className="block">
          <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#768194]">action</span>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as OpsOverrideAction)}
            className="h-11 w-full rounded-md border border-[#313b4a] bg-[#0b0e14] px-3 text-sm text-[#f4eee5] outline-none focus:border-[#d99b72]"
          >
            {ACTIONS.map((item) => (
              <option key={item} value={item}>
                {ACTION_LABELS[item].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#768194]">target</span>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="h-11 w-full rounded-md border border-[#313b4a] bg-[#0b0e14] px-3 text-sm text-[#f4eee5] outline-none focus:border-[#d99b72]"
          >
            {targets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#768194]">reason</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="min-h-[84px] w-full resize-y rounded-md border border-[#313b4a] bg-[#0b0e14] px-3 py-3 text-sm leading-6 text-[#f4eee5] outline-none focus:border-[#d99b72]"
          placeholder={selectedAction.help}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submitOverride}
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#d99b72] px-4 text-sm font-semibold text-[#0b0e14] transition hover:bg-[#f0b489] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SelectedIcon className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Queuing" : "Queue command"}
        </button>
        <span className="font-mono text-xs text-[#768194]">{selectedAction.help}</span>
      </div>

      {message ? (
        <div className="mt-4 rounded-md border border-[#46624f] bg-[#172419] px-3 py-2 text-sm text-[#a8d4b2]">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-md border border-[#6a3a36] bg-[#251514] px-3 py-2 text-sm text-[#f0aaa1]">
          {error}
        </div>
      ) : null}

      <div className="mt-5 border-t border-[#273241] pt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#768194]">recent override ledger</p>
        <div className="mt-3 grid gap-2">
          {recentOverrides.length > 0 ? recentOverrides.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="font-mono text-xs uppercase tracking-[0.12em] text-[#f4eee5]">{item.action}</strong>
                <span className="font-mono text-[11px] text-[#768194]">{new Date(item.requestedAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-[#aab4c2]">{item.target} - {item.reason}</p>
            </div>
          )) : (
            <div className="rounded-md border border-[#273241] bg-[#0b0e14] px-3 py-2 text-sm text-[#8f9aaa]">
              No operator override commands have been queued yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
