#!/usr/bin/env node
/**
 * author-deep-rationales.mjs
 *
 * Backfills the `deep_rationale` column (and any empty `distractor_rationales`)
 * for published NCLEX/CCRN questions using the Anthropic API. Resumable +
 * idempotent — skips rows that already have `deep_rationale_authored_at` set.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/author-deep-rationales.mjs [opts]
 *
 * Options:
 *   --exam=nclex|ccrn|all   (default: nclex)
 *   --limit=N               (default: 25 — how many questions to author this run)
 *   --model=<id>            (default: claude-haiku-4-5-20251001)
 *   --concurrency=N         (default: 4)
 *   --dry-run               (don't write to D1, just print samples)
 *   --where="extra SQL"     (additional WHERE clause, e.g. "category='cardiac'")
 *
 * What this script does PER QUESTION:
 *   1. Asks Claude to author a 600-1200 char deep rationale that includes:
 *        - The clinical mechanism / pathophysiology
 *        - Why each option is right or wrong (per-distractor reasoning)
 *        - One memorable clinical pearl
 *   2. If distractor_rationales is empty, asks Claude to produce a {A:..,B:..}
 *      JSON object covering every wrong option.
 *   3. Updates the row in D1 in one UPDATE per question via wrangler d1
 *      execute (buffered into a single multi-statement file per batch).
 *
 * Cost guardrails:
 *   - Haiku 4.5 input ~$1/MTok, output ~$5/MTok. Per question:
 *     ~600 input tokens + ~500 output tokens = $0.003. 1,910 questions ≈ $5.70.
 *   - Run with --limit=25 first to verify quality before scaling up.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve as pathResolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = pathResolve(__dirname, "..");
const WEB_DIR = pathResolve(REPO_ROOT, "apps/web");
const TMP_DIR = pathResolve(REPO_ROOT, ".deep-rationale-tmp");
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const EXAM = args.exam ?? "nclex";
const LIMIT = Number(args.limit ?? 25);
const MODEL = args.model ?? "claude-haiku-4-5-20251001";
const CONCURRENCY = Math.max(1, Number(args.concurrency ?? 4));
const DRY_RUN = Boolean(args["dry-run"]);
const EXTRA_WHERE = args.where ? `AND ${args.where}` : "";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY env var is required.");
  process.exit(1);
}

const EXAM_CLAUSE = EXAM === "all" ? "" : `AND exam='${EXAM}'`;

const FETCH_SQL = `
  SELECT id, exam, type, category, subcategory, difficulty,
         stem, options, answer, rationale, distractor_rationales
  FROM questions
  WHERE publish_state='published'
    AND deep_rationale_authored_at IS NULL
    ${EXAM_CLAUSE}
    ${EXTRA_WHERE}
  ORDER BY rowid
  LIMIT ${LIMIT}
`.trim();

/** Run a wrangler d1 execute command, return parsed JSON results. */
function wranglerD1(sqlOrFile, isFile = false) {
  const flag = isFile ? "--file" : "--command";
  const result = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", "chapai-prod", "--remote", "--json", `${flag}=${sqlOrFile}`],
    { cwd: WEB_DIR, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: true },
  );
  if (result.status !== 0) {
    console.error("wrangler d1 execute failed:", result.stderr || result.stdout);
    throw new Error(`wrangler d1 execute exited ${result.status}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (e) {
    console.error("Could not parse wrangler JSON output:", result.stdout.slice(0, 500));
    throw e;
  }
}

function escapeSql(s) {
  return String(s ?? "").replace(/'/g, "''");
}

function buildPrompt(q) {
  // Parse options safely
  let options = q.options;
  try { options = JSON.parse(q.options); } catch {}
  const optionsText = Array.isArray(options) ? options.join("\n") : String(options ?? "");
  let existingDistractors = {};
  try { existingDistractors = JSON.parse(q.distractor_rationales || "{}"); } catch {}
  const hasDistractors = Object.keys(existingDistractors).length > 0;
  const examLabel = q.exam === "ccrn" ? "CCRN" : "NCLEX-RN";

  return `You are authoring a premium "deep dive" rationale for an ${examLabel} practice question.

QUESTION CATEGORY: ${q.category}${q.subcategory ? ` — ${q.subcategory}` : ""}
QUESTION TYPE: ${q.type}
DIFFICULTY: ${q.difficulty}/5

STEM:
${q.stem}

OPTIONS:
${optionsText}

CORRECT ANSWER: ${q.answer}

EXISTING SHORT RATIONALE (do not repeat — go deeper):
${q.rationale}

Write a 600-1200 character "deep rationale" with this structure:
1. Pathophysiology / mechanism (why this clinical pattern produces these findings)
2. Why the correct answer wins (the decisive clinical reasoning, not just the answer key)
3. Per-distractor: brief one-line on why each WRONG option fails (common test trap)
4. One memorable clinical pearl or pitfall (something a student can carry into other questions)

Tone: confident, clinical, NCLEX/CCRN exam-prep voice. No filler ("recognize the cue", "the priority action"). Cite specific values, mechanisms, drug classes, lab thresholds where relevant. Reference NCSBN/AACN/AHA/ACLS conventions when applicable but inline (not as a citation list).

${hasDistractors ? "" : `
ALSO: Author per-distractor rationales as a JSON object covering EVERY wrong option (1-2 sentences each, clinical not generic).
`}

Return STRICT JSON only, no markdown, no prose outside JSON:
{
  "deep_rationale": "...",
  ${hasDistractors ? "" : '"distractor_rationales": { "A": "...", "B": "...", ... },'}
  "tags": ["short", "clinical", "key-concepts"]
}`;
}

/** Call Anthropic Messages API (REST, no SDK). Returns parsed JSON object. */
async function authorOne(q) {
  const prompt = buildPrompt(q);
  const body = {
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 400)}`);
  }

  const payload = await res.json();
  const text = payload.content?.[0]?.text ?? "";
  // Strip ```json fences if present
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Could not parse JSON from model output: ${cleaned.slice(0, 200)}`);
  }
}

async function runConcurrent(items, fn, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = idx++;
        if (i >= items.length) return;
        try {
          results[i] = { ok: true, value: await fn(items[i], i) };
        } catch (e) {
          results[i] = { ok: false, error: e.message ?? String(e) };
        }
      }
    }),
  );
  return results;
}

async function main() {
  console.log(`[deep-rationale] fetching up to ${LIMIT} pending questions (exam=${EXAM})…`);
  const fetched = wranglerD1(FETCH_SQL);
  // wrangler returns either an array or {result:[{results:[…]}]} depending on version
  const rows =
    Array.isArray(fetched) && fetched[0]?.results
      ? fetched[0].results
      : fetched.result?.[0]?.results ?? fetched?.results ?? fetched;
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log("[deep-rationale] nothing to author — exiting.");
    return;
  }
  console.log(`[deep-rationale] authoring ${rows.length} with concurrency=${CONCURRENCY}…`);

  const results = await runConcurrent(rows, authorOne, CONCURRENCY);

  let successCount = 0;
  let failCount = 0;
  const updates = [];
  const failures = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = results[i];
    if (!result.ok) {
      failCount++;
      failures.push({ id: row.id, error: result.error });
      continue;
    }
    const out = result.value;
    if (!out.deep_rationale || out.deep_rationale.length < 400) {
      failCount++;
      failures.push({ id: row.id, error: `short output (${out.deep_rationale?.length ?? 0} chars)` });
      continue;
    }
    successCount++;

    const dr = escapeSql(out.deep_rationale);
    let sets = [`deep_rationale='${dr}'`, `deep_rationale_authored_at=${now}`];
    if (out.distractor_rationales && Object.keys(out.distractor_rationales).length > 0) {
      let existingDistractors = {};
      try { existingDistractors = JSON.parse(row.distractor_rationales || "{}"); } catch {}
      if (Object.keys(existingDistractors).length === 0) {
        sets.push(`distractor_rationales='${escapeSql(JSON.stringify(out.distractor_rationales))}'`);
      }
    }
    updates.push(`UPDATE questions SET ${sets.join(", ")} WHERE id='${escapeSql(row.id)}';`);

    if (DRY_RUN && successCount <= 3) {
      console.log(`\n--- SAMPLE ${row.id} ---`);
      console.log(`DEEP RATIONALE (${out.deep_rationale.length} chars):`);
      console.log(out.deep_rationale);
      if (out.distractor_rationales) {
        console.log("\nDISTRACTOR RATIONALES:");
        console.log(JSON.stringify(out.distractor_rationales, null, 2));
      }
    }
  }

  console.log(`\n[deep-rationale] authored=${successCount} failed=${failCount}`);
  if (failures.length) {
    console.log("[deep-rationale] failures:");
    for (const f of failures.slice(0, 8)) console.log(`  ${f.id}: ${f.error}`);
  }

  if (DRY_RUN) {
    console.log("\n[deep-rationale] --dry-run set, not writing to D1.");
    return;
  }

  if (updates.length === 0) {
    console.log("[deep-rationale] no successful updates to write.");
    return;
  }

  const batchFile = pathResolve(TMP_DIR, `batch-${Date.now()}.sql`);
  writeFileSync(batchFile, updates.join("\n"), "utf8");
  console.log(`[deep-rationale] writing ${updates.length} updates to D1 via ${batchFile}…`);

  const writeResult = wranglerD1(batchFile, true);
  // Sum changes across statements
  const totalChanges =
    (Array.isArray(writeResult) ? writeResult : writeResult?.result ?? [])
      .reduce((acc, r) => acc + (r?.meta?.changes ?? 0), 0);
  console.log(`[deep-rationale] D1 reports ${totalChanges} rows changed.`);
}

main().catch((e) => {
  console.error("[deep-rationale] FATAL:", e);
  process.exit(1);
});
