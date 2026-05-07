#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.length ? rest.join("=") : "true"];
}));

const dryRun = args.has("dry-run");
const retentionDays = Number(args.get("retention-days") ?? process.env.CHAPAI_BACKUP_RETENTION_DAYS ?? 14);

function findRoot() {
  let current = path.resolve(String(args.get("root") ?? process.cwd()));
  for (let index = 0; index < 8; index += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) break;
    current = next;
  }
  return path.resolve(String(args.get("root") ?? process.cwd()));
}

const root = findRoot();
const backupDir = path.resolve(String(args.get("backup-dir") ?? process.env.CHAPAI_BACKUP_DIR ?? path.join(root, "backups", "ops")));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const stagingDir = path.join(backupDir, `chapai-${timestamp}`);
const archivePath = path.join(backupDir, `chapai-${timestamp}.tar.gz`);

const sources = [
  "config",
  "brains",
  "audit",
  "packages/db/drizzle",
  "packages/content/questions/nclex/live",
  "packages/content/questions/ccrn/live",
].filter((relativePath) => fs.existsSync(path.join(root, relativePath)));

function run(command, commandArgs, options = {}) {
  if (dryRun) {
    return { status: 0, stdout: "", stderr: "", command: [command, ...commandArgs].join(" "), dryRun: true };
  }
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
    command: [command, ...commandArgs].join(" "),
  };
}

function copySources() {
  if (dryRun) {
    return;
  }
  fs.mkdirSync(stagingDir, { recursive: true });
  for (const relativePath of sources) {
    const source = path.join(root, relativePath);
    const target = path.join(stagingDir, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true });
  }
}

function dumpPostgres() {
  if (!process.env.DATABASE_URL) {
    return { status: "skipped", reason: "DATABASE_URL not set" };
  }
  const output = path.join(stagingDir, "postgres", "chapai-memory.sql");
  if (!dryRun) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
  }
  const result = run("pg_dump", [process.env.DATABASE_URL, "--file", output, "--no-owner", "--no-privileges"]);
  return {
    status: result.status === 0 ? "dumped" : "failed",
    output,
    error: result.stderr || undefined,
  };
}

function makeArchive() {
  if (dryRun) {
    return { status: "dry-run", archivePath };
  }
  const result = run("tar", ["-czf", archivePath, "-C", stagingDir, "."]);
  if (result.status !== 0) {
    throw new Error(result.stderr || `tar exited ${result.status}`);
  }
  const resolvedStaging = path.resolve(stagingDir);
  const resolvedBackup = path.resolve(backupDir);
  if (!resolvedStaging.startsWith(resolvedBackup)) {
    throw new Error(`Refusing to remove staging outside backup dir: ${resolvedStaging}`);
  }
  fs.rmSync(stagingDir, { recursive: true, force: true });
  return { status: "archived", archivePath };
}

function uploadArchive() {
  const target = process.env.HETZNER_STORAGE_BOX_TARGET;
  if (!target) {
    return { status: "local-only", reason: "HETZNER_STORAGE_BOX_TARGET not set" };
  }
  const result = run("rsync", ["-az", archivePath, target]);
  return {
    status: result.status === 0 ? "uploaded" : "failed",
    target,
    error: result.stderr || undefined,
  };
}

function pruneRetention() {
  if (dryRun || !fs.existsSync(backupDir)) {
    return { deleted: [] };
  }
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const resolvedBackup = path.resolve(backupDir);
  const deleted = [];
  for (const file of fs.readdirSync(backupDir)) {
    if (!/^chapai-.*\.tar\.gz$/.test(file)) continue;
    const filePath = path.resolve(path.join(backupDir, file));
    if (!filePath.startsWith(resolvedBackup)) continue;
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < cutoff) {
      fs.rmSync(filePath, { force: true });
      deleted.push(file);
    }
  }
  return { deleted };
}

function main() {
  copySources();
  const postgres = dumpPostgres();
  const archive = makeArchive();
  const upload = uploadArchive();
  const retention = pruneRetention();
  process.stdout.write(`${JSON.stringify({
    ok: true,
    dryRun,
    root,
    backupDir,
    sources,
    postgres,
    archive,
    upload,
    retention,
  })}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
}
