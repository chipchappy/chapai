import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const chapaiRoot = path.resolve(packageRoot, "..", "..");
const questionsRoot = path.join(packageRoot, "questions");
const summaryFile = path.join(packageRoot, "src", "generated-summary.ts");
const canonicalNclexLiveFile = path.join(questionsRoot, "nclex", "live", "reviewed-curated-live.unique.json");
const nclexSeedFile = path.join(questionsRoot, "nclex", "draft", "nclex-diversity-seeds.json");
const nclexNgnSeedFile = path.join(questionsRoot, "nclex", "draft", "nclex-ngn-diversity-seeds.json");
const liveCurationReport = path.join(chapaiRoot, "config", "live-curation-latest.json");
const reviewReport = path.join(chapaiRoot, "config", "content-review-latest.json");

const NCLEX_TARGETS = {
  management_of_care: 400,
  safety_infection_control: 240,
  health_promotion: 180,
  psychosocial: 180,
  basic_care_comfort: 180,
  pharmacological: 180,
  risk_reduction: 240,
  physiological_adaptation: 400,
};

const FORMAT_KEYS = ["mcq", "sata", "case_study", "bow_tie", "ordering", "matrix", "highlight", "cloze", "drag_drop"];

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseExistingSummary() {
  if (!fs.existsSync(summaryFile)) {
    return {};
  }

  const text = fs.readFileSync(summaryFile, "utf8");
  const match = text.match(/export const contentSummary = ([\s\S]+?) as const;/);
  if (!match) {
    return {};
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

function loadArray(filePath) {
  const parsed = loadJson(filePath, []);
  return Array.isArray(parsed) ? parsed : [];
}

function countQuestions(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => loadArray(path.join(dir, file)))
    .length;
}

function normalizeType(type) {
  const raw = String(type || "mcq").trim().toLowerCase();
  if (raw === "bow-tie") return "bow_tie";
  if (raw === "drag-drop") return "drag_drop";
  return FORMAT_KEYS.includes(raw) ? raw : "mcq";
}

function inferNclexClientNeedFromText(rawText) {
  const text = String(rawText || "").toLowerCase();
  if (!text) {
    return "physiological_adaptation";
  }

  if (/(deleg|scope|assignment|triage|consent|ethic|abuse|chain[_ ]of[_ ]command|advance[_ ]directive|discharge|reporting|emtala|organ[_ ]donation|leadership|priority[_ ]triage)/.test(text)) return "management_of_care";
  if (/(infection|isolation|precaution|fall|restraint|tb|mrsa|c[_ ]?diff|sharps|airborne|latex|hazmat|timeout|fire[_ ]safety|contact[_ ]precautions|transmission)/.test(text)) return "safety_infection_control";
  if (/(screen|immuniz|well[_ ]child|prenatal|breastfeed|contracept|milestone|health[_ ]promotion|lifestyle|smoking[_ ]cessation|cancer[_ ]screening|gestational[_ ]diabetes[_ ]screening|osteoporosis)/.test(text)) return "health_promotion";
  if (/(psych|suicid|grief|ptsd|assault|autism|depress|schizoph|withdrawal|anorexia|domestic[_ ]violence|crisis[_ ]intervention|opioid[_ ]use[_ ]disorder|acute[_ ]psychosis|de[_ ]escalation)/.test(text)) return "psychosocial";
  if (/(ostomy|feeding|tube|pain|rom|pressure[_ ]inj|sleep|nutrition|comfort|postmortem|wound[_ ]vac|palliative|ng[_ ]tube|enteral|immobility|perioperative[_ ]npo)/.test(text)) return "basic_care_comfort";
  if (/(insulin|heparin|warfarin|digoxin|drug|medication|anticoagul|pharm|toxic|overdose|antidote|aminoglycoside|chemotherapy|lithium|magnesium[_ ]sulfate|nitroglycerin|leucovorin|serotonin[_ ]syndrome|neuroleptic[_ ]malignant)/.test(text)) return "pharmacological";
  if (/(risk|monitor|chest[_ ]tube|abg|ecg|catheter|central[_ ]line|contrast|biopsy|dialysis|procedure|complication|reduction|lumbar[_ ]puncture|cardiac[_ ]catheterization|peritoneal[_ ]dialysis|transfusion|air[_ ]leak|peritonitis|diagnostic)/.test(text)) return "risk_reduction";
  return "physiological_adaptation";
}

function buildSeedClientNeedMap() {
  const seedItems = [
    ...loadArray(nclexSeedFile),
    ...loadArray(nclexNgnSeedFile),
  ];
  const map = new Map();
  for (const item of seedItems) {
    const category = String(item?.category || "").trim();
    if (!category || map.has(category)) {
      continue;
    }
    const explicit = String(item?.nclexClientNeed || "").trim();
    map.set(category, explicit || inferNclexClientNeedFromText([
      item?.category,
      item?.subcategory,
      ...(Array.isArray(item?.tags) ? item.tags : []),
    ].join(" ")));
  }
  return map;
}

function resolveNclexClientNeed(question, seedClientNeedMap) {
  const explicit = String(question?.nclexClientNeed || "").trim();
  if (explicit) {
    return explicit;
  }

  const category = String(question?.category || "").trim();
  if (category && seedClientNeedMap.has(category)) {
    return seedClientNeedMap.get(category);
  }

  const blob = [
    question?.category,
    question?.subcategory,
    ...(Array.isArray(question?.tags) ? question.tags : []),
  ].join(" ");

  return inferNclexClientNeedFromText(blob);
}

function countByFormat(questions) {
  const counts = Object.fromEntries(FORMAT_KEYS.map((key) => [key, 0]));
  for (const question of questions) {
    counts[normalizeType(question?.type)] += 1;
  }
  return counts;
}

function countByCategory(questions, seedClientNeedMap) {
  const counts = Object.fromEntries(Object.keys(NCLEX_TARGETS).map((key) => [key, 0]));
  for (const question of questions) {
    const key = resolveNclexClientNeed(question, seedClientNeedMap);
    if (key in counts) {
      counts[key] += 1;
    }
  }
  return counts;
}

function buildThinFamilies(questions) {
  const categoryCounts = new Map();
  const categoryTypeCounts = new Map();

  for (const question of questions) {
    const category = String(question?.category || "").trim();
    if (!category) continue;
    const type = normalizeType(question?.type);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    const typeKey = `${category}::${type}`;
    categoryTypeCounts.set(typeKey, (categoryTypeCounts.get(typeKey) || 0) + 1);
  }

  return Array.from(categoryCounts.entries())
    .map(([family, liveCount]) => ({
      family,
      liveCount,
      missingPreferredTypes: ["case_study", "bow_tie", "sata", "ordering", "matrix"].filter(
        (type) => !categoryTypeCounts.get(`${family}::${type}`),
      ),
    }))
    .filter((item) => item.liveCount < 3 || item.missingPreferredTypes.length > 0)
    .sort((left, right) => left.liveCount - right.liveCount || left.family.localeCompare(right.family))
    .slice(0, 20);
}

function buildMilestones(nclexLive, formatMix, categoryMix) {
  const mcqShare = nclexLive > 0 ? Math.round((formatMix.mcq / nclexLive) * 100) : 0;
  const ngnShare = nclexLive > 0 ? Math.round(((nclexLive - formatMix.mcq) / nclexLive) * 100) : 0;
  return [500, 1000, 1500, 2000].map((target) => {
    const blockers = [];
    if (mcqShare > 30) blockers.push("MCQ share above target");
    if (ngnShare < 60) blockers.push("NGN share below 60%");
    if (target >= 1000) {
      const laggingCategories = Object.entries(categoryMix)
        .filter(([key, count]) => count < Math.floor(NCLEX_TARGETS[key] * (target / 2000) * 0.8))
        .map(([key]) => key);
      if (laggingCategories.length > 0) {
        blockers.push(`Category mix lagging: ${laggingCategories.slice(0, 3).join(", ")}`);
      }
    }
    return {
      target,
      reached: nclexLive >= target,
      blocker: blockers[0] ?? "none",
    };
  });
}

function buildWaveLog(previousSummary, nclexLive) {
  const prior = Array.isArray(previousSummary?.nclex?.waveLog) ? previousSummary.nclex.waveLog : [];
  const liveCuration = loadJson(liveCurationReport, {});
  const review = loadJson(reviewReport, {});
  const batchId = String(liveCuration?.batchId || "");

  if (!batchId || prior.some((wave) => wave?.batchId === batchId)) {
    return prior;
  }

  const generated = Number(review?.sample?.totalQuestions || liveCuration?.promotedCount || 0);
  const passed = Number(liveCuration?.promotedCount || review?.scorecard?.strictPromotionReady || 0);
  const passRate = generated > 0 ? Math.round((passed / generated) * 100) : 0;
  return [
    ...prior,
    {
      wave: prior.length + 1,
      batchId,
      generated,
      passed,
      passRate,
      newLive: nclexLive,
      timestamp: liveCuration?.generatedAt || new Date().toISOString(),
    },
  ].slice(-64);
}

function buildSummary() {
  const previousSummary = parseExistingSummary();
  const canonicalNclex = loadArray(canonicalNclexLiveFile);
  const seedClientNeedMap = buildSeedClientNeedMap();
  const nclexFormatMix = countByFormat(canonicalNclex);
  const nclexCategoryMix = countByCategory(canonicalNclex, seedClientNeedMap);
  const nclexThinFamilies = buildThinFamilies(canonicalNclex);
  const waveLog = buildWaveLog(previousSummary, canonicalNclex.length);
  const latestWave = waveLog[waveLog.length - 1] ?? null;
  const ngnLive = canonicalNclex.length - nclexFormatMix.mcq;
  const ngnRatio = canonicalNclex.length > 0 ? Math.round((ngnLive / canonicalNclex.length) * 100) : 0;

  return {
    generatedAt: new Date().toISOString(),
    ccrn: {
      live: countQuestions(path.join(questionsRoot, "ccrn", "live")),
      draft: countQuestions(path.join(questionsRoot, "ccrn", "draft")),
    },
    nclex: {
      live: canonicalNclex.length,
      draft: countQuestions(path.join(questionsRoot, "nclex", "draft")),
      ngnRatio,
      passRate: latestWave?.passRate ?? 0,
      waveLog,
      formatMix: nclexFormatMix,
      categoryMix: nclexCategoryMix,
      thinFamilies: nclexThinFamilies,
      milestones: buildMilestones(canonicalNclex.length, nclexFormatMix, nclexCategoryMix),
    },
  };
}

const payload = buildSummary();
fs.writeFileSync(summaryFile, `export const contentSummary = ${JSON.stringify(payload, null, 2)} as const;\n`, "utf8");
console.log(JSON.stringify(payload, null, 2));
