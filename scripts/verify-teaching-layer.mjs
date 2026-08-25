#!/usr/bin/env node
// ---------------------------------------------------------------------------
// One report over everything a student actually reads after answering.
//
//   node scripts/verify-teaching-layer.mjs
//
// Coverage alone has been misleading twice: whyWrong rationales existed on 372
// case studies while the display filter threw them away, and 3,382 strategy
// notes were "written" while a third of them taught the wrong rule. So this
// checks what would REACH a student, not what is stored.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { auditStrategy } from "./lib/strategy-gate.mjs";
import { PRINCIPLES } from "./lib/nclex-principles.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";
const CATALOG = new Set(Object.values(PRINCIPLES));

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN; delete env.CLOUDFLARE_ACCOUNT_ID;
  const flat = sql.replace(/\s+/g, " ").trim();
  const raw = execFileSync(process.execPath,
    [WRANGLER, "d1", "execute", "chapai-prod", "--remote", "--json", "--command", flat],
    { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf("[")))[0]?.results ?? [];
}

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "—");
const row = (label, value) => console.log(`  ${label.padEnd(46)} ${value}`);

(async () => {
  console.log("\n=== COVERAGE BY TYPE ===");
  const cov = d1(`SELECT type, COUNT(*) AS total,
                    SUM(CASE WHEN structured_rationale IS NOT NULL AND structured_rationale <> '' THEN 1 ELSE 0 END) AS structured,
                    CAST(AVG(length(COALESCE(structured_rationale,''))) AS INT) AS avg_len
                  FROM questions WHERE publish_state='published' GROUP BY type ORDER BY total DESC`);
  let total = 0, structured = 0;
  for (const r of cov) {
    total += r.total; structured += r.structured;
    row(`${r.type}`, `${r.structured}/${r.total} (${pct(r.structured, r.total)})   avg ${r.avg_len} chars`);
  }
  row("ALL PUBLISHED", `${structured}/${total} (${pct(structured, total)})`);

  console.log("\n=== INTEGRITY (must all be zero) ===");
  const bad = d1(`SELECT
      SUM(CASE WHEN NOT json_valid(structured_rationale) THEN 1 ELSE 0 END) AS invalid_json,
      SUM(CASE WHEN json_extract(structured_rationale,'$.whyCorrect') IS NULL THEN 1 ELSE 0 END) AS missing_whycorrect,
      SUM(CASE WHEN json_extract(structured_rationale,'$.mechanism') IS NULL THEN 1 ELSE 0 END) AS missing_mechanism
    FROM questions WHERE publish_state='published'
      AND structured_rationale IS NOT NULL AND structured_rationale <> ''`)[0] ?? {};
  for (const [k, v] of Object.entries(bad)) row(k, v);

  console.log("\n=== STRATEGY NOTES: WHAT WOULD REACH A STUDENT ===");
  const notes = d1(`SELECT json_extract(structured_rationale,'$.strategy') AS s
                    FROM questions WHERE publish_state='published'
                      AND json_extract(structured_rationale,'$.strategy') IS NOT NULL`);
  let fromCatalog = 0, shown = 0, suppressed = 0;
  const reasons = new Map();
  for (const r of notes) {
    const text = String(r.s ?? "").trim();
    const rule = text.split(/(?<=[.!?])\s+/).filter((p) => p.trim().length > 3).slice(1).join(" ");
    if (CATALOG.has(rule.trim())) fromCatalog += 1;
    const problems = auditStrategy(text);
    if (problems.length) {
      suppressed += 1;
      for (const p of problems) reasons.set(p, (reasons.get(p) ?? 0) + 1);
    } else shown += 1;
  }
  row("strategy notes stored", notes.length);
  row("assembled from the validated catalog", `${fromCatalog} (${pct(fromCatalog, notes.length)})`);
  row("would render to a student", `${shown} (${pct(shown, notes.length)})`);
  row("suppressed by the render gate", `${suppressed} (${pct(suppressed, notes.length)})`);
  for (const [k, v] of [...reasons].sort((a, b) => b[1] - a[1])) row(`    ${k}`, v);

  console.log("\n=== whyWrong KEYED TO REAL OPTION IDS ===");
  console.log("  (only option-based types reach a student; matrix, bow_tie and ordering");
  console.log("   are keyed by row or slot and teach through whyCorrect instead)");
  const dist = d1(`SELECT q.type, COUNT(*) AS n FROM questions q
                   WHERE q.publish_state='published' AND json_valid(q.structured_rationale)
                     AND (SELECT COUNT(*) FROM json_each(json_extract(q.structured_rationale,'$.whyWrong')) w
                          JOIN json_each(q.options) o ON json_extract(o.value,'$.id') = w.key) > 0
                   GROUP BY q.type ORDER BY n DESC`);
  const RENDERS = new Set(["mcq", "sata", "case_study", "scenario_mcq", "decision_map_mcq"]);
  for (const r of dist) {
    row(r.type, `${r.n}${RENDERS.has(r.type) ? "   -> shown to students" : "   (not shown; whyCorrect carries it)"}`);
  }
  console.log("");
})();
