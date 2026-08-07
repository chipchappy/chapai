#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Bulk publish_state change driven by an explicit id manifest.
//
// Deliberately manifest-driven rather than predicate-driven: the exact rows that
// changed are recorded on disk, so the operation is reversible by re-running with
// the opposite --state. A predicate ("everything scoring under X") could not be
// reversed once the scores shift underneath it.
//
//   node scripts/set-publish-state-from-manifest.mjs \
//     --manifest reports/tier4-unpublish-manifest.json --state unpublished
//
//   # revert:
//   ... --manifest reports/tier4-unpublish-manifest.json --state published
//
// --dry-run reports what would change without writing.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DRY = args.includes("--dry-run");
const MANIFEST = resolve(ROOT, flag("manifest", ""));
const STATE = flag("state", "");
const BATCH = Number(flag("batch", "150"));

if (!MANIFEST || !STATE) {
  console.error("Both --manifest and --state are required.");
  process.exit(1);
}
if (!["published", "unpublished", "draft"].includes(STATE)) {
  console.error(`Refusing: --state must be published | unpublished | draft (got "${STATE}").`);
  process.exit(1);
}

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;  // deploy-scoped; D1 rejects it
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const raw = execFileSync(process.execPath, [
    WRANGLER, "d1", "execute", "chapai-prod", "--remote", "--json", "--command", sql.replace(/\s+/g, " ").trim(),
  ], { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf("[")))[0];
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const ids = [...new Set(manifest.ids ?? [])].filter(Boolean);
if (!ids.length) {
  console.error("Manifest contains no ids.");
  process.exit(1);
}

const quote = (id) => `'${String(id).replace(/'/g, "''")}'`;
console.log(`Manifest: ${ids.length} ids  →  publish_state='${STATE}'${DRY ? "  (dry run)" : ""}`);

let changed = 0;
for (let i = 0; i < ids.length; i += BATCH) {
  const slice = ids.slice(i, i + BATCH);
  const list = slice.map(quote).join(",");
  if (DRY) {
    const probe = d1(`SELECT COUNT(*) AS n FROM questions WHERE id IN (${list}) AND publish_state <> '${STATE}'`);
    changed += Number(probe?.results?.[0]?.n ?? 0);
  } else {
    const result = d1(`UPDATE questions SET publish_state='${STATE}' WHERE id IN (${list})`);
    changed += Number(result?.meta?.changes ?? 0);
  }
  process.stdout.write(`\r  ${Math.min(i + BATCH, ids.length)}/${ids.length}`);
}
process.stdout.write("\n");

console.log(DRY ? `Would change ${changed} rows.` : `Changed ${changed} rows.`);
const after = d1("SELECT publish_state, COUNT(*) n FROM questions GROUP BY publish_state");
console.log("publish_state now:", JSON.stringify(after?.results ?? []));
