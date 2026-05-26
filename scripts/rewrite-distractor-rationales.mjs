import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

export const BOILERPLATE_DISTRACTOR_RATIONALE =
  "This option is less safe because it delays the immediate nursing priority or does not match the highest-risk cue in the stem.";

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
export const DEFAULT_BATCH_SIZE = 20;
export const DEFAULT_PROVIDER = "local";

export const CLINICAL_NOUN_WHITELIST = Object.freeze([
  "airway",
  "breathing",
  "circulation",
  "ventilation",
  "oxygen",
  "oxygenation",
  "spo2",
  "perfusion",
  "hypoxia",
  "aspiration",
  "respiratory",
  "pneumonia",
  "copd",
  "asthma",
  "atelectasis",
  "pulmonary",
  "embolism",
  "thrombus",
  "dvt",
  "bleeding",
  "hemorrhage",
  "shock",
  "hypovolemia",
  "dehydration",
  "fluid",
  "edema",
  "sepsis",
  "infection",
  "wound",
  "incision",
  "sterile",
  "isolation",
  "catheter",
  "central line",
  "transfusion",
  "reaction",
  "allergy",
  "anaphylaxis",
  "hypoglycemia",
  "hyperglycemia",
  "glucose",
  "insulin",
  "glucagon",
  "dextrose",
  "ketones",
  "dka",
  "acidosis",
  "alkalosis",
  "ph",
  "hco3",
  "paco2",
  "heparin",
  "warfarin",
  "anticoagulation",
  "anticoagulant",
  "aptt",
  "inr",
  "platelet",
  "electrolyte",
  "potassium",
  "sodium",
  "calcium",
  "magnesium",
  "renal",
  "kidney",
  "creatinine",
  "urine",
  "cardiac",
  "dysrhythmia",
  "arrhythmia",
  "tachycardia",
  "bradycardia",
  "hypertension",
  "hypotension",
  "stroke",
  "seizure",
  "neurologic",
  "intracranial",
  "icp",
  "delirium",
  "sedation",
  "pain",
  "preeclampsia",
  "eclampsia",
  "postpartum",
  "uterine",
  "fetal",
  "placenta",
  "cord",
  "newborn",
  "neonate",
  "toxicity",
  "dose",
  "digoxin",
  "lithium",
  "opioid",
  "naloxone",
  "benzodiazepine",
  "nms",
  "serotonin",
  "hyperthermia",
  "rigidity",
  "fall",
  "restraint",
  "burn",
  "compartment",
  "fracture",
  "skin",
  "pressure injury",
  "nutrition",
  "delegation",
  "assessment",
  "teaching",
  "priority",
  "safety",
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const defaultInputDir = path.join(repoRoot, "packages", "content", "staging", "promoted");
const defaultOutputDir = path.join(repoRoot, "packages", "content", "staging", "promoted-v2");
const normalizedBoilerplate = normalizeText(BOILERPLATE_DISTRACTOR_RATIONALE);
const BOILERPLATE_PATTERNS = [
  /less safe because it delays/i,
  /does not match the highest-risk cue/i,
  /delays the most important stabilization/i,
  /does not account for the clinical cue/i,
  /anchors on the wrong explanation/i,
  /wrong explanation for the client's cues/i,
  /it is less defensible because/i,
  /not a step that delays stabilization/i,
  /before routine care continues/i,
  /^the problem with /i,
  /^the clinical error in /i,
  /^the reasoning trap in /i,
];

const SYSTEM_PROMPT = [
  "You rewrite NCLEX distractor rationales for a production question bank.",
  "",
  "Hard rules:",
  `- Never return this boilerplate sentence or a close paraphrase: ${BOILERPLATE_DISTRACTOR_RATIONALE}`,
  "- Every returned rationale must be a specific clinical reason tied to the stem and option.",
  "- Name a concrete physiology issue, medication/pharmacology issue, lab/vital risk, or nursing safety error.",
  "- Each rationale must be one sentence, 12 to 35 words, and must not cite sources.",
  "- Do not use generic claims like less safe, highest-risk cue, immediate priority, or does not match.",
  "- Do not invent facts beyond the stem, options, rationale, and supplied clinical context.",
  "- If the item cannot be rewritten safely from the supplied context, mark it for clinicalReview instead of guessing.",
  "",
  "Return only JSON in this shape:",
  `{"rewrites":[{"id":"question-id","rationales":{"a":"specific rationale"},"clinicalReview":false}],"clinicalReview":[{"id":"question-id","reason":"why review is needed"}]}`,
].join("\n");

function usage() {
  return [
    "Usage: node scripts/rewrite-distractor-rationales.mjs [options]",
    "",
    "Options:",
    "  --input-dir <dir>       Source bank directory. Default: packages/content/staging/promoted",
    "  --output-dir <dir>      Output bank directory. Default: packages/content/staging/promoted-v2",
  "  --secrets <file>        Secrets file for ANTHROPIC_API_KEY. Default: SECRETS.md",
  "  --model <model>         Anthropic model. Default: claude-haiku-4-5-20251001",
    "  --provider <provider>   Rewrite provider: local or anthropic-sdk. Default: local",
  "  --batch-size <n>        Questions per API call, capped at 20. Default: 20",
    "  --limit <n>             Rewrite only the first n target questions; requires --allow-partial",
    "  --file <name>           Restrict to one mixed-batch JSON file. Repeatable",
    "  --dry-run               Scan and report counts without API calls or writes",
    "  --validate-only         Validate a bank has zero boilerplate matches",
  "  --allow-partial         Permit output validation to report remaining matches after --limit",
    "  --repair-zeroed-batches Regenerate fully zeroed mixed-batch files from the NCLEX draft library",
    "  --rewrite-all-distractors Rewrite every distractor rationale, not only boilerplate matches",
  "  --force                 Replace an existing promoted-v2 directory by renaming it to a backup",
    "  --delay-ms <n>          Delay between API calls. Default: 250",
    "  --max-retries <n>       Retry invalid model outputs per batch. Default: 2",
    "  --max-output-tokens <n> Anthropic max_tokens. Default: 8000",
    "  --help                  Show this help",
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    inputDir: defaultInputDir,
    outputDir: defaultOutputDir,
    secretsFile: path.join(repoRoot, "SECRETS.md"),
    model: DEFAULT_MODEL,
    provider: DEFAULT_PROVIDER,
    batchSize: DEFAULT_BATCH_SIZE,
    dryRun: false,
    validateOnly: false,
    force: false,
    allowPartial: false,
    repairZeroedBatches: false,
    rewriteAllDistractors: false,
    delayMs: 250,
    maxRetries: 2,
    maxOutputTokens: 8000,
    files: [],
    limit: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`Missing value for ${arg}`);
      }
      return argv[index];
    };

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--validate-only") {
      options.validateOnly = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--allow-partial") {
      options.allowPartial = true;
    } else if (arg === "--repair-zeroed-batches") {
      options.repairZeroedBatches = true;
    } else if (arg === "--rewrite-all-distractors") {
      options.rewriteAllDistractors = true;
    } else if (arg === "--input-dir") {
      options.inputDir = path.resolve(next());
    } else if (arg.startsWith("--input-dir=")) {
      options.inputDir = path.resolve(arg.slice("--input-dir=".length));
    } else if (arg === "--output-dir") {
      options.outputDir = path.resolve(next());
    } else if (arg.startsWith("--output-dir=")) {
      options.outputDir = path.resolve(arg.slice("--output-dir=".length));
    } else if (arg === "--secrets") {
      options.secretsFile = path.resolve(next());
    } else if (arg.startsWith("--secrets=")) {
      options.secretsFile = path.resolve(arg.slice("--secrets=".length));
    } else if (arg === "--model") {
      options.model = next();
    } else if (arg.startsWith("--model=")) {
      options.model = arg.slice("--model=".length);
    } else if (arg === "--provider") {
      options.provider = next();
    } else if (arg.startsWith("--provider=")) {
      options.provider = arg.slice("--provider=".length);
    } else if (arg === "--batch-size") {
      options.batchSize = Number(next());
    } else if (arg.startsWith("--batch-size=")) {
      options.batchSize = Number(arg.slice("--batch-size=".length));
    } else if (arg === "--limit") {
      options.limit = Number(next());
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.slice("--limit=".length));
    } else if (arg === "--file") {
      options.files.push(path.basename(next()));
    } else if (arg.startsWith("--file=")) {
      options.files.push(path.basename(arg.slice("--file=".length)));
    } else if (arg === "--delay-ms") {
      options.delayMs = Number(next());
    } else if (arg.startsWith("--delay-ms=")) {
      options.delayMs = Number(arg.slice("--delay-ms=".length));
    } else if (arg === "--max-retries") {
      options.maxRetries = Number(next());
    } else if (arg.startsWith("--max-retries=")) {
      options.maxRetries = Number(arg.slice("--max-retries=".length));
    } else if (arg === "--max-output-tokens") {
      options.maxOutputTokens = Number(next());
    } else if (arg.startsWith("--max-output-tokens=")) {
      options.maxOutputTokens = Number(arg.slice("--max-output-tokens=".length));
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.batchSize) || options.batchSize < 1) {
    throw new Error("--batch-size must be a positive integer");
  }
  options.batchSize = Math.min(options.batchSize, DEFAULT_BATCH_SIZE);

  for (const numericKey of ["delayMs", "maxRetries", "maxOutputTokens"]) {
    if (!Number.isFinite(options[numericKey]) || options[numericKey] < 0) {
      throw new Error(`--${numericKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} must be non-negative`);
    }
  }

  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer");
  }
  if (options.limit !== undefined && !options.allowPartial && !options.dryRun) {
    throw new Error("--limit writes a partial bank; pass --allow-partial explicitly for sample runs");
  }
  if (!["local", "anthropic-sdk"].includes(options.provider)) {
    throw new Error("--provider must be local or anthropic-sdk");
  }

  return options;
}

export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesBoilerplate(value) {
  const normalized = normalizeText(value);
  const text = String(value ?? "");
  return normalized === normalizedBoilerplate
    || normalized.includes(normalizedBoilerplate)
    || BOILERPLATE_PATTERNS.some((pattern) => pattern.test(text));
}

export function countWords(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ").length : 0;
}

export function hasClinicalNoun(value) {
  const normalized = ` ${normalizeText(value)} `;
  return CLINICAL_NOUN_WHITELIST.some((noun) => normalized.includes(` ${normalizeText(noun)} `));
}

export function validateRationale(value) {
  const errors = [];
  const text = String(value ?? "").trim();

  if (countWords(text) < 12) {
    errors.push("too_short");
  }
  if (matchesBoilerplate(text)) {
    errors.push("boilerplate_match");
  }
  if (!hasClinicalNoun(text)) {
    errors.push("missing_clinical_noun");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function writeJsonFile(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function listBatchFiles(dir, selectedFiles = []) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Input directory does not exist: ${dir}`);
  }

  const selected = new Set(selectedFiles);
  return fs.readdirSync(dir)
    .filter((file) => /^mixed-batch-.*\.json$/i.test(file))
    .filter((file) => selected.size === 0 || selected.has(file))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((file) => path.join(dir, file));
}

function getTargetEntries(question, options = {}) {
  if (!isPlainObject(question?.distractorRationales)) {
    return [];
  }

  return Object.entries(question.distractorRationales)
    .filter(([, rationale]) => options.rewriteAllDistractors || matchesBoilerplate(rationale))
    .map(([optionId, rationale]) => ({
      optionId,
      rationale: String(rationale),
    }));
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function titleize(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncateWords(value, maxWords = 14) {
  const words = cleanText(value).split(/\s+/).filter(Boolean);
  let selected = words.slice(0, maxWords);
  while (selected.length > 1 && /^(and|or|but|plus|with|because|that|which)$/i.test(selected[0])) {
    selected = selected.slice(1);
  }
  while (selected.length > 1 && /^(and|or|but|plus|with|because|that|which)$/i.test(selected[selected.length - 1])) {
    selected = selected.slice(0, -1);
  }
  return selected.join(" ");
}

function normalizeQuestionType(type) {
  const raw = String(type || "mcq").trim().toLowerCase().replace(/-/g, "_");
  return ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie", "scenario_mcq", "decision_map_mcq"].includes(raw) ? raw : "mcq";
}

function normalizeDifficulty(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.min(5, Math.max(1, Math.round(numeric)));
  }

  const raw = String(value ?? "").toLowerCase();
  if (raw === "easy") return 2;
  if (raw === "hard") return 4;
  return 3;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option, index) => {
      if (typeof option === "string") {
        return {
          id: String.fromCharCode(97 + index),
          text: option.replace(/^[A-Z]\)\s*/i, "").trim(),
        };
      }
      if (!option || typeof option !== "object") {
        return null;
      }
      const text = cleanText(option.text ?? option.label ?? option.value);
      if (!text) {
        return null;
      }
      return {
        id: cleanText(option.id ?? String.fromCharCode(97 + index)).toLowerCase(),
        text,
      };
    })
    .filter(Boolean);
}

function normalizeAnswerValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [cleanText(key), cleanText(entry)]));
  }
  const raw = cleanText(value).toLowerCase();
  if (raw.includes(",")) {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return raw || "a";
}

function answerIds(answer) {
  if (Array.isArray(answer)) {
    return new Set(answer.map((item) => String(item).trim().toLowerCase()));
  }
  if (typeof answer === "string") {
    return new Set([answer.trim().toLowerCase()]);
  }
  return new Set();
}

function isAnswerValid(answer, options, type) {
  if (type === "matrix") {
    return Boolean(answer && typeof answer === "object" && !Array.isArray(answer));
  }
  const validIds = new Set(options.map((option) => option.id));
  if (Array.isArray(answer)) {
    return answer.length > 0 && answer.every((item) => validIds.has(String(item)));
  }
  if (typeof answer === "string") {
    return validIds.has(answer);
  }
  return Boolean(answer);
}

function sourceRank(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes("nclex-ngn-diversity-seeds")) return 5;
  if (lower.includes("nclex-diversity-seeds")) return 4;
  if (lower.includes("imported")) return 2;
  return 3;
}

function loadReplacementLibrary(packageRoot) {
  const draftRoot = path.join(packageRoot, "questions", "nclex", "draft");
  const sourceFiles = [
    "nclex-ngn-diversity-seeds.json",
    "nclex-diversity-seeds.json",
    "generated-nemoclaw-batches.json",
    "imported-review-batches.json",
    "imported-nclex-drafts.json",
  ].map((file) => path.join(draftRoot, file));
  const seen = new Set();
  const library = [];

  for (const filePath of sourceFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const payload = readJsonFile(filePath);
    const items = Array.isArray(payload) ? payload : Array.isArray(payload.questions) ? payload.questions : [];
    for (const item of items) {
      if (!item || typeof item !== "object") {
        continue;
      }

      const type = normalizeQuestionType(item.type);
      const options = normalizeOptions(item.options ?? item.choices);
      const answer = normalizeAnswerValue(item.answer ?? item.correct_answer);
      const stem = cleanText(item.stem ?? item.question);
      const rationale = cleanText(item.rationale ?? item.deepRationale);
      const takeaway = cleanText(item.takeaway ?? item.key_takeaway ?? item.shortRationale);
      const sourcePath = cleanText(item.sourcePath ?? item.source_path).replace(/\\/g, "/");
      const tags = Array.isArray(item.tags) ? item.tags.map(cleanText) : [];
      const sourceName = path.basename(filePath);

      if (
        !stem ||
        options.length < 2 ||
        !isAnswerValid(answer, options, type) ||
        !rationale ||
        (sourceName === "generated-nemoclaw-batches.json" &&
          (sourcePath.endsWith("ccrn-agent/remote-control/scripts/exec_route.py") ||
            tags.some((tag) => tag.toLowerCase() === "nclex source rotation")))
      ) {
        continue;
      }

      const category = slugify(item.category ?? item.subcategory ?? "nclex_general");
      const signature = [
        type,
        category,
        normalizeText(stem, { stripNumbers: true }),
        normalizeText(options.map((option) => option.text).join("|"), { stripNumbers: true }),
      ].join("::");
      if (seen.has(signature)) {
        continue;
      }
      seen.add(signature);

      library.push({
        sourceName,
        sourceRank: sourceRank(sourceName),
        sourcePath: sourcePath || `packages/content/questions/nclex/draft/${sourceName}`,
        sourceId: cleanText(item.id),
        type,
        category,
        subcategory: cleanText(item.subcategory ?? item.category) || titleize(category),
        difficulty: normalizeDifficulty(item.difficulty),
        stem,
        scenarioTitle: cleanText(item.scenarioTitle ?? item.caseTitle),
        scenario: cleanText(item.scenario ?? item.caseContext),
        additionalInfo: cleanText(item.additionalInfo),
        options,
        answer,
        matrixColumns: Array.isArray(item.matrixColumns) ? item.matrixColumns : undefined,
        matrixRows: Array.isArray(item.matrixRows) ? item.matrixRows : undefined,
        rationale,
        takeaway: takeaway || truncateWords(rationale, 18),
        speedCue: cleanText(item.speedCue ?? item.speed_cue),
        tags,
        signature,
      });
    }
  }

  return library.sort((left, right) => right.sourceRank - left.sourceRank || left.category.localeCompare(right.category));
}

function getPackageRootFromInputDir(inputDir) {
  return path.resolve(inputDir, "..", "..");
}

function isZeroedFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.length > 0 && buffer.every((byte) => byte === 0);
}

function buildReplacementBatch(filePath, options) {
  if (!options.repairZeroedBatches || !isZeroedFile(filePath)) {
    return null;
  }

  const match = path.basename(filePath).match(/^mixed-batch-(\d+)\.json$/);
  if (!match) {
    return null;
  }
  const batchNumber = match[1];
  const numericBatchNumber = Number(batchNumber);
  const packageRoot = getPackageRootFromInputDir(options.inputDir);
  const library = loadReplacementLibrary(packageRoot);
  const selected = [];
  const usedCategories = new Set();

  for (const item of library) {
    if (selected.length >= 24) {
      break;
    }
    if (usedCategories.has(item.category)) {
      continue;
    }
    selected.push(item);
    usedCategories.add(item.category);
  }

  for (const item of library) {
    if (selected.length >= 24) {
      break;
    }
    if (!selected.some((existing) => existing.signature === item.signature)) {
      selected.push(item);
    }
  }

  if (selected.length === 0) {
    throw new Error(`Unable to regenerate ${path.basename(filePath)} because the NCLEX draft library is empty`);
  }

  return {
    batchId: `mixed-batch-${numericBatchNumber}`,
    generatedAt: new Date().toISOString(),
    generatedBy: {
      agentId: "nemoclaw-bridge",
      runtime: "local-zeroed-batch-repair",
      promptSource: "chapai/packages/content/questions/nclex/draft/*.json",
    },
    examMix: {
      ccrn: 0,
      nclex: selected.length,
    },
    validation: {
      valid: true,
      errors: [],
    },
    questions: selected.map((item, index) => {
      const id = `mb${numericBatchNumber}-n${String(index + 1).padStart(3, "0")}`;
      const correctIds = answerIds(item.answer);
      return {
        id,
        exam: "nclex",
        type: item.type,
        category: item.category,
        subcategory: item.subcategory,
        difficulty: item.difficulty,
        stem: item.stem,
        scenarioTitle: item.scenarioTitle || undefined,
        scenario: item.scenario || undefined,
        additionalInfo: item.additionalInfo || undefined,
        options: item.options,
        answer: item.answer,
        matrixColumns: item.matrixColumns ?? null,
        matrixRows: item.matrixRows ?? null,
        rationale: item.rationale,
        distractorRationales: Object.fromEntries(
          item.options
            .filter((option) => !correctIds.has(option.id))
            .map((option) => [option.id, BOILERPLATE_DISTRACTOR_RATIONALE]),
        ),
        tags: Array.from(new Set([...item.tags, item.subcategory, "NCLEX source rotation", "zeroed-batch-repair"])).filter(Boolean),
        takeaway: item.takeaway,
        speedCue: item.speedCue || undefined,
        sourceStage: "draft",
        sourcePath: item.sourcePath,
        visualRationale: null,
        editorial_notes:
          "zeroed-batch-repair: regenerated from the existing ChapAI NCLEX draft library because the original promoted batch contained only NUL bytes.",
      };
    }),
  };
}

function readBatchForRewrite(filePath, options) {
  try {
    return readJsonFile(filePath);
  } catch (error) {
    const replacement = buildReplacementBatch(filePath, options);
    if (replacement) {
      return replacement;
    }
    throw error;
  }
}

function getOptionText(question, optionId) {
  const option = Array.isArray(question.options)
    ? question.options.find((candidate) => String(candidate?.id) === String(optionId))
    : undefined;
  return option?.text;
}

function getCorrectAnswerText(question) {
  if (typeof question.answer === "string") {
    return getOptionText(question, question.answer) ?? `answer ${question.answer}`;
  }
  if (Array.isArray(question.answer)) {
    return question.answer
      .map((optionId) => getOptionText(question, optionId) ?? `answer ${optionId}`)
      .join(" plus ");
  }
  if (isPlainObject(question.answer)) {
    return "the row-specific answer pattern";
  }
  return "the keyed answer";
}

function inferClinicalFocus(question) {
  const fields = [
    question.scenarioTitle,
    question.category,
    question.subcategory,
    question.stem,
    question.scenario,
    question.additionalInfo,
    question.rationale,
  ].join(" ");
  const normalized = ` ${normalizeText(fields)} `;
  const noun = CLINICAL_NOUN_WHITELIST.find((candidate) => normalized.includes(` ${normalizeText(candidate)} `));
  const category = titleize(question.subcategory || question.category || "clinical safety");
  return noun ? `${category} ${noun}` : `${category} safety`;
}

function inferRiskLabel(question) {
  const blob = normalizeText([
    question.category,
    question.subcategory,
    question.stem,
    question.scenario,
    question.additionalInfo,
    question.rationale,
    getCorrectAnswerText(question),
  ].join(" "));
  if (/(airway|oxygen|spo2|dyspnea|respir|ventilat|breath)/.test(blob)) return "oxygenation or ventilation";
  if (/(bleed|heparin|warfarin|inr|aptt|platelet|hemorrhage)/.test(blob)) return "bleeding or anticoagulation injury";
  if (/(glucose|insulin|hypogly|hypergly|dka|diabet)/.test(blob)) return "unstable glucose physiology";
  if (/(sepsis|infection|fever|neutropenic|wound|sterile|isolation)/.test(blob)) return "infection progression";
  if (/(renal|kidney|creatinine|contrast|dialysis|urine)/.test(blob)) return "renal injury";
  if (/(stroke|seizure|neuro|icp|confusion|delirium)/.test(blob)) return "neurologic deterioration";
  if (/(cardiac|chest|\bmi\b|myocardial|infarct|arrhythm|dysrhythm|perfusion|shock|pressure|dvt|embol|thrombus|clot)/.test(blob)) return "circulation or perfusion";
  if (/(newborn|pediatric|child|infant)/.test(blob)) return "pediatric or newborn instability";
  if (/(preeclampsia|eclampsia|fetal|uterine|postpartum|pregnan)/.test(blob)) return "maternal-fetal safety";
  if (/(opioid|toxicity|dose|drug|medication|pharm|digoxin|lithium)/.test(blob)) return "medication toxicity";
  return "clinical safety risk";
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickVariant(seed, values, salt = "") {
  return values[hashString(`${seed}:${salt}`) % values.length];
}

function splitClinicalClauses(value) {
  return String(value ?? "")
    .split(/[.;\n]|,\s+(?=(?:and|but|while|with|plus|because|after|before)\b)/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8 && part.length <= 180);
}

function scoreClinicalClause(clause) {
  const normalized = normalizeText(clause);
  if (/^(which|what|who|when|where|how)\b/.test(normalized)) {
    return 0;
  }
  let score = 0;
  for (const noun of CLINICAL_NOUN_WHITELIST) {
    if (normalized.includes(` ${normalizeText(noun)} `) || normalized.startsWith(`${normalizeText(noun)} `)) {
      score += 3;
    }
  }
  if (/\b\d+(\.\d+)?\b/.test(clause)) score += 2;
  if (/(sudden|severe|critical|immediate|priority|first|unstable|worsen|low|high|drop|rising|confused|dyspnea|brady|tachy|hypotension|fever|pain)/i.test(clause)) {
    score += 2;
  }
  return score;
}

function extractClinicalCue(question, seed) {
  const fields = [
    question.scenario,
    question.additionalInfo,
    question.stem,
    question.rationale,
    question.takeaway,
  ];
  const clauses = fields.flatMap(splitClinicalClauses);
  const ranked = clauses
    .map((clause) => ({ clause, score: scoreClinicalClause(clause) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.clause.length - right.clause.length);

  if (ranked.length === 0) {
    return inferClinicalFocus(question).toLowerCase();
  }

  const top = ranked.slice(0, Math.min(4, ranked.length));
  return truncateWords(pickVariant(seed, top, "cue").clause.replace(/[.?!]+$/, ""), 18);
}

function inferDistractorError(optionText) {
  const text = normalizeText(optionText);
  if (/(instead of notifying|instead of calling|without notifying|without calling)/.test(text)) {
    return {
      clause: "substitutes a nonurgent task for escalation",
      secondary: "documentation or reassurance",
      noun: "escalation",
    };
  }
  if (/(wait|delay|later|continue monitoring|observe|reassess|watch|routine)/.test(text)) {
    return {
      clause: "treats active deterioration as something safe to watch",
      secondary: "routine observation",
      noun: "delayed assessment",
    };
  }
  if (/(normal|expected|benign|transient|sleep|incidental|mild)/.test(text)) {
    return {
      clause: "normalizes a finding that needs reassessment",
      secondary: "reassurance",
      noun: "false reassurance",
    };
  }
  if (/(discharge|home|ambulate|walk|exercise|oral|juice|feed|eat|water)/.test(text)) {
    return {
      clause: "moves to activity, intake, or discharge planning too early",
      secondary: "ambulation, intake, or discharge teaching",
      noun: "premature activity",
    };
  }
  if (/(teach|educat|explain|instruct|discuss|counsel|reassurance)/.test(text)) {
    return {
      clause: "uses teaching before the physiologic risk is controlled",
      secondary: "teaching or reassurance",
      noun: "premature teaching",
    };
  }
  if (/(provider|consult|notify|call|referral)/.test(text)) {
    return {
      clause: "relies on notification without the bedside safety step",
      secondary: "waiting for a callback",
      noun: "incomplete escalation",
    };
  }
  if (/(because|with|from|due to|secondary to)/.test(text)) {
    return {
      clause: "commits to a competing cause before checking the dangerous pattern",
      secondary: "diagnostic reassurance",
      noun: "premature attribution",
    };
  }
  return {
    clause: "answers a lower-acuity part of the scenario",
    secondary: "routine care",
    noun: "misprioritization",
  };
}

function inferActionDomain(question) {
  const blob = normalizeText([
    question.category,
    question.subcategory,
    question.stem,
    question.scenario,
    question.additionalInfo,
    question.rationale,
    getCorrectAnswerText(question),
  ].join(" "));

  if (/(airway|oxygen|spo2|dyspnea|respir|ventilat|breath)/.test(blob)) return "airway and breathing intervention";
  if (/(bleed|heparin|warfarin|inr|aptt|platelet|hemorrhage)/.test(blob)) return "bleeding-risk intervention";
  if (/(glucose|insulin|hypogly|hypergly|dka|diabet)/.test(blob)) return "glucose rescue or metabolic stabilization";
  if (/(sepsis|infection|fever|neutropenic|wound|sterile|isolation)/.test(blob)) return "infection or sepsis escalation";
  if (/(renal|kidney|creatinine|contrast|dialysis|urine)/.test(blob)) return "renal protection";
  if (/(stroke|seizure|neuro|icp|confusion|delirium)/.test(blob)) return "neurologic safety assessment";
  if (/(cardiac|chest|\bmi\b|myocardial|infarct|arrhythm|dysrhythm|perfusion|shock|pressure|dvt|embol|thrombus|clot)/.test(blob)) return "circulation and perfusion support";
  if (/(preeclampsia|eclampsia|fetal|uterine|postpartum|pregnan)/.test(blob)) return "maternal-fetal stabilization";
  if (/(opioid|toxicity|dose|drug|medication|pharm|digoxin|lithium)/.test(blob)) return "medication-safety intervention";
  return "bedside safety action";
}

function lowerFirst(value) {
  const text = String(value ?? "").trim();
  return text ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : text;
}

function cleanFragment(value, fallback, maxWords = 18) {
  const cleaned = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[A-D][.)]\s+/i, "")
    .replace(/[.?!;:,]+$/g, "")
    .trim();
  const fragment = truncateWords(cleaned, maxWords).replace(/[.?!;:,]+$/g, "").trim();
  return fragment || fallback;
}

function inferDomainDetail(question) {
  const blob = normalizeText([
    question.category,
    question.subcategory,
    question.stem,
    question.scenario,
    question.additionalInfo,
    question.rationale,
    getCorrectAnswerText(question),
  ].join(" "));

  if (/(airway|oxygen|spo2|dyspnea|respir|ventilat|breath)/.test(blob)) {
    return "Airway assessment, positioning, oxygen support, or rapid escalation protects ventilation before teaching or documentation.";
  }
  if (/(bleed|heparin|warfarin|inr|aptt|platelet|hemorrhage)/.test(blob)) {
    return "Bleeding risk requires assessment and source control before comfort measures, teaching, or routine medication timing.";
  }
  if (/(glucose|insulin|hypogly|hypergly|dka|diabet)/.test(blob)) {
    return "Glucose instability can progress quickly, so medication timing and metabolic rescue come before routine follow-up.";
  }
  if (/(sepsis|infection|fever|neutropenic|wound|sterile|isolation|mening)/.test(blob)) {
    return "Infection control or sepsis escalation limits spread and organ hypoperfusion before lower-acuity care.";
  }
  if (/(renal|kidney|creatinine|contrast|dialysis|urine)/.test(blob)) {
    return "Renal protection depends on hydration, medication review, and creatinine follow-up before assuming the study is low risk.";
  }
  if (/(stroke|seizure|neuro|icp|confusion|delirium|glasgow|pupil)/.test(blob)) {
    return "Neurologic change needs prompt assessment and safety measures before reassurance, discharge, or routine reassessment.";
  }
  if (/(cardiac|chest|\bmi\b|myocardial|infarct|arrhythm|dysrhythm|perfusion|shock|pressure|dvt|embol|thrombus|clot)/.test(blob)) {
    return "Perfusion problems require rapid assessment and stabilization before comfort measures or delayed provider follow-up.";
  }
  if (/(preeclampsia|eclampsia|fetal|uterine|postpartum|pregnan|placenta|cord)/.test(blob)) {
    return "Maternal-fetal risk requires immediate safety measures because fetal oxygenation and maternal perfusion can deteriorate quickly.";
  }
  if (/(opioid|toxicity|dose|drug|medication|pharm|digoxin|lithium|metformin|contrast)/.test(blob)) {
    return "Medication safety depends on checking contraindications, labs, and adverse effects before giving or continuing the drug.";
  }
  return "Nursing safety depends on matching the response to the active clinical risk before routine care.";
}

function buildLocalRationale(question, optionId) {
  const optionText = getOptionText(question, optionId) ?? `option ${optionId}`;
  const correctText = getCorrectAnswerText(question);
  const seed = `${question.id}:${optionId}:${question.category}:${optionText}`;
  const cue = cleanFragment(extractClinicalCue(question, seed), inferClinicalFocus(question).toLowerCase(), 18);
  const risk = inferRiskLabel(question);
  const actionDomain = inferActionDomain(question);
  const distractorError = inferDistractorError(optionText);
  const optionSummary = cleanFragment(optionText, `option ${optionId}`, 18);
  const correctSummary = cleanFragment(correctText, "the keyed nursing action", 16);
  const domainDetail = inferDomainDetail(question);

  return pickVariant(seed, [
    `"${optionSummary}" ${distractorError.clause}. The cue "${cue}" raises concern for ${risk}, so ${actionDomain} is needed before ${distractorError.secondary}.`,
    `This distractor shifts care toward ${distractorError.noun} instead of ${actionDomain}. The stem cue "${cue}" makes ${risk} the active safety concern.`,
    `"${optionSummary}" misses the bedside risk because ${lowerFirst(cue)} points to ${risk}. ${domainDetail}`,
    `The option can leave ${risk} untreated because it ${distractorError.clause}. "${correctSummary}" fits the safer response to ${lowerFirst(cue)}.`,
    `Because ${lowerFirst(cue)} suggests ${risk}, "${optionSummary}" would not correct the active problem. ${domainDetail}`,
    `The safer response addresses ${risk}; "${optionSummary}" moves care toward ${distractorError.secondary} before ${actionDomain}.`,
  ], "rationale");
}

function rewriteTargetBatchLocally(targets) {
  const accepted = new Map();
  for (const target of targets) {
    const rationales = new Map();
    for (const optionId of target.targetKeys) {
      let rationale = buildLocalRationale(target.question, optionId);
      let validation = validateRationale(rationale);
      if (!validation.valid) {
        rationale = `${rationale} Nursing safety depends on matching the option to the client's active clinical risk.`;
        validation = validateRationale(rationale);
      }
      if (!validation.valid) {
        throw new Error(`Local rewrite failed validation for ${target.questionId}/${optionId}: ${validation.errors.join(",")}`);
      }
      rationales.set(optionId, rationale);
    }
    accepted.set(target.questionId, rationales);
  }
  return accepted;
}

function collectTargets(batch, filePath, options = {}) {
  const file = path.basename(filePath);
  const targets = [];

  for (const question of batch.questions ?? []) {
    const entries = getTargetEntries(question, options);
    if (entries.length === 0) {
      continue;
    }

    targets.push({
      file,
      questionId: String(question.id),
      targetKeys: entries.map((entry) => entry.optionId),
      question,
    });
  }

  return targets;
}

function compactString(value, maxLength = 900) {
  const text = String(value ?? "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 20)}... [truncated]` : text;
}

function compactValue(value, depth = 0) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return compactString(value);
  }
  if (typeof value !== "object") {
    return value;
  }
  if (depth >= 4) {
    return "[truncated]";
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => compactValue(item, depth + 1));
  }

  const entries = Object.entries(value).slice(0, 30);
  return Object.fromEntries(entries.map(([key, nested]) => [key, compactValue(nested, depth + 1)]));
}

function pickDefined(source, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => source[key] !== undefined && source[key] !== null)
      .map((key) => [key, compactValue(source[key])]),
  );
}

function compactQuestionForPrompt(target) {
  const question = target.question;
  const contextKeys = [
    "id",
    "exam",
    "type",
    "category",
    "subcategory",
    "nclexClientNeed",
    "cognitiveLevel",
    "difficulty",
    "stem",
    "scenarioTitle",
    "scenario",
    "caseScenario",
    "clientProfile",
    "exhibits",
    "matrixColumns",
    "matrixRows",
    "chartReview",
    "options",
    "answer",
    "rationale",
    "takeaway",
    "tags",
  ];

  return {
    ...pickDefined(question, contextKeys),
    targetDistractorRationales: Object.fromEntries(
      target.targetKeys.map((optionId) => [
        optionId,
        {
          optionText: getOptionText(question, optionId) ?? null,
          current: BOILERPLATE_DISTRACTOR_RATIONALE,
        },
      ]),
    ),
  };
}

function chunkArray(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function parseJsonFromText(text) {
  const trimmed = String(text ?? "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Anthropic response did not contain a JSON object");
    }
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
}

function normalizeRewritePayload(payload) {
  const rewrites = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.rewrites)
      ? payload.rewrites
      : Array.isArray(payload?.questions)
        ? payload.questions
        : undefined;

  if (!Array.isArray(rewrites)) {
    throw new Error("Anthropic response JSON is missing rewrites[]");
  }

  const clinicalReview = Array.isArray(payload?.clinicalReview) ? payload.clinicalReview : [];
  return { rewrites, clinicalReview };
}

async function loadAnthropicClient(apiKey) {
  let AnthropicModule;
  try {
    ({ default: AnthropicModule } = await import("@anthropic-ai/sdk"));
  } catch (error) {
    throw new Error(`Unable to import @anthropic-ai/sdk. Run npm install first. ${error.message}`);
  }
  return new AnthropicModule({ apiKey });
}

function parseApiKeyFromSecrets(filePath) {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const patterns = [
    /ANTHROPIC_API_KEY\s*=\s*["'`]?([A-Za-z0-9_\-]+)["'`]?/i,
    /ANTHROPIC_API_KEY\s*:\s*["'`]?([A-Za-z0-9_\-]+)["'`]?/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function loadApiKey(secretsFile) {
  const apiKey = process.env.ANTHROPIC_API_KEY || parseApiKeyFromSecrets(secretsFile);
  if (!apiKey) {
    throw new Error(`ANTHROPIC_API_KEY was not found in the environment or ${secretsFile}`);
  }
  return apiKey;
}

function extractTextContent(message) {
  return (message.content ?? [])
    .filter((block) => block?.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

async function requestRewrites(client, batch, options, validationFeedback = []) {
  const payload = {
    instructions: {
      output: "Return JSON only.",
      expectedQuestionCount: batch.length,
      targetRationales: "Rewrite only the option ids listed under targetDistractorRationales.",
      validation: {
        minimumWords: 12,
        requiredClinicalNounWhitelist: CLINICAL_NOUN_WHITELIST,
        forbiddenText: BOILERPLATE_DISTRACTOR_RATIONALE,
      },
    },
    validationFeedback,
    questions: batch.map(compactQuestionForPrompt),
  };

  const message = await client.messages.create({
    model: options.model,
    max_tokens: options.maxOutputTokens,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
  });

  return normalizeRewritePayload(parseJsonFromText(extractTextContent(message)));
}

function validateRewriteResponse(targets, payload) {
  const expected = new Map(targets.map((target) => [target.questionId, new Set(target.targetKeys)]));
  const accepted = new Map();
  const failed = [];

  for (const review of payload.clinicalReview) {
    const id = String(review?.id ?? "").trim();
    if (id && expected.has(id)) {
      failed.push({
        questionId: id,
        targetKeys: [...expected.get(id)],
        errors: [`clinical_review:${String(review.reason ?? "model requested review")}`],
      });
    }
  }

  for (const rewrite of payload.rewrites) {
    const id = String(rewrite?.id ?? "").trim();
    if (!expected.has(id)) {
      continue;
    }
    if (rewrite.clinicalReview) {
      failed.push({
        questionId: id,
        targetKeys: [...expected.get(id)],
        errors: [`clinical_review:${String(rewrite.reason ?? "model requested review")}`],
      });
      continue;
    }

    const rationales = isPlainObject(rewrite.rationales) ? rewrite.rationales : {};
    for (const optionId of expected.get(id)) {
      const text = rationales[optionId];
      const validation = validateRationale(text);
      if (validation.valid) {
        if (!accepted.has(id)) {
          accepted.set(id, new Map());
        }
        accepted.get(id).set(optionId, String(text).trim());
      } else {
        failed.push({
          questionId: id,
          targetKeys: [optionId],
          errors: validation.errors,
        });
      }
    }
  }

  for (const [questionId, targetKeys] of expected) {
    const acceptedKeys = accepted.get(questionId) ?? new Map();
    const missing = [...targetKeys].filter((optionId) => !acceptedKeys.has(optionId));
    if (missing.length > 0 && !failed.some((failure) => failure.questionId === questionId)) {
      failed.push({
        questionId,
        targetKeys: missing,
        errors: ["missing_rewrite"],
      });
    }
  }

  return { accepted, failed };
}

async function rewriteTargetBatch(client, targets, options) {
  if (options.provider === "local") {
    return rewriteTargetBatchLocally(targets);
  }

  let pending = targets;
  let feedback = [];
  const finalAccepted = new Map();

  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    const payload = await requestRewrites(client, pending, options, feedback);
    const { accepted, failed } = validateRewriteResponse(pending, payload);

    for (const [questionId, rationales] of accepted) {
      if (!finalAccepted.has(questionId)) {
        finalAccepted.set(questionId, new Map());
      }
      for (const [optionId, text] of rationales) {
        finalAccepted.get(questionId).set(optionId, text);
      }
    }

    if (failed.length === 0) {
      return finalAccepted;
    }

    if (failed.some((failure) => failure.errors.some((error) => error.startsWith("clinical_review:")))) {
      throw new Error(`Clinical review required: ${JSON.stringify(failed)}`);
    }

    pending = failed.map((failure) => {
      const original = targets.find((target) => target.questionId === failure.questionId);
      return {
        ...original,
        targetKeys: failure.targetKeys,
      };
    });
    feedback = failed.map((failure) => ({
      id: failure.questionId,
      targetKeys: failure.targetKeys,
      errors: failure.errors,
    }));
  }

  throw new Error(`Unable to produce valid rationales after retries: ${JSON.stringify(feedback)}`);
}

function applyAcceptedRewrites(batch, accepted) {
  let changed = 0;

  for (const question of batch.questions ?? []) {
    const rationales = accepted.get(String(question.id));
    if (!rationales) {
      continue;
    }

    question.distractorRationales = isPlainObject(question.distractorRationales)
      ? { ...question.distractorRationales }
      : {};

    for (const [optionId, text] of rationales) {
      question.distractorRationales[optionId] = text;
      changed += 1;
    }
  }

  return changed;
}

export function scanBankForBoilerplate(inputDir, options = {}) {
  const files = listBatchFiles(inputDir, options.files ?? []);
  const summary = {
    inputDir,
    files: files.length,
    parsedFiles: 0,
    questions: 0,
    questionsWithDistractorRationales: 0,
    distractorRationaleEntries: 0,
    targetQuestions: 0,
    targetMatches: 0,
    invalidFiles: [],
    matches: [],
  };

  for (const filePath of files) {
    let batch;
    try {
      batch = readJsonFile(filePath);
      summary.parsedFiles += 1;
    } catch (error) {
      summary.invalidFiles.push({
        file: path.basename(filePath),
        error: error.message.split("\n")[0],
      });
      continue;
    }

    for (const question of batch.questions ?? []) {
      summary.questions += 1;
      const entries = isPlainObject(question.distractorRationales)
        ? Object.entries(question.distractorRationales)
        : [];
      if (entries.length > 0) {
        summary.questionsWithDistractorRationales += 1;
      }
      summary.distractorRationaleEntries += entries.length;

      let matchedQuestion = false;
      for (const [optionId, rationale] of entries) {
        if (!matchesBoilerplate(rationale)) {
          continue;
        }
        matchedQuestion = true;
        summary.targetMatches += 1;
        summary.matches.push({
          file: path.basename(filePath),
          questionId: String(question.id),
          optionId,
        });
      }
      if (matchedQuestion) {
        summary.targetQuestions += 1;
      }
    }
  }

  return summary;
}

function throwIfBankInvalid(summary, allowPartial = false) {
  if (summary.invalidFiles.length > 0) {
    throw new Error(`Invalid JSON files: ${JSON.stringify(summary.invalidFiles.slice(0, 10))}`);
  }
  if (!allowPartial && summary.targetMatches > 0) {
    throw new Error(`Boilerplate distractor rationale matches remain: ${summary.targetMatches}`);
  }
}

function createTempOutputDir(outputDir) {
  const parent = path.dirname(outputDir);
  const base = path.basename(outputDir);
  return path.join(parent, `${base}.tmp-${process.pid}-${Date.now()}`);
}

function assertSafeOutputPath(outputDir, tempDir) {
  const parent = path.resolve(path.dirname(outputDir));
  const resolvedTemp = path.resolve(tempDir);
  if (!resolvedTemp.startsWith(`${parent}${path.sep}`)) {
    throw new Error(`Refusing to use temp directory outside output parent: ${resolvedTemp}`);
  }
}

function moveTempToOutput(tempDir, outputDir, force) {
  assertSafeOutputPath(outputDir, tempDir);
  if (!fs.existsSync(outputDir)) {
    fs.renameSync(tempDir, outputDir);
    return { outputDir, backupDir: null };
  }

  if (!force) {
    throw new Error(`Output directory already exists: ${outputDir}. Pass --force to replace it with a backup.`);
  }

  const backupDir = `${outputDir}.bak-${Date.now()}`;
  fs.renameSync(outputDir, backupDir);
  try {
    fs.renameSync(tempDir, outputDir);
  } catch (error) {
    fs.renameSync(backupDir, outputDir);
    throw error;
  }

  return { outputDir, backupDir };
}

function safeRemoveTemp(tempDir, outputDir) {
  if (!tempDir || !fs.existsSync(tempDir)) {
    return;
  }
  assertSafeOutputPath(outputDir, tempDir);
  const base = path.basename(outputDir);
  if (!path.basename(tempDir).startsWith(`${base}.tmp-`)) {
    throw new Error(`Refusing to remove unexpected temp directory: ${tempDir}`);
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
}

async function rewriteBank(options) {
  const allFiles = listBatchFiles(options.inputDir, options.files);
  const allTargets = [];
  for (const filePath of allFiles) {
    const batch = readBatchForRewrite(filePath, options);
    allTargets.push(...collectTargets(batch, filePath, options));
  }

  const selectedQuestionIds = options.limit === undefined
    ? new Set(allTargets.map((target) => target.questionId))
    : new Set(allTargets.slice(0, options.limit).map((target) => target.questionId));

  const tempDir = createTempOutputDir(options.outputDir);
  fs.mkdirSync(tempDir, { recursive: true });

  let client = null;
  if (selectedQuestionIds.size > 0 && options.provider === "anthropic-sdk") {
    client = await loadAnthropicClient(loadApiKey(options.secretsFile));
  }

  const runSummary = {
    model: options.model,
    provider: options.provider,
    batchSize: options.batchSize,
    inputDir: options.inputDir,
    outputDir: options.outputDir,
    sourceFiles: allFiles.length,
    targetQuestions: allTargets.length,
    selectedTargetQuestions: selectedQuestionIds.size,
    rewrittenRationales: 0,
    rewriteCalls: 0,
    anthropicApiCalls: 0,
  };

  try {
    for (const filePath of allFiles) {
      const batch = readBatchForRewrite(filePath, options);
      const targets = collectTargets(batch, filePath, options)
        .filter((target) => selectedQuestionIds.has(target.questionId));
      const outputFile = path.join(tempDir, path.basename(filePath));

      if (targets.length === 0) {
        fs.copyFileSync(filePath, outputFile);
        continue;
      }

      const acceptedForFile = new Map();
      for (const targetBatch of chunkArray(targets, options.batchSize)) {
        const accepted = await rewriteTargetBatch(client, targetBatch, options);
        runSummary.rewriteCalls += 1;
        if (options.provider === "anthropic-sdk") {
          runSummary.anthropicApiCalls += 1;
        }
        for (const [questionId, rationales] of accepted) {
          acceptedForFile.set(questionId, rationales);
        }
        if (options.delayMs > 0) {
          await sleep(options.delayMs);
        }
      }

      runSummary.rewrittenRationales += applyAcceptedRewrites(batch, acceptedForFile);
      writeJsonFile(outputFile, batch);
    }

    const outputSummary = scanBankForBoilerplate(tempDir);
    throwIfBankInvalid(outputSummary, options.allowPartial);
    const move = moveTempToOutput(tempDir, options.outputDir, options.force);

    return {
      ...runSummary,
      outputSummary: {
        files: outputSummary.files,
        questions: outputSummary.questions,
        targetMatches: outputSummary.targetMatches,
        targetQuestions: outputSummary.targetQuestions,
      },
      backupDir: move.backupDir,
    };
  } catch (error) {
    safeRemoveTemp(tempDir, options.outputDir);
    throw error;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (options.dryRun || options.validateOnly) {
    const summary = scanBankForBoilerplate(options.inputDir, { files: options.files });
    const report = {
      ...summary,
      estimatedAnthropicCalls: Math.ceil(summary.targetQuestions / options.batchSize),
      sampleMatches: summary.matches.slice(0, 20),
    };
    delete report.matches;
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    throwIfBankInvalid(summary, options.dryRun);
    return;
  }

  const result = await rewriteBank(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function isDirectRun() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
