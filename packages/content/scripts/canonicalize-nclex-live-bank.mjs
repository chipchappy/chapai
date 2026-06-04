import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const liveDir = path.join(packageRoot, "questions", "nclex", "live");
const sourceFile = path.join(liveDir, "reviewed-curated-live.json");
const outputFile = path.join(liveDir, "reviewed-curated-live.unique.json");
const reportFile = path.join(packageRoot, "..", "..", "config", "nclex-canonicalization-latest.json");

function readArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(filePath, value) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function corruptionScore(value) {
  const text = String(value ?? "");
  if (!text) {
    return 0;
  }

  const matches = text.match(/Ã.|Â|â€|â€”|â€“|â€˜|â€™|â€œ|â€�|â€¦|â†’|â‰¤|â‰¥|�/g);
  return matches ? matches.length : 0;
}

function repairMojibake(value) {
  let text = String(value ?? "");
  if (!text) {
    return text;
  }

  const originalScore = corruptionScore(text);
  if (originalScore > 0) {
    try {
      const decoded = Buffer.from(text, "latin1").toString("utf8");
      if (decoded && corruptionScore(decoded) < originalScore) {
        text = decoded;
      }
    } catch {
      // Keep the original text when the buffer round-trip is not helpful.
    }
  }

  const replacements = [
    ["Ã¢â‚¬â€", "-"],
    ["Ã¢â‚¬â€œ", "-"],
    ["Ã¢â‚¬Ëœ", "'"],
    ["Ã¢â‚¬â„¢", "'"],
    ["Ã¢â‚¬Å“", "\""],
    ["Ã¢â‚¬ï¿½", "\""],
    ["Ã¢â‚¬Â¦", "..."],
    ["Ã¢â€ â€™", "->"],
    ["Ã¢â€°Â¤", "<="],
    ["Ã¢â€°Â¥", ">="],
    ["Ã‚Â·", "·"],
    ["â€”", "-"],
    ["â€“", "-"],
    ["â€˜", "'"],
    ["â€™", "'"],
    ["â€œ", "\""],
    ["â€�", "\""],
    ["â€¦", "..."],
    ["â†’", "->"],
    ["â‰¤", "<="],
    ["â‰¥", ">="],
    ["Â·", "·"],
    ["Ã‚", ""],
    ["Â", ""],
  ];

  for (const [source, target] of replacements) {
    text = text.split(source).join(target);
  }

  return text.replace(/\s+/g, " ").trim();
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeValue(entry)]),
    );
  }

  if (typeof value === "string") {
    return repairMojibake(value);
  }

  return value;
}

function hasEncodingNoise(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasEncodingNoise(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => hasEncodingNoise(entry));
  }

  if (typeof value === "string") {
    return corruptionScore(value) > 0;
  }

  return false;
}

function normalizeText(value, options = {}) {
  const stripNumbers = options.stripNumbers === true;
  const withNumberPolicy = stripNumbers
    ? String(value ?? "").replace(/\b\d+(?:\.\d+)?\b/g, " ")
    : String(value ?? "");

  return withNumberPolicy
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean).sort().join("|");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, entry]) => `${normalizeText(key)}:${normalizeText(entry)}`)
      .sort()
      .join("|");
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim().toLowerCase()).sort().join("|");
    }
  } catch {
    // fall through
  }

  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join("|");
  }

  return raw.toLowerCase();
}

function normalizeOptions(options, stripNumbers = false) {
  if (!Array.isArray(options)) {
    return "";
  }

  return options
    .map((option) => normalizeText(typeof option === "string" ? option : option?.text, { stripNumbers }))
    .filter(Boolean)
    .sort()
    .join("|");
}

function familySignature(question) {
  if (question?.waveMetadata?.duplicateFingerprint) {
    return String(question.waveMetadata.duplicateFingerprint);
  }

  return [
    normalizeText(question.exam),
    normalizeText(question.type),
    normalizeText(question.category),
    normalizeText(question.stem),
    normalizeOptions(question.options),
    normalizeAnswer(question.answer),
  ].join("::");
}

function strictSignature(question) {
  return [
    normalizeText(question.exam),
    normalizeText(question.type),
    normalizeText(question.category),
    normalizeText(question.stem),
    normalizeAnswer(question.answer),
  ].join("::");
}

function reviewStatusScore(status) {
  const normalized = normalizeText(status);
  if (normalized.includes("final curated live")) return 40;
  if (normalized.includes("reviewed curated")) return 30;
  if (normalized === "approved") return 20;
  if (normalized === "review") return 10;
  return 0;
}

function referenceScore(question) {
  return Array.isArray(question.references) ? Math.min(question.references.length, 3) * 8 : 0;
}

function diagramScore(question) {
  const wantsDiagram = Boolean(question.diagramWorthiness) || Boolean(question.diagramBlueprint?.diagramWorthiness);
  if (!wantsDiagram) {
    return 4;
  }
  return question.diagramBlueprint ? 12 : 0;
}

function distractorScore(question) {
  return question.distractorRationales && typeof question.distractorRationales === "object"
    ? Object.keys(question.distractorRationales).length * 2
    : 0;
}

function rationaleScore(question) {
  return Math.min(String(question.rationale ?? "").length, 400) / 20;
}

function curatedAtValue(question) {
  const parsed = Date.parse(String(question.curatedAt ?? ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function qualityScore(question) {
  return reviewStatusScore(question.reviewStatus)
    + (question.tutorReady ? 18 : 0)
    + referenceScore(question)
    + diagramScore(question)
    + distractorScore(question)
    + rationaleScore(question);
}

function isEligible(question) {
  const hasApprovedStatus = ["final curated live", "reviewed curated", "approved"].some((token) =>
    normalizeText(question.reviewStatus).includes(token),
  );
  const hasReferences = Array.isArray(question.references) && question.references.length > 0;
  const tutorReady = question.tutorReady === true;
  const wantsDiagram = Boolean(question.diagramWorthiness) || Boolean(question.diagramBlueprint?.diagramWorthiness);
  const hasDiagramIfNeeded = !wantsDiagram || Boolean(question.diagramBlueprint);

  return question.exam === "nclex"
    && hasApprovedStatus
    && tutorReady
    && hasReferences
    && hasDiagramIfNeeded;
}

const sourceItems = readArray(sourceFile);
const sanitizedItems = sourceItems.map((question) => sanitizeValue(question));
const eligibleItems = sanitizedItems.filter((question) => isEligible(question) && !hasEncodingNoise(question));
const grouped = new Map();

for (const question of eligibleItems) {
  const key = familySignature(question);
  const bucket = grouped.get(key) ?? [];
  bucket.push(question);
  grouped.set(key, bucket);
}

const canonicalItems = Array.from(grouped.values())
  .map((bucket) =>
    [...bucket].sort((left, right) => {
      const qualityDelta = qualityScore(right) - qualityScore(left);
      if (qualityDelta !== 0) {
        return qualityDelta;
      }

      const curatedDelta = curatedAtValue(right) - curatedAtValue(left);
      if (curatedDelta !== 0) {
        return curatedDelta;
      }

      return String(left.id).localeCompare(String(right.id));
    })[0],
  )
  .sort((left, right) => {
    const categoryDelta = String(left.category).localeCompare(String(right.category));
    if (categoryDelta !== 0) {
      return categoryDelta;
    }

    return String(left.id).localeCompare(String(right.id));
  });

writeJson(outputFile, canonicalItems);

const report = {
  generatedAt: new Date().toISOString(),
  sourceFile: path.relative(path.join(packageRoot, "..", ".."), sourceFile).replaceAll("\\", "/"),
  outputFile: path.relative(path.join(packageRoot, "..", ".."), outputFile).replaceAll("\\", "/"),
  sourceCount: sourceItems.length,
  sanitizedCount: sanitizedItems.length,
  eligibleCount: eligibleItems.length,
  canonicalCount: canonicalItems.length,
  duplicateFamiliesCollapsed: eligibleItems.length - canonicalItems.length,
  encodingExcluded: sanitizedItems.filter((question) => isEligible(question) && hasEncodingNoise(question)).length,
  sampleFamilySignatures: canonicalItems.slice(0, 5).map((question) => ({
    id: question.id,
    strictSignature: strictSignature(question),
    familySignature: familySignature(question),
  })),
};

writeJson(reportFile, report);
console.log(JSON.stringify(report, null, 2));
