import "server-only";

import fs from "node:fs";
import path from "node:path";

type Phase6Lane = {
  lane?: string;
  ownerAgent?: string;
  goal?: string;
  status?: string;
  progress?: number;
  blocked?: boolean;
  metrics?: Record<string, string | number | boolean>;
  nextActions?: string[];
};

type Phase6State = {
  generatedAt?: string;
  phase?: string;
  project?: string;
  domain?: string;
  sourceFreshness?: Record<string, string | null>;
  kpis?: Record<string, number>;
  truth?: {
    deploymentParity?: string;
    syncParity?: string;
    topItemDeficits?: Array<{ key?: string; target?: number; live?: number; deficit?: number }>;
    topClientNeedDeficits?: Array<{ key?: string; target?: number; live?: number; deficit?: number }>;
    promotion?: {
      batchId?: string | null;
      promotableCount?: number;
      duplicateFingerprintCount?: number;
      liveCollisionCount?: number;
    };
    nextAction?: string | null;
  };
  lanes?: Phase6Lane[];
  blockers?: Array<{ lane?: string; status?: string; reason?: string }>;
};

function workspaceRoot() {
  let current = process.cwd();
  for (let index = 0; index < 6; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) return current;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

function readJson<T>(relativePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(workspaceRoot(), relativePath), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getPhase6NclexState() {
  const state = readJson<Phase6State | null>("connectors/nclex-saas/phase6-state.json", null);
  const lanes = state?.lanes ?? [];
  const kpis = state?.kpis ?? {};

  return {
    health: state ? "live" : "missing",
    generatedAt: state?.generatedAt ?? null,
    project: state?.project ?? "NCLEX SaaS",
    domain: state?.domain ?? "claritynclex.chapaisolutions.com",
    lanes,
    blockers: state?.blockers ?? [],
    sourceFreshness: state?.sourceFreshness ?? {},
    kpis: {
      liveQuestions: Number(kpis.liveQuestions ?? 0),
      targetQuestions: Number(kpis.targetQuestions ?? 2000),
      remainingToTarget: Number(kpis.remainingToTarget ?? 0),
      progressPct: Number(kpis.progressPct ?? 0),
      usableTarget: Number(kpis.usableTarget ?? 5000),
      progressToUsableTargetPct: Number(kpis.progressToUsableTargetPct ?? 0),
      ngnLive: Number(kpis.ngnLive ?? 0),
      ngnRatio: Number(kpis.ngnRatio ?? 0),
      ngnTarget: Number(kpis.ngnTarget ?? 60),
      approvedRefinedUsable: Number(kpis.approvedRefinedUsable ?? 0),
      needsReview: Number(kpis.needsReview ?? 0),
      remainingTo5000: Number(kpis.remainingTo5000 ?? 0),
      duplicateFamiliesCollapsed: Number(kpis.duplicateFamiliesCollapsed ?? 0),
      duplicateFingerprintsCollapsed: Number(kpis.duplicateFingerprintsCollapsed ?? 0),
    },
    truth: {
      deploymentParity: state?.truth?.deploymentParity ?? "unknown",
      syncParity: state?.truth?.syncParity ?? "unknown",
      topItemDeficits: state?.truth?.topItemDeficits ?? [],
      topClientNeedDeficits: state?.truth?.topClientNeedDeficits ?? [],
      promotion: {
        batchId: state?.truth?.promotion?.batchId ?? null,
        promotableCount: Number(state?.truth?.promotion?.promotableCount ?? 0),
        duplicateFingerprintCount: Number(state?.truth?.promotion?.duplicateFingerprintCount ?? 0),
        liveCollisionCount: Number(state?.truth?.promotion?.liveCollisionCount ?? 0),
      },
      nextAction: state?.truth?.nextAction ?? null,
    },
  };
}
