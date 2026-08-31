"use client";

import {
  BookOpen,
  Droplets,
  FileCheck2,
  ListChecks,
  Pill,
  Stethoscope,
  UsersRound,
  Wind,
} from "lucide-react";
import type { SimulationToolId } from "@/lib/clinical-simulation/workspace-tools";
import styles from "./clinical-simulation.module.css";

export const SIMULATION_TOOLS: Array<{
  id: SimulationToolId;
  label: string;
  hint: string;
  icon: typeof Stethoscope;
}> = [
  { id: "assessment", label: "Assessment", hint: "Patient assessment", icon: Stethoscope },
  { id: "care", label: "Oxygen", hint: "Oxygen · positioning · safety", icon: Wind },
  { id: "medications", label: "Meds", hint: "MAR", icon: Pill },
  { id: "fluids", label: "IV Fluids", hint: "Lines · infusions", icon: Droplets },
  { id: "orders", label: "Orders", hint: "Active provider orders", icon: ListChecks },
  { id: "chart", label: "Charting", hint: "EHR · results · notes", icon: BookOpen },
  { id: "team", label: "Team Chat", hint: "SBAR · escalation", icon: UsersRound },
];

export function simulationToolLabel(id: SimulationToolId): string {
  return SIMULATION_TOOLS.find((tool) => tool.id === id)?.label ?? "tool";
}

export default function SimulationToolRail({
  active,
  badges,
  recommended,
  canComplete,
  busy,
  onSelect,
  onComplete,
}: {
  active: SimulationToolId | null;
  badges: Partial<Record<SimulationToolId, number>>;
  recommended?: SimulationToolId | null;
  canComplete: boolean;
  busy: boolean;
  onSelect: (tool: SimulationToolId) => void;
  onComplete: () => void;
}) {
  return (
    <nav className={styles.toolRail} aria-label="Clinical tools" data-testid="simulation-tool-rail">
      {SIMULATION_TOOLS.map((tool) => {
        const Icon = tool.icon;
        const badge = badges[tool.id] ?? 0;
        return (
          <button
            key={tool.id}
            type="button"
            data-active={active === tool.id}
            data-recommended={recommended === tool.id}
            onClick={() => onSelect(tool.id)}
            aria-haspopup="dialog"
            aria-label={`${tool.label}: ${tool.hint}${badge ? `, ${badge} new` : ""}`}
            title={`${tool.label} · ${tool.hint}`}
          >
            <Icon size={20} aria-hidden="true" />
            <strong>{tool.label}</strong>
            {badge ? <em aria-hidden="true">{badge}</em> : null}
          </button>
        );
      })}
      <button
        type="button"
        className={styles.endSimulationAction}
        disabled={!canComplete || busy}
        onClick={onComplete}
        title={canComplete ? "End simulation and open the debrief" : "Complete the required clinical objectives before ending the simulation"}
      >
        <FileCheck2 size={20} aria-hidden="true" />
        <strong>End Simulation</strong>
      </button>
    </nav>
  );
}
