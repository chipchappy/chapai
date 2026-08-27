#!/usr/bin/env node
/**
 * backup-to-r2.mjs — push everything irreplaceable off this machine.
 *
 *   node scripts/backup-to-r2.mjs             # D1 + untracked content
 *   node scripts/backup-to-r2.mjs --d1-only   # just the database
 *   node scripts/backup-to-r2.mjs --dry-run   # show the plan, touch nothing
 *
 * What is NOT backed up here, because it is already safe:
 *   - application source        -> pushed to GitHub
 *   - the deployed site itself  -> a Cloudflare Worker at the edge
 *   - node_modules / .next      -> regenerable from the lockfile
 *
 * What IS backed up, because it exists in exactly one place:
 *   - the chapai-prod D1 database (the live question bank, users, billing)
 *   - packages/content/staging/promoted-v5 (untracked; feeds the prod sync)
 *
 * Every upload is verified by re-downloading and comparing SHA-256. A backup
 * that has not been read back is a guess, not a backup.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, existsSync, statSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = process.env.BACKUP_BUCKET || "clarityccrn-guild-backups";
const DB = process.env.BACKUP_D1 || "chapai-prod";
const STAMP = new Date().toISOString().slice(0, 10);
const OUT = join(ROOT, "..", "_backups", STAMP);

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const D1_ONLY = args.has("--d1-only");

const log = (...a) => console.log(...a);
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

function run(cmd, cmdArgs, opts = {}) {
  if (DRY) { log(`  [dry-run] ${cmd} ${cmdArgs.join(" ")}`); return ""; }
  return execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28, ...opts });
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/** Upload, then download to a temp path and compare hashes before declaring success. */
function uploadVerified(localPath, key) {
  const local = sha(localPath);
  log(`  uploading -> r2://${BUCKET}/${key}`);
  run(npx, ["wrangler", "r2", "object", "put", `${BUCKET}/${key}`, "--file", localPath, "--remote"]);

  if (DRY) return true;

  const probe = `${localPath}.verify`;
  try {
    run(npx, ["wrangler", "r2", "object", "get", `${BUCKET}/${key}`, "--file", probe, "--remote"]);
    const remote = sha(probe);
    if (remote !== local) throw new Error(`SHA mismatch: local ${local.slice(0, 12)} vs remote ${remote.slice(0, 12)}`);
    log(`  verified sha256 ${local.slice(0, 16)}`);
    return true;
  } finally {
    if (existsSync(probe)) rmSync(probe, { force: true });
  }
}

function backupD1() {
  const file = join(OUT, `${DB}-${STAMP.replace(/-/g, "")}.sql`);
  log(`\nD1 export: ${DB}`);
  run(npx, ["wrangler", "d1", "export", DB, "--remote", "--output", file]);
  if (DRY) return;

  const size = statSync(file).size;
  const body = readFileSync(file, "utf8");
  const tables = (body.match(/^CREATE TABLE/gm) || []).length;
  const inserts = (body.match(/^INSERT INTO/gm) || []).length;

  // A dump that parsed to almost nothing means the export failed quietly.
  if (tables < 10 || inserts < 100) {
    throw new Error(`Export looks truncated: ${tables} tables, ${inserts} inserts — refusing to call this a backup`);
  }
  log(`  ${mb(size)}, ${tables} tables, ${inserts} inserts`);
  uploadVerified(file, `d1/${DB}-${STAMP}.sql`);
}

function backupContent() {
  const staging = join(ROOT, "packages", "content", "staging");
  const dirs = ["promoted-v5", "promoted-v6"].filter((d) => existsSync(join(staging, d)));
  if (dirs.length === 0) { log("\nNo untracked content generations found — skipping."); return; }

  for (const d of dirs) {
    const tgz = join(OUT, `${d}.tar.gz`);
    log(`\nContent archive: ${d}`);
    run("tar", ["-czf", tgz, "-C", staging, d]);
    if (DRY) continue;
    log(`  ${mb(statSync(tgz).size)}`);
    uploadVerified(tgz, `content/${STAMP}/${d}.tar.gz`);
  }
}

log(`chapai backup -> r2://${BUCKET}  (${STAMP})${DRY ? "  [DRY RUN]" : ""}`);
if (!DRY) mkdirSync(OUT, { recursive: true });

try {
  backupD1();
  if (!D1_ONLY) backupContent();
  log(`\nDone. Local copies in ${OUT}`);
  log("These are verified round-trip. Local copies are disposable; R2 is the backup.");
} catch (err) {
  console.error(`\nBACKUP FAILED: ${err.message}`);
  console.error("Do not delete anything locally until this succeeds.");
  process.exit(1);
}
