#!/usr/bin/env node
// Admin CLI for institutional access keys.
//
//   node scripts/manage-access-keys.mjs list
//   node scripts/manage-access-keys.mjs generate --institution "Rio Hondo ADN" --seats 35 --days 30 [--prefix RIOHONDO]
//   node scripts/manage-access-keys.mjs disable  <CODE>
//   node scripts/manage-access-keys.mjs expire   <CODE>
//
// Writes config/access-keys.json (the bundled store). On the next runtime access
// the worker's ensureRuntimeAccessKeyStore() syncs new/updated keys into D1.
// To push immediately to prod without a deploy:
//   npx wrangler d1 execute chapai-prod --remote --command "<the printed SQL>"

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const STORE = path.join(process.cwd(), "config", "access-keys.json");

function load() {
  if (!fs.existsSync(STORE)) return { generatedAt: new Date().toISOString(), keys: [] };
  return JSON.parse(fs.readFileSync(STORE, "utf8"));
}
function save(store) {
  store.generatedAt = new Date().toISOString();
  fs.writeFileSync(STORE, JSON.stringify(store, null, 2) + "\n", "utf8");
}
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function randomCode(prefix) {
  return `${prefix}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

const cmd = process.argv[2];
const store = load();

if (cmd === "list") {
  for (const k of store.keys) {
    console.log(`${k.status.padEnd(8)} ${k.code.padEnd(28)} ${k.redeemCount}/${k.maxRedeems} seats  ${k.expiresAt ? "exp " + k.expiresAt.slice(0, 10) : "no-expiry"}  ${k.notes ?? ""}`);
  }
  console.log(`\n${store.keys.length} keys total.`);
} else if (cmd === "generate") {
  const institution = arg("--institution", "Trial cohort");
  const seats = Number(arg("--seats", "30"));
  const days = Number(arg("--days", "30"));
  const prefix = arg("--prefix", "CLARITY-TRIAL");
  const code = randomCode(prefix);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const record = {
    id: `trial-${crypto.randomBytes(4).toString("hex")}`,
    code,
    type: "demo-pass",
    scope: "all",
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt, // key itself stops working after this window
    maxRedeems: seats,
    redeemCount: 0,
    lastRedeemedAt: null,
    notes: institution, // surfaced as the "institution" in the grant ledger
  };
  store.keys.push(record);
  save(store);
  console.log(`Generated key for "${institution}":\n\n  ${code}\n\n  ${seats} seats · ${days}-day per-student trial · key valid until ${expiresAt.slice(0, 10)}`);
  console.log(`\nPush to prod D1 now (no deploy needed):\n  npx wrangler d1 execute chapai-prod --remote --command "INSERT INTO access_keys (id, code, normalized_code, type, scope, status, created_at, expires_at, max_redeems, redeem_count, notes) VALUES ('${record.id}','${code}','${code}','demo-pass','all','active',unixepoch(),${Math.floor(Date.parse(expiresAt) / 1000)},${seats},0,'${institution.replace(/'/g, "''")}')"`);
} else if (cmd === "disable" || cmd === "expire") {
  const code = process.argv[3]?.toUpperCase();
  const key = store.keys.find((k) => k.code.toUpperCase() === code);
  if (!key) {
    console.error(`No key found with code ${code}`);
    process.exit(1);
  }
  key.status = cmd === "disable" ? "revoked" : "expired";
  save(store);
  console.log(`Key ${code} set to ${key.status}.`);
  console.log(`Push to prod D1 now:\n  npx wrangler d1 execute chapai-prod --remote --command "UPDATE access_keys SET status='${key.status}' WHERE normalized_code='${code}'"`);
} else {
  console.log("Usage: list | generate --institution <name> --seats <n> --days <n> [--prefix X] | disable <CODE> | expire <CODE>");
  process.exit(1);
}
