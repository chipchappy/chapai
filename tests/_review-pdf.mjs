// Renders the staged distractor rewrites to a PDF for human review.
// Reads only the staging file — this never touches D1.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = "C:/Users/Chapman/Desktop/ai/chapai-p0.1-rewrite-distractors";
const OUT = "C:/Users/Chapman/AppData/Local/Temp/claude/C--Users-Chapman-Desktop-ai-ccrn-agent/37c30503-c9ea-40a9-9549-9fabb5476110/scratchpad/distractor-review.pdf";

const rows = readFileSync(`${ROOT}/packages/content/staging/distractor-rewrites.jsonl`, "utf8")
  .split("\n").filter(Boolean).map((l) => JSON.parse(l));

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const VERDICT = {
  pass: { label: "PASSED BOTH GATES", cls: "ok" },
  quarantined: { label: "QUARANTINED — verifier disagreed", cls: "quar" },
  rejected: { label: "REJECTED", cls: "rej" },
  skipped: { label: "SKIPPED", cls: "rej" },
};

const card = (r, i) => {
  const v = VERDICT[r.verdict] ?? { label: r.verdict, cls: "rej" };
  const opts = (r.before ?? []).map((o) => {
    const after = (r.after ?? []).find((x) => x.id === o.id);
    const changed = after && after.text !== o.text;
    const isKey = (r.correctIds ?? []).includes(o.id);
    return `
      <div class="opt ${isKey ? "key" : ""}">
        <div class="oid">${esc(o.id)}${isKey ? ' <span class="keytag">KEY · frozen</span>' : ""}</div>
        <div class="line"><span class="lbl">before</span><span class="txt old">${esc(o.text)}</span></div>
        ${changed
          ? `<div class="line"><span class="lbl">after</span><span class="txt new">${esc(after.text)}</span></div>`
          : `<div class="line"><span class="lbl">after</span><span class="txt same">unchanged</span></div>`}
        ${!isKey && (r.errorTypes ?? {})[o.id]
          ? `<div class="line"><span class="lbl">wrong via</span><span class="txt tag"><b>${esc(r.errorTypes[o.id])}</b> — ${esc((r.whyEachWrong ?? {})[o.id] ?? "")}</span></div>`
          : ""}
      </div>`;
  }).join("");

  return `
    <section class="q">
      <header>
        <span class="num">${i + 1}</span>
        <span class="badge ${v.cls}">${v.label}</span>
        <span class="meta">${esc(r.id)} · difficulty ${esc(r.difficulty ?? "—")}</span>
      </header>
      <p class="stem">${esc(r.stem)}</p>
      ${opts}
      ${r.verifier
        ? `<p class="verif">Independent verifier answered <b>${esc(r.verifier.answer)}</b>
             (${esc(r.verifier.confidence)} confidence), runner-up ${esc(r.verifier.runnerUp)}.
             Stored key is <b>${esc((r.correctIds ?? [])[0])}</b>.</p>`
        : `<p class="verif">${esc(r.reason ?? "no verifier result")}</p>`}
    </section>`;
};

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.5 Georgia, serif; color: #2f373a; background: #fff; margin: 0; }
  h1 { font-size: 19pt; margin: 0 0 2mm; }
  .intro { font-size: 9.5pt; color: #5b6669; margin: 0 0 7mm; padding-bottom: 5mm; border-bottom: 1.5px solid #d8cdb4; }
  .intro b { color: #2f373a; }
  .q { break-inside: avoid; page-break-inside: avoid; margin: 0 0 8mm; padding: 4mm 5mm; border: 1px solid #ddd3bd; border-radius: 3mm; background: #fdfbf6; }
  header { display: flex; align-items: center; gap: 3mm; margin-bottom: 2.5mm; flex-wrap: wrap; }
  .num { font-weight: 700; font-size: 12pt; color: #8a6a2f; }
  .badge { font: 700 7.5pt/1 -apple-system, Segoe UI, sans-serif; letter-spacing: .04em; padding: 1.4mm 2.4mm; border-radius: 8mm; }
  .badge.ok { background: #e6efe6; color: #47653f; }
  .badge.quar { background: #fbeee2; color: #9b5e42; }
  .badge.rej { background: #f3e6e6; color: #8f4a4a; }
  .meta { font: 8pt monospace; color: #8b9296; margin-left: auto; }
  .stem { margin: 0 0 3mm; }
  .opt { margin: 0 0 2mm; padding: 2mm 2.5mm; border-left: 2.5px solid #e0d6c0; }
  .opt.key { border-left-color: #7e9d86; background: #f4f8f4; }
  .oid { font: 700 9pt monospace; margin-bottom: 1mm; }
  .keytag { font: 700 7pt -apple-system, Segoe UI, sans-serif; color: #47653f; letter-spacing: .05em; }
  .line { display: flex; gap: 2.5mm; margin-bottom: .8mm; }
  .lbl { flex: 0 0 13mm; font: 700 7.5pt -apple-system, Segoe UI, sans-serif; color: #9aa0a3; text-transform: uppercase; padding-top: .6mm; }
  .txt { flex: 1; font-size: 9.5pt; }
  .old { color: #8b9296; }
  .new { color: #2f373a; background: #f6f1e2; padding: 0 1mm; }
  .same { color: #b3b8ba; font-style: italic; }
  .tag { color: #6b5336; font-size: 8.5pt; }
  .verif { margin: 2.5mm 0 0; padding-top: 2mm; border-top: 1px dashed #ddd3bd; font-size: 8.5pt; color: #5b6669; }
</style></head><body>
  <h1>Distractor rewrites — review sample</h1>
  <p class="intro">
    <b>Nothing here has been written to production.</b> The answer key and every option id are
    frozen: only the text of incorrect options can change, replaced in place by id.
    Each item passed a writer gate (the writer must still name the stored key as correct),
    an <b>error-type taxonomy</b> — every distractor is wrong for one named reason
    (timing, priority, wrong-condition, scope, misconception, assess-vs-act) — plus
    <b>similarity and specificity gates</b> that reject a distractor paraphrasing the key
    or carrying detail the key does not, a <b>parallelism gate</b> so the frozen key never
    becomes a length or format outlier, and an
    <b>independent verifier</b> that answers the rewritten question cold with no sight of
    the key. ${rows.filter((r) => r.verdict === "pass").length} of ${rows.length} cleared all three.
  </p>
  ${rows.map(card).join("")}
</body></html>`;

const tmpHtml = OUT.replace(/\.pdf$/, ".html");
writeFileSync(tmpHtml, html, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`, { waitUntil: "load" });
await page.pdf({ path: OUT, format: "Letter", printBackground: true });
await browser.close();
console.log(`wrote ${OUT}  (${rows.length} items)`);
