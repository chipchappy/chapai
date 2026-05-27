#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const schemaVersion = "chapai.connector.event.v1";
const runId = String(args.get("run-id") ?? `phase6-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const dryRun = args.has("dry-run");
const validateOnly = args.has("validate");
const reset = args.has("reset");

function findRoot() {
  let current = path.resolve(String(args.get("root") ?? process.cwd()));
  for (let index = 0; index < 8; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) return current;
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return path.resolve(String(args.get("root") ?? process.cwd()));
}

const root = findRoot();
const connectorRoot = path.join(root, "connectors", "nclex-saas");
const statePath = path.join(connectorRoot, "phase6-state.json");

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function sha(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableHash(value) {
  return sha(value).slice(0, 16);
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(relativePath, fallback = null) {
  try {
    const filePath = path.join(root, relativePath);
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function fileMtime(relativePath) {
  try {
    return fs.statSync(path.join(root, relativePath)).mtime.toISOString();
  } catch {
    return null;
  }
}

function appendJsonl(filePath, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function writeJson(filePath, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function event(eventType, payload, options = {}) {
  const emittedAt = nowIso();
  return {
    event_id: sha(`nclex-saas:${eventType}:${runId}:${JSON.stringify(payload)}`),
    schema_version: schemaVersion,
    source: "nclex-saas",
    event_type: eventType,
    emitted_at: emittedAt,
    observed_at: options.observedAt ?? emittedAt,
    connector_run_id: runId,
    taint: options.taint ?? "derived_internal_state",
    allowed_uses: options.allowedUses ?? ["dashboard", "audit", "operator-control", "goal-routing"],
    provenance: {
      tool: "scripts/ops/phase6-nclex-orchestration.mjs",
      cwd: normalizePath(path.relative(root, process.cwd()) || "."),
      host_hash: stableHash(os.hostname()),
      platform: os.platform(),
      source_files: options.sourceFiles ?? [],
    },
    payload,
  };
}

function pct(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function getFormatMixNgn(formatMix = {}) {
  const mcq = Number(formatMix.mcq ?? 0);
  const live = Object.values(formatMix).reduce((sum, value) => sum + Number(value ?? 0), 0);
  return {
    mcq,
    ngn: Math.max(0, live - mcq),
    ngnRatio: live > 0 ? pct(Math.max(0, live - mcq), live) : 0,
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildState() {
  const healthPath = "config/nclex-bank-health-latest.json";
  const refinementPath = "packages/content/questions/nclex/review/nclex-second-pass-refinement-latest.json";
  const topUpPath = "packages/content/questions/nclex/review/nclex-top-up-needed.latest.json";
  const growthQueuePath = "config/growth-approval-queue.json";
  const emailDispatchPath = "config/email-outbox/dispatch-state.json";
  const opportunityPath = "config/social-outbox/opportunity-radar-latest.json";
  const promotionPath = "config/nclex-wave-promotion-latest.json";

  const health = readJson(healthPath, {});
  const refinement = readJson(refinementPath, {});
  const topUp = readJson(topUpPath, {});
  const growthQueue = readJson(growthQueuePath, {});
  const emailDispatch = readJson(emailDispatchPath, {});
  const opportunity = readJson(opportunityPath, {});
  const promotion = readJson(promotionPath, {});

  const canonicalLive = Number(health.counts?.canonicalLive ?? refinement.summary?.sourceCount ?? 0);
  const targetCount = Number(health.rollout?.targetCount ?? 2000);
  const remainingToTarget = Number(health.rollout?.remainingToTarget ?? Math.max(0, targetCount - canonicalLive));
  const format = getFormatMixNgn(health.mix?.formatMix);
  const ngnTarget = 60;
  const approvedUsable = Number(refinement.summary?.approvedRefinedUsableUnique ?? canonicalLive);
  const needsReview = Number(refinement.summary?.needsReview ?? 0);
  const remainingTo5000 = Number(refinement.summary?.remainingTo5000 ?? topUp.remainingTo5000 ?? Math.max(0, 5000 - approvedUsable));
  const approvals = asArray(growthQueue.items);
  const liveOpportunities = asArray(opportunity.liveOpportunities);
  const topManualQueue = asArray(opportunity.topManualQueue);
  const watchlist = asArray(opportunity.watchlist);
  const topItemDeficits = asArray(topUp.itemDeficits).slice(0, 5);
  const topClientNeedDeficits = asArray(topUp.clientNeedDeficits).slice(0, 5);
  const duplicateFamiliesCollapsed = Number(health.counts?.duplicateFamiliesCollapsed ?? 0);
  const duplicateFingerprintsCollapsed = Number(health.counts?.duplicateFingerprintsCollapsed ?? 0);
  const deploymentParity = String(health.parity?.deployment?.status ?? "unknown");
  const syncParity = String(health.parity?.sync?.status ?? "unknown");
  const promotionSummary = promotion.summary ?? {};

  const lanes = [
    {
      lane: "Product-Ops",
      ownerAgent: "content",
      goal: "Continue reviewed NCLEX loop toward 2,000 live questions and at least 60% NGN distribution.",
      status: canonicalLive >= targetCount && format.ngnRatio >= ngnTarget ? "on_target" : "active_gap",
      progress: Math.min(pct(canonicalLive, targetCount), pct(format.ngnRatio, ngnTarget)),
      blocked: canonicalLive < targetCount || format.ngnRatio < ngnTarget || needsReview > 0,
      metrics: {
        liveQuestions: canonicalLive,
        targetQuestions: targetCount,
        remainingToTarget,
        usableTarget: 5000,
        ngnLive: format.ngn,
        ngnRatio: format.ngnRatio,
        ngnTarget,
        approvedRefinedUsable: approvedUsable,
        needsReview,
        remainingTo5000,
        duplicateFamiliesCollapsed,
        deploymentParity,
        syncParity,
        promotableCandidates: Number(promotionSummary.promotableCount ?? 0),
      },
      nextActions: [
        topUp.nextAction ?? "Review second-pass flagged items before any raw top-up generation.",
        "Allocate new reviewed items to thin families and underrepresented client-needs only.",
        "Prefer NGN shapes for the next wave until the 60% target is met.",
      ],
    },
    {
      lane: "Growth",
      ownerAgent: "growth-orchestrator",
      goal: "Instrument funnel, run weekly content experiments, and keep growth approvals visible.",
      status: emailDispatch.status ?? (approvals.length ? "approval_queue_ready" : "missing_growth_meter"),
      progress: approvals.length > 0 ? 60 : 20,
      blocked: Boolean(emailDispatch.blocker) || approvals.length === 0,
      metrics: {
        approvalItems: approvals.length,
        dispatchApproved: Number(emailDispatch.approved ?? 0),
        sent: Number(emailDispatch.sent ?? 0),
        blocker: emailDispatch.blocker ?? "analytics connector not wired",
      },
      nextActions: asArray(growthQueue.topGrowthMoves).slice(0, 3),
    },
    {
      lane: "Bizdev",
      ownerAgent: "scout",
      goal: "Scan nursing forums and creator channels for unmet needs; produce weekly opportunity briefs.",
      status: liveOpportunities.length || topManualQueue.length ? "brief_seeded" : "missing_public_source_ingest",
      progress: liveOpportunities.length || topManualQueue.length ? 55 : 10,
      blocked: liveOpportunities.length === 0 && topManualQueue.length === 0,
      metrics: {
        liveOpportunities: liveOpportunities.length,
        manualQueue: topManualQueue.length,
        searchAccess: opportunity.searchAccess ?? "unknown",
      },
      nextActions: asArray(opportunity.nextActions).slice(0, 3),
    },
    {
      lane: "Intel",
      ownerAgent: "explorer",
      goal: "Monitor UWorld, Archer, Bootcamp, and NCLEX market movement without private scraping.",
      status: watchlist.length ? "watchlist_seeded" : "competitor_ledger_missing",
      progress: watchlist.length ? 35 : 10,
      blocked: true,
      metrics: {
        watchlistItems: watchlist.length,
        competitorLedger: "missing",
        tosBoundary: "public and official sources only",
      },
      nextActions: [
        "Create credential-gated public-source connector entries before automated competitor monitoring.",
        "Keep findings candidate-only until operator approves memory promotion.",
      ],
    },
  ];

  const blockers = lanes.filter((lane) => lane.blocked).map((lane) => ({
    lane: lane.lane,
    status: lane.status,
    reason: lane.metrics.blocker ?? lane.status,
  }));

  return {
    generatedAt: nowIso(),
    phase: "Phase 6",
    project: "NCLEX SaaS",
    domain: "claritynclex.chapaisolutions.com",
    sourceFreshness: {
      bankHealth: health.generatedAt ?? fileMtime(healthPath),
      refinement: refinement.generatedAt ?? fileMtime(refinementPath),
      topUp: topUp.generatedAt ?? fileMtime(topUpPath),
      promotion: promotion.generatedAt ?? fileMtime(promotionPath),
      growthQueue: growthQueue.generatedAt ?? fileMtime(growthQueuePath),
      emailDispatch: emailDispatch.generatedAt ?? fileMtime(emailDispatchPath),
      opportunityRadar: opportunity.generatedAt ?? fileMtime(opportunityPath),
    },
    kpis: {
      liveQuestions: canonicalLive,
      targetQuestions: targetCount,
      remainingToTarget,
      progressPct: pct(canonicalLive, targetCount),
      usableTarget: 5000,
      progressToUsableTargetPct: pct(approvedUsable, 5000),
      ngnLive: format.ngn,
      ngnRatio: format.ngnRatio,
      ngnTarget,
      approvedRefinedUsable: approvedUsable,
      needsReview,
      remainingTo5000,
      duplicateFamiliesCollapsed,
      duplicateFingerprintsCollapsed,
    },
    truth: {
      deploymentParity,
      syncParity,
      topItemDeficits,
      topClientNeedDeficits,
      promotion: {
        batchId: promotion.batchId ?? null,
        promotableCount: Number(promotionSummary.promotableCount ?? 0),
        duplicateFingerprintCount: Number(promotionSummary.duplicateFingerprintCount ?? 0),
        liveCollisionCount: Number(promotionSummary.liveCollisionCount ?? 0),
      },
      nextAction: topUp.nextAction ?? null,
    },
    lanes,
    blockers,
    sourceFiles: [healthPath, refinementPath, topUpPath, promotionPath, growthQueuePath, emailDispatchPath, opportunityPath],
  };
}

function clearStreams() {
  if (!reset || dryRun || !fs.existsSync(connectorRoot)) return;
  for (const file of fs.readdirSync(connectorRoot)) {
    if (file.endsWith(".jsonl") || file === "phase6-state.json") {
      fs.rmSync(path.join(connectorRoot, file), { force: true });
    }
  }
}

function emitState(state) {
  clearStreams();
  const emitted = [];
  const goalEvents = state.lanes.map((lane) => event("phase6_goal", {
    project: state.project,
    domain: state.domain,
    lane: lane.lane,
    owner_agent: lane.ownerAgent,
    goal: lane.goal,
    status: lane.status,
    progress: lane.progress,
    blocked: lane.blocked,
    metrics: lane.metrics,
    next_actions: lane.nextActions,
  }, { sourceFiles: state.sourceFiles }));
  const kpiEvent = event("phase6_kpi", {
    project: state.project,
    domain: state.domain,
    kpis: state.kpis,
    source_freshness: state.sourceFreshness,
  }, { sourceFiles: state.sourceFiles });
  const blockerEvent = event("phase6_blocker", {
    project: state.project,
    blockers: state.blockers,
  }, { sourceFiles: state.sourceFiles });

  for (const item of goalEvents) {
    appendJsonl(path.join(connectorRoot, "phase6_goal.jsonl"), item);
    emitted.push(item);
  }
  appendJsonl(path.join(connectorRoot, "phase6_kpi.jsonl"), kpiEvent);
  appendJsonl(path.join(connectorRoot, "phase6_blocker.jsonl"), blockerEvent);
  emitted.push(kpiEvent, blockerEvent);
  writeJson(statePath, state);
  return emitted;
}

function readJsonl(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
      .filter((entry) => entry.line)
      .map((entry) => {
        try {
          return { lineNumber: entry.lineNumber, event: JSON.parse(entry.line) };
        } catch {
          return { lineNumber: entry.lineNumber, event: null };
        }
      });
  } catch {
    return [];
  }
}

function connectorFiles() {
  if (!fs.existsSync(connectorRoot)) return [];
  return fs.readdirSync(connectorRoot)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(connectorRoot, file));
}

function validateStreams() {
  const failures = [];
  let files = 0;
  let events = 0;
  for (const filePath of connectorFiles()) {
    files += 1;
    for (const row of readJsonl(filePath)) {
      events += 1;
      const parsed = row.event;
      const relative = normalizePath(path.relative(root, filePath));
      if (!parsed) {
        failures.push(`${relative}:${row.lineNumber} invalid json`);
        continue;
      }
      for (const key of ["event_id", "schema_version", "source", "event_type", "emitted_at", "observed_at", "connector_run_id", "taint", "allowed_uses", "provenance", "payload"]) {
        if (parsed[key] === undefined) failures.push(`${relative}:${row.lineNumber} missing ${key}`);
      }
      if (parsed.schema_version !== schemaVersion) failures.push(`${relative}:${row.lineNumber} schema mismatch`);
      if (parsed.source !== "nclex-saas") failures.push(`${relative}:${row.lineNumber} wrong source`);
      if (parsed.event_type === "phase6_goal" && !parsed.payload?.lane) failures.push(`${relative}:${row.lineNumber} missing lane`);
      if (parsed.event_type === "phase6_kpi" && !parsed.payload?.kpis) failures.push(`${relative}:${row.lineNumber} missing kpis`);
    }
  }
  return { ok: failures.length === 0, files, events, failures };
}

function writeProof(result) {
  const proof = args.get("proof");
  if (!proof) return;
  writeJson(path.resolve(root, String(proof)), result);
}

if (validateOnly) {
  const validation = validateStreams();
  const result = { ok: validation.ok, runId, validation, state: readJson(normalizePath(path.relative(root, statePath)), null) };
  writeProof(result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(validation.ok ? 0 : 1);
}

const state = buildState();
const emitted = emitState(state);
const validation = dryRun ? { ok: true, files: 0, events: emitted.length, failures: [] } : validateStreams();
const result = {
  ok: validation.ok,
  dryRun,
  runId,
  emitted: emitted.length,
  connectorRoot: normalizePath(path.relative(root, connectorRoot)),
    kpis: state.kpis,
    truth: state.truth,
    blockers: state.blockers,
    validation,
  };
writeProof(result);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exit(validation.ok ? 0 : 1);
