"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import styles from "./clinical-simulation.module.css";

type Rhythm = "sinus" | "sinus_tach" | "sinus_brady" | "afib" | "vtach" | "vfib" | "asystole";
type LaneKind = "ecg" | "abp" | "pleth" | "resp";
interface Lane { kind: LaneKind; color: string; cyFrac: number; ampFrac: number; }

function classifyRhythm(raw: string | undefined, hr: number): Rhythm {
  const r = (raw ?? "").toLowerCase();
  if (/asystole|flatline|no rhythm/.test(r)) return "asystole";
  if (/v-?fib|ventricular fib/.test(r)) return "vfib";
  if (/v-?tach|ventricular tach|vt\b/.test(r)) return "vtach";
  if (/a-?fib|atrial fib|afib/.test(r)) return "afib";
  if (/brady/.test(r) || hr < 55) return "sinus_brady";
  if (/tach/.test(r) || hr > 100) return "sinus_tach";
  return "sinus";
}

function hasArterialLine(state: PatientState): boolean {
  const haystack = Object.values(state.devices ?? {}).join(" ").toLowerCase();
  return /arterial|a-?line|art line|abp|radial line/.test(haystack);
}

function gauss(x: number, mu: number, sig: number) {
  return Math.exp(-((x - mu) * (x - mu)) / (2 * sig * sig));
}
function ecgWave(phase: number, r: Rhythm): number {
  if (r === "asystole") return (Math.random() - 0.5) * 0.015;
  if (r === "vfib") return Math.sin(phase * 41) * 0.55 + (Math.random() - 0.5) * 0.5;
  if (r === "vtach") return Math.sin(phase * Math.PI * 2 - 0.4) * 0.82 - 0.05;
  let y = 0;
  if (r !== "afib") y += 0.13 * gauss(phase, 0.17, 0.028);
  y -= 0.07 * gauss(phase, 0.375, 0.009);
  y += 1.02 * gauss(phase, 0.41, 0.01);
  y -= 0.24 * gauss(phase, 0.445, 0.011);
  y += 0.26 * gauss(phase, 0.63, 0.045);
  if (r === "afib") y += (Math.random() - 0.5) * 0.05;
  return y;
}
function plethWave(phase: number, amp: number): number {
  const rise = Math.pow(Math.min(phase / 0.16, 1), 1.7);
  const fall = Math.exp(-Math.max(phase - 0.16, 0) * 2.6);
  return rise * fall * amp;
}
function abpWave(phase: number): number {
  const base = 0.32;
  const up = Math.pow(Math.min(phase / 0.11, 1), 1.5);
  const decay = Math.exp(-Math.max(phase - 0.11, 0) * 2.1);
  const systole = up * decay;
  const dicrotic = 0.12 * Math.exp(-((phase - 0.37) * (phase - 0.37)) / (2 * 0.0011));
  return base + (1 - base) * systole + dicrotic * (1 - base);
}

function valueTone(value: number, low: number, high: number) {
  return value < low || value > high ? styles.monitorAlert : "";
}

/**
 * Live bedside monitor. A canvas renders a sweeping, rhythm-accurate ECG plus a
 * synced SpO2 pleth and respiration wave (and an arterial-line trace when the
 * scenario places one). The waveform generator reads the latest vitals through a
 * ref so it tracks engine updates without restarting the animation.
 */
export default function BedsideMonitor({ state }: { state: PatientState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const showArtLine = useMemo(() => hasArterialLine(state), [state]);
  const alarming =
    state.vitals.spo2 < 90 || state.vitals.map < 65 || state.vitals.heartRate > 125 || state.vitals.respiratoryRate < 8;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 320;
    let height = 190;

    const lanes: Lane[] = showArtLine
      ? [
          { kind: "ecg", color: "#4dffa0", cyFrac: 0.15, ampFrac: 0.12 },
          { kind: "abp", color: "#ff6a6f", cyFrac: 0.4, ampFrac: 0.085 },
          { kind: "pleth", color: "#56c8ea", cyFrac: 0.65, ampFrac: 0.08 },
          { kind: "resp", color: "#e0b866", cyFrac: 0.88, ampFrac: 0.06 },
        ]
      : [
          { kind: "ecg", color: "#4dffa0", cyFrac: 0.2, ampFrac: 0.15 },
          { kind: "pleth", color: "#56c8ea", cyFrac: 0.56, ampFrac: 0.11 },
          { kind: "resp", color: "#e0b866", cyFrac: 0.85, ampFrac: 0.08 },
        ];

    const pxPerSec = 130;
    let prevX = 0;
    let ecgPhase = 0;
    let respPhase = 0;
    let beatJitter = 1;
    let last: number[] = [];
    let raf = 0;
    let lastT = performance.now();

    function gridBand(a: number, b: number) {
      ctx.strokeStyle = "rgba(120,230,175,0.06)";
      ctx.lineWidth = 1;
      const step = Math.max(22, Math.round(height / 6));
      for (let gx = Math.floor(a / 26) * 26; gx <= b + 16; gx += 26) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += step) {
        ctx.beginPath();
        ctx.moveTo(a, gy);
        ctx.lineTo(b + 16, gy);
        ctx.stroke();
      }
    }
    function paintBg() {
      ctx.fillStyle = "#050f0d";
      ctx.fillRect(0, 0, width, height);
      gridBand(0, width);
    }

    function sampleLane(lane: Lane): number {
      const s = stateRef.current;
      const rhythm = classifyRhythm(s.cardiacRhythm, s.vitals.heartRate);
      const cy = lane.cyFrac * height;
      const amp = lane.ampFrac * height;
      if (lane.kind === "ecg") {
        const eamp = rhythm === "asystole" ? 0.04 : 1;
        return cy - ecgWave(ecgPhase, rhythm) * amp * eamp;
      }
      if (lane.kind === "abp") {
        const aamp = rhythm === "asystole" || rhythm === "vfib" ? 0.12 : 1;
        return cy + amp * 0.5 - abpWave(ecgPhase) * amp * aamp;
      }
      if (lane.kind === "pleth") {
        let pamp = Math.max(0.18, Math.min(1, s.vitals.spo2 / 100));
        if (rhythm === "asystole" || rhythm === "vfib") pamp *= 0.12;
        return cy + amp * 0.45 - plethWave(ecgPhase, pamp) * amp;
      }
      return cy - Math.sin(respPhase * Math.PI * 2) * amp * 0.9;
    }

    function drawSegment(x0: number, x1: number, wrapped: boolean) {
      const segs: Array<[number, number]> = wrapped ? [[x0, width], [0, x1]] : [[x0, x1]];
      for (const [a, b] of segs) {
        ctx.fillStyle = "#050f0d";
        ctx.fillRect(a, 0, b - a + 16, height);
        gridBand(a, b);
        for (let l = 0; l < lanes.length; l++) {
          const lane = lanes[l];
          ctx.strokeStyle = lane.color;
          ctx.lineWidth = lane.kind === "ecg" ? 1.9 : 1.5;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.shadowColor = lane.color;
          ctx.shadowBlur = lane.kind === "ecg" ? 6 : 3;
          ctx.beginPath();
          ctx.moveTo(a, last[l] ?? sampleLane(lane));
          let px = a;
          while (px <= b) {
            ctx.lineTo(px, sampleLane(lane));
            px += 2;
          }
          const endY = sampleLane(lane);
          ctx.lineTo(b, endY);
          ctx.stroke();
          last[l] = endY;
        }
        ctx.shadowBlur = 0;
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(200, Math.round(rect.width));
      height = Math.max(150, Math.round(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      last = [];
      prevX = 0;
      paintBg();
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const s = stateRef.current;
      const rhythm = classifyRhythm(s.cardiacRhythm, s.vitals.heartRate);
      const hr = rhythm === "asystole" ? 0 : s.vitals.heartRate;
      if (hr > 1) {
        const beat = (60 / hr) * beatJitter;
        ecgPhase += dt / beat;
        if (ecgPhase >= 1) {
          ecgPhase -= 1;
          beatJitter = rhythm === "afib" ? 0.62 + Math.random() * 0.85 : 1;
        }
      }
      respPhase += dt * (Math.max(4, s.vitals.respiratoryRate) / 60);
      if (respPhase >= 1) respPhase -= 1;

      let newX = prevX + pxPerSec * dt;
      let wrapped = false;
      if (newX >= width) {
        newX -= width;
        wrapped = true;
      }
      drawSegment(prevX, newX, wrapped);
      prevX = newX;
      raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (reduce) {
      // Draw one static representative sweep, no animation.
      for (let i = 0; i < width; i += 2) {
        drawSegment(Math.max(0, i - 2), i, false);
        ecgPhase = (ecgPhase + 0.02) % 1;
      }
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [showArtLine]);

  return (
    <section
      className={styles.monitor}
      aria-label={`Bedside monitor. Rhythm ${state.cardiacRhythm}. Heart rate ${Math.round(state.vitals.heartRate)}. Oxygen saturation ${Math.round(state.vitals.spo2)} percent.`}
    >
      <header>
        <span>MONITOR 01</span>
        <span className={alarming ? styles.alarmActive : styles.alarmNormal}>
          {alarming ? "ALARM / CHECK PATIENT" : "ALARMS ACTIVE"}
        </span>
      </header>
      <div className={styles.waveform} aria-hidden="true">
        <canvas ref={canvasRef} className={styles.waveformCanvas} />
      </div>
      <div className={styles.monitorValues}>
        <div><span>HR</span><strong className={valueTone(state.vitals.heartRate, 50, 120)}>{Math.round(state.vitals.heartRate)}</strong><small>bpm</small></div>
        <div><span>{showArtLine ? "ART" : "NIBP"}</span><strong className={valueTone(state.vitals.map, 65, 130)}>{Math.round(state.vitals.systolic)}/{Math.round(state.vitals.diastolic)}</strong><small>MAP {Math.round(state.vitals.map)}</small></div>
        <div><span>SpO2</span><strong className={valueTone(state.vitals.spo2, 90, 100)}>{Math.round(state.vitals.spo2)}</strong><small>%</small></div>
        <div><span>RR</span><strong className={valueTone(state.vitals.respiratoryRate, 8, 32)}>{Math.round(state.vitals.respiratoryRate)}</strong><small>/min</small></div>
        <div><span>TEMP</span><strong className={valueTone(state.vitals.temperatureC, 35.5, 38.4)}>{state.vitals.temperatureC.toFixed(1)}</strong><small>°C</small></div>
      </div>
      <footer><span>{state.cardiacRhythm}</span><span>Virtual minute {state.virtualMinute}</span></footer>
    </section>
  );
}
