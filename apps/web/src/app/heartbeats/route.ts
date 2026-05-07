import { listHeartbeatSupervision, recordAgentHeartbeat } from "@/lib/ops-heartbeats";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const heartbeatSchema = z.object({
  agentId: z.string().min(1).max(80),
  state: z.string().min(1).max(40).optional(),
  current: z.string().max(500).optional(),
  latest: z.string().max(1000).optional(),
  blocker: z.string().max(500).optional(),
  source: z.string().max(80).optional(),
  nextWakeAt: z.string().datetime().nullable().optional(),
  staleAfterSeconds: z.number().int().min(30).max(3600).optional(),
});

function constantTimeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let result = left.length === right.length ? 0 : 1;
  for (let index = 0; index < maxLength; index += 1) {
    result |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return result === 0;
}

function authorizeHeartbeat(request: Request) {
  const expected = process.env.CHAPAI_HEARTBEAT_TOKEN;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const header = request.headers.get("x-chapai-heartbeat-token") ?? "";
  if (expected) {
    return constantTimeEqual(bearer || header, expected);
  }
  return (process.env.APP_ENV ?? "development") !== "production";
}

export async function GET(request: Request) {
  if (!authorizeHeartbeat(request)) {
    return NextResponse.json({ error: "Heartbeat token required." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, supervision: listHeartbeatSupervision() });
}

export async function POST(request: Request) {
  if (!authorizeHeartbeat(request)) {
    return NextResponse.json({ error: "Heartbeat token required." }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = heartbeatSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid heartbeat payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const heartbeat = recordAgentHeartbeat(parsed.data);
  return NextResponse.json({ ok: true, heartbeat, supervision: listHeartbeatSupervision() });
}
