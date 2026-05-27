"use client";

import { useMemo, useState } from "react";

type Mode = "weight" | "drip" | "mcgkgmin" | "reconstitution";

const MODES: Array<{ id: Mode; label: string; sub: string }> = [
  { id: "weight", label: "Pediatric weight-based", sub: "mg/kg × weight" },
  { id: "drip", label: "IV gravity drip rate", sub: "gtt/min" },
  { id: "mcgkgmin", label: "mcg/kg/min titration", sub: "vasoactives" },
  { id: "reconstitution", label: "Reconstitution", sub: "mg/mL" },
];

function num(s: string) {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
}

export default function DosageCalcClient() {
  const [mode, setMode] = useState<Mode>("weight");

  return (
    <div className="rounded-[16px] border border-[var(--c-border)] bg-[var(--c-bg-elevated)] p-6 md:p-8">
      <div className="mb-6 grid gap-2 md:grid-cols-4">
        {MODES.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-[10px] border px-3 py-3 text-left text-sm transition ${mode === m.id ? "border-[var(--c-gold)] bg-[rgba(176,141,87,0.12)]" : "border-[var(--c-border)] bg-white hover:border-[var(--c-gold)]"}`}
          >
            <div className="font-semibold">{m.label}</div>
            <div className="mt-1 text-xs text-[var(--c-text-muted)]">{m.sub}</div>
          </button>
        ))}
      </div>

      {mode === "weight" ? <WeightBased /> : null}
      {mode === "drip" ? <DripRate /> : null}
      {mode === "mcgkgmin" ? <McgKgMin /> : null}
      {mode === "reconstitution" ? <Reconstitution /> : null}
    </div>
  );
}

function Field({ label, value, onChange, unit, hint }: { label: string; value: string; onChange: (v: string) => void; unit?: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[10px] border border-[var(--c-border)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--c-gold)]"
        />
        {unit ? <span className="text-sm text-[var(--c-text-muted)]">{unit}</span> : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-[var(--c-text-muted)]">{hint}</p> : null}
    </label>
  );
}

function Result({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-[12px] bg-[rgba(126,157,134,0.10)] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-sage-deep)]">{label}</div>
      <div className="mt-2 font-serif text-3xl text-[var(--c-text)]">
        {value} <span className="text-base font-sans text-[var(--c-text-muted)]">{unit}</span>
      </div>
    </div>
  );
}

function WeightBased() {
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [dose, setDose] = useState("");
  const [conc, setConc] = useState("");

  const wKg = useMemo(() => (weightUnit === "lb" ? num(weight) / 2.2 : num(weight)), [weight, weightUnit]);
  const totalDose = wKg * num(dose);
  const volume = num(conc) > 0 ? totalDose / num(conc) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWeightUnit("kg")}
            className={`flex-1 rounded-[8px] border px-3 py-2 text-sm ${weightUnit === "kg" ? "border-[var(--c-gold)] bg-[rgba(176,141,87,0.12)]" : "border-[var(--c-border)] bg-white"}`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => setWeightUnit("lb")}
            className={`flex-1 rounded-[8px] border px-3 py-2 text-sm ${weightUnit === "lb" ? "border-[var(--c-gold)] bg-[rgba(176,141,87,0.12)]" : "border-[var(--c-border)] bg-white"}`}
          >
            lb
          </button>
        </div>
        <Field label="Patient weight" value={weight} onChange={setWeight} unit={weightUnit} />
        <Field label="Ordered dose" value={dose} onChange={setDose} unit="mg/kg" />
        <Field label="Concentration (optional)" value={conc} onChange={setConc} unit="mg/mL" hint="Leave blank to skip volume calc" />
      </div>
      <div className="space-y-4">
        <Result label="Total dose to give" value={totalDose ? totalDose.toFixed(2) : "—"} unit="mg" />
        {num(conc) > 0 ? <Result label="Volume to draw up" value={volume.toFixed(2)} unit="mL" /> : null}
        <p className="text-xs text-[var(--c-text-muted)]">Verify against safe-dose range before administering.</p>
      </div>
    </div>
  );
}

function DripRate() {
  const [vol, setVol] = useState("");
  const [time, setTime] = useState("");
  const [drop, setDrop] = useState("15");

  const minutes = num(time);
  const rate = minutes > 0 ? (num(vol) * num(drop)) / minutes : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Field label="Total volume to infuse" value={vol} onChange={setVol} unit="mL" />
        <Field label="Total infusion time" value={time} onChange={setTime} unit="minutes" hint="Convert hours to minutes (× 60)" />
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">Drop factor</span>
          <select
            value={drop}
            onChange={(e) => setDrop(e.target.value)}
            className="mt-2 w-full rounded-[10px] border border-[var(--c-border)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--c-gold)]"
          >
            <option value="10">10 gtt/mL (macro)</option>
            <option value="15">15 gtt/mL (macro)</option>
            <option value="20">20 gtt/mL (macro)</option>
            <option value="60">60 gtt/mL (micro / pediatric)</option>
          </select>
        </label>
      </div>
      <div>
        <Result label="Gravity drip rate" value={rate ? Math.round(rate).toString() : "—"} unit="gtt/min" />
        <p className="mt-3 text-xs text-[var(--c-text-muted)]">Always round to whole drops per minute.</p>
      </div>
    </div>
  );
}

function McgKgMin() {
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
  const [dose, setDose] = useState("");
  const [conc, setConc] = useState("");

  const wKg = useMemo(() => (weightUnit === "lb" ? num(weight) / 2.2 : num(weight)), [weight, weightUnit]);
  const pumpRate = num(conc) > 0 ? (num(dose) * wKg * 60) / num(conc) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWeightUnit("kg")}
            className={`flex-1 rounded-[8px] border px-3 py-2 text-sm ${weightUnit === "kg" ? "border-[var(--c-gold)] bg-[rgba(176,141,87,0.12)]" : "border-[var(--c-border)] bg-white"}`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => setWeightUnit("lb")}
            className={`flex-1 rounded-[8px] border px-3 py-2 text-sm ${weightUnit === "lb" ? "border-[var(--c-gold)] bg-[rgba(176,141,87,0.12)]" : "border-[var(--c-border)] bg-white"}`}
          >
            lb
          </button>
        </div>
        <Field label="Patient weight" value={weight} onChange={setWeight} unit={weightUnit} />
        <Field label="Ordered dose" value={dose} onChange={setDose} unit="mcg/kg/min" />
        <Field label="Concentration" value={conc} onChange={setConc} unit="mcg/mL" hint="e.g. norepinephrine 16 mcg/mL" />
      </div>
      <div>
        <Result label="Pump rate" value={pumpRate ? pumpRate.toFixed(1) : "—"} unit="mL/hr" />
        <p className="mt-3 text-xs text-[var(--c-text-muted)]">For vasopressors, titrate to MAP, not just a fixed dose.</p>
      </div>
    </div>
  );
}

function Reconstitution() {
  const [totalMg, setTotalMg] = useState("");
  const [diluent, setDiluent] = useState("");
  const [orderedDose, setOrderedDose] = useState("");

  const finalConc = num(diluent) > 0 ? num(totalMg) / num(diluent) : 0;
  const volume = finalConc > 0 ? num(orderedDose) / finalConc : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Field label="Drug strength per vial" value={totalMg} onChange={setTotalMg} unit="mg" />
        <Field label="Diluent volume added" value={diluent} onChange={setDiluent} unit="mL" />
        <Field label="Ordered dose" value={orderedDose} onChange={setOrderedDose} unit="mg" />
      </div>
      <div className="space-y-4">
        <Result label="Final concentration" value={finalConc ? finalConc.toFixed(2) : "—"} unit="mg/mL" />
        <Result label="Volume to draw up" value={volume ? volume.toFixed(2) : "—"} unit="mL" />
      </div>
    </div>
  );
}
