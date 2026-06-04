#!/usr/bin/env node
// Predeploy guardrail.
// Aborts the deploy if the local HEAD is older than the commit currently
// running in production. Catches the cross-machine drift scenario where a
// stale checkout would otherwise roll back live code.
//
// Strategy:
//   1. Fetch https://claritynclex.com/api/version -> { commit }
//   2. Run `git merge-base --is-ancestor <prod-commit> HEAD`
//      - exit 0  → HEAD is at-or-descendant of prod → safe to deploy
//      - exit 1  → HEAD is older or diverged → abort
//
// Bypass: set DEPLOY_SKIP_GUARD=1 (used in CI or after manual review).
const { execSync, spawnSync } = require("node:child_process");

const PROD_URL = process.env.DEPLOY_VERSION_URL || "https://claritynclex.com/api/version";

if (process.env.DEPLOY_SKIP_GUARD === "1") {
  console.log("[predeploy] guardrail skipped via DEPLOY_SKIP_GUARD=1");
  process.exit(0);
}

function gitHead() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch (err) {
    console.error("[predeploy] could not read local HEAD:", err.message);
    process.exit(1);
  }
}

async function fetchProdCommit() {
  try {
    const res = await fetch(PROD_URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const payload = await res.json().catch(() => null);
    return payload?.data?.commit ?? null;
  } catch {
    return null;
  }
}

function isAncestor(ancestor, descendant) {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
    stdio: "pipe",
  });
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  // 128 = unknown commit (likely the prod commit isn't in local repo — needs fetch)
  return null;
}

async function main() {
  const localHead = gitHead();
  console.log(`[predeploy] local HEAD: ${localHead}`);

  const prodCommit = await fetchProdCommit();
  if (!prodCommit) {
    console.log("[predeploy] could not read production commit — first deploy or endpoint down. Continuing.");
    return;
  }
  console.log(`[predeploy] production commit: ${prodCommit}`);

  if (prodCommit === localHead) {
    console.log("[predeploy] HEAD matches production. Continuing.");
    return;
  }

  // Try fast path first
  const result = isAncestor(prodCommit, localHead);
  if (result === true) {
    console.log("[predeploy] HEAD is a descendant of production. Safe to deploy.");
    return;
  }
  if (result === false) {
    console.error(`
[predeploy] ABORT — local HEAD is OLDER than production.
  Production:  ${prodCommit}
  Local HEAD:  ${localHead}

This deploy would roll production back.
Run \`git pull --ff-only\` first, then retry.
Bypass with DEPLOY_SKIP_GUARD=1 only after confirming intentional rollback.
`);
    process.exit(1);
  }

  // result === null → production commit unknown in this repo. Try fetching.
  console.log("[predeploy] production commit not in local repo, fetching...");
  try {
    execSync("git fetch origin --quiet", { stdio: "inherit" });
  } catch {
    // fetch failure isn't fatal
  }
  const retry = isAncestor(prodCommit, localHead);
  if (retry === true) {
    console.log("[predeploy] after fetch, HEAD is a descendant. Safe to deploy.");
    return;
  }
  if (retry === false) {
    console.error(`
[predeploy] ABORT — after fetch, local HEAD is still not a descendant of production.
This indicates a diverged branch or unpushed remote commits.
Bypass with DEPLOY_SKIP_GUARD=1 only after manual review.
`);
    process.exit(1);
  }
  console.warn("[predeploy] could not verify ancestry even after fetch. Allowing deploy with warning.");
}

main().catch((err) => {
  console.error("[predeploy] unexpected error:", err);
  // Don't block deploy on guardrail's own bug; just warn.
  process.exit(0);
});
