#!/usr/bin/env node
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const agentId = String(args.get("agent") ?? process.env.CHAPAI_AGENT_ID ?? "").trim();
const endpoint = String(args.get("url") ?? process.env.CHAPAI_HEARTBEAT_URL ?? "http://127.0.0.1:3000/heartbeats");
const token = String(args.get("token") ?? process.env.CHAPAI_HEARTBEAT_TOKEN ?? "");
const intervalMs = Number(args.get("interval-ms") ?? 30_000);
const once = args.has("once");

if (!agentId) {
  process.stderr.write("Missing --agent or CHAPAI_AGENT_ID.\n");
  process.exit(2);
}

async function sendHeartbeat() {
  const payload = {
    agentId,
    state: String(args.get("state") ?? process.env.CHAPAI_AGENT_STATE ?? "running"),
    current: String(args.get("current") ?? process.env.CHAPAI_AGENT_CURRENT ?? "systemd supervised runtime"),
    latest: String(args.get("latest") ?? process.env.CHAPAI_AGENT_LATEST ?? "heartbeat emitted by chapai-heartbeat"),
    blocker: String(args.get("blocker") ?? process.env.CHAPAI_AGENT_BLOCKER ?? "none"),
    source: String(args.get("source") ?? "systemd-agent"),
    staleAfterSeconds: Number(args.get("stale-after-seconds") ?? 90),
  };

  const headers = { "content-type": "application/json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Heartbeat failed with HTTP ${response.status}: ${body}`);
  }
  return body;
}

async function main() {
  do {
    const result = await sendHeartbeat();
    process.stdout.write(`${new Date().toISOString()} ${agentId} ${result}\n`);
    if (once) break;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  } while (true);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
