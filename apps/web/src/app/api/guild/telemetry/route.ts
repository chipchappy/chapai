import { allowLocalFallbacks, getServerEnv } from "@/lib/env";
import { validateAccessKeyRuntime } from "@/lib/access-keys";
import { hasDatabase, resolveEnv, type Env } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TelemetryBinding = {
  prepare: (sql: string) => {
    bind: (...values: Array<string | number | null>) => { run: () => Promise<{ success?: boolean }> };
    run: () => Promise<{ success?: boolean }>;
  };
};

type GuildTelemetryPayload = {
  kind?: "heartbeat" | "event" | "checkpoint" | "memory_candidate" | "approval_draft" | "boardroom" | "unified_guild_state";
  agentId?: string;
  runtime?: string;
  source?: string;
  status?: string;
  summary?: string;
  payload?: unknown;
};

function asTelemetryBinding(env: Partial<Env>): TelemetryBinding | null {
  if (!hasDatabase(env) || !env.DB) {
    return null;
  }
  return env.DB as TelemetryBinding;
}

async function hmacSha256Hex(secret: string, body: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let result = left.length === right.length ? 0 : 1;
  for (let index = 0; index < maxLength; index += 1) {
    result |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return result === 0;
}

async function verifySignature(rawBody: string, header: string | null, secret?: string) {
  if (!secret) {
    return false;
  }
  const expected = `sha256=${await hmacSha256Hex(secret, rawBody)}`;
  return constantTimeEqual(header ?? "", expected);
}

async function verifyTelemetryAccessKey(header: string | null) {
  const record = await validateAccessKeyRuntime(header);
  return Boolean(record && ["founder-pass", "creator-pass", "tester-pass"].includes(record.type));
}

function workspaceRoot() {
  let current = process.cwd();
  for (let index = 0; index < 6; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return process.cwd();
}

async function ensureTelemetryStore(binding: TelemetryBinding) {
  await binding.prepare(`
    CREATE TABLE IF NOT EXISTS guild_telemetry_events (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      agent_id TEXT,
      runtime TEXT,
      source TEXT,
      status TEXT,
      summary TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
}

async function persistTelemetry(event: Required<Pick<GuildTelemetryPayload, "kind">> & GuildTelemetryPayload & { verified: boolean; receivedAt: string }) {
  const env = resolveEnv();
  const binding = asTelemetryBinding(env);
  const eventId = crypto.randomUUID();
  if (binding) {
    await ensureTelemetryStore(binding);
    await binding.prepare(`
      INSERT INTO guild_telemetry_events (id, kind, agent_id, runtime, source, status, summary, verified, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
    `).bind(
      eventId,
      event.kind,
      event.agentId ?? null,
      event.runtime ?? null,
      event.source ?? null,
      event.status ?? null,
      event.summary ?? null,
      event.verified ? 1 : 0,
      JSON.stringify(event),
    ).run();
    return { eventId, stored: "d1" };
  }

  if (allowLocalFallbacks(env)) {
    const output = path.join(workspaceRoot(), "config", "guild-telemetry-ingest.jsonl");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.appendFileSync(output, `${JSON.stringify({ eventId, ...event })}\n`, "utf8");
    return { eventId, stored: "file" };
  }

  return { eventId, stored: "not-persisted" };
}

export async function POST(request: Request) {
  const env = getServerEnv();
  const rawBody = await request.text();
  const verified = await verifySignature(rawBody, request.headers.get("x-guild-signature"), env.GUILD_TELEMETRY_SECRET);
  const keyVerified = await verifyTelemetryAccessKey(request.headers.get("x-guild-access-key"));

  if (env.APP_ENV === "production" && !verified && !keyVerified) {
    return NextResponse.json({ error: "Valid guild telemetry signature required." }, { status: 401 });
  }

  let body: GuildTelemetryPayload;
  try {
    body = JSON.parse(rawBody) as GuildTelemetryPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON telemetry payload." }, { status: 400 });
  }

  const event = {
    kind: body.kind ?? "event",
    agentId: body.agentId,
    runtime: body.runtime,
    source: body.source ?? "local-guild",
    status: body.status,
    summary: body.summary,
    payload: body.payload ?? body,
    verified: verified || keyVerified,
    receivedAt: new Date().toISOString(),
  };

  const result = await persistTelemetry(event);
  return NextResponse.json({ ok: true, verified: verified || keyVerified, ...result });
}
