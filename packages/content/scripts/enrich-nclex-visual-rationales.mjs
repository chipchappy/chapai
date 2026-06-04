import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const questionsRoot = path.join(packageRoot, "questions");
const liveDir = path.join(questionsRoot, "nclex", "live");

const rawLiveFile = path.join(liveDir, "reviewed-curated-live.json");
const canonicalLiveFile = path.join(liveDir, "reviewed-curated-live.unique.json");
const reportFile = path.join(packageRoot, "..", "..", "config", "nclex-visual-rationale-enrichment-latest.json");

function readArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function hasDiagramCoverage(question) {
  return Boolean(
    question?.visualRationale
      || question?.diagramBlueprint
      || question?.chartReview?.diagram?.nodes?.length,
  );
}

function firstSentence(text) {
  const value = String(text ?? "").trim();
  if (!value) return "";
  const sentence = value.match(/^[^.?!]+[.?!]/)?.[0]?.trim();
  return sentence || value;
}

function deriveVisualRationale(question) {
  const takeaway = String(question?.takeaway ?? "").trim();
  const speedCue = String(question?.speedCue ?? "").trim();
  const rationale = String(question?.rationale ?? "").trim();
  const title = takeaway ? takeaway.replace(/[.?!]+$/, "") : "Clinical reasoning snapshot";
  const caption = speedCue ? speedCue.replace(/[.?!]+$/, "") : firstSentence(rationale).replace(/[.?!]+$/, "");
  const conclusion = takeaway || firstSentence(rationale);

  return {
    type: "flow",
    title,
    caption: caption || "Use the highest-risk cue to choose the safest next move.",
    conclusion: conclusion || "Anchor the answer to the most unstable finding before acting.",
  };
}

function enrichQuestions(questions) {
  let enriched = 0;
  const updated = questions.map((question) => {
    if (!question || typeof question !== "object") return question;
    if (hasDiagramCoverage(question)) return question;

    enriched += 1;
    return {
      ...question,
      visualRationale: deriveVisualRationale(question),
    };
  });

  return { updated, enriched };
}

const rawLive = readArray(rawLiveFile);
const canonicalLive = readArray(canonicalLiveFile);

const rawResult = enrichQuestions(rawLive);
const canonicalResult = enrichQuestions(canonicalLive);

if (rawResult.enriched > 0) {
  writeJson(rawLiveFile, rawResult.updated);
}
if (canonicalResult.enriched > 0) {
  writeJson(canonicalLiveFile, canonicalResult.updated);
}

const report = {
  generatedAt: new Date().toISOString(),
  files: {
    rawLive: path.relative(path.join(packageRoot, "..", ".."), rawLiveFile).replaceAll("\\", "/"),
    canonicalLive: path.relative(path.join(packageRoot, "..", ".."), canonicalLiveFile).replaceAll("\\", "/"),
  },
  counts: {
    rawLiveTotal: rawLive.length,
    canonicalLiveTotal: canonicalLive.length,
    rawLiveEnriched: rawResult.enriched,
    canonicalLiveEnriched: canonicalResult.enriched,
  },
};

writeJson(reportFile, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

