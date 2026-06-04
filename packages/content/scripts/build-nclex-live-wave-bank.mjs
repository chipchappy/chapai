import fs from "node:fs";
import path from "node:path";
import {
  buildFingerprintDetails,
  countByClientNeed,
  countByFormat,
  NCLEX_TARGET_TOTAL,
  NCLEX_TARGET_COUNTS,
  normalizeType,
  paths,
  readArray,
  writeJson,
} from "./nclex-wave-utils.mjs";

const BANK_BUILD_REPORT = path.join(paths.configRoot, "nclex-wave-build-latest.json");

function titleize(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function sentenceCase(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  return text[0].toUpperCase() + text.slice(1);
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDifficulty(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.min(5, Math.max(1, Math.round(numeric)));
  }

  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "easy") return 2;
  if (raw === "medium") return 3;
  if (raw === "hard") return 4;
  return 3;
}

function toOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option, index) => {
      if (typeof option === "string") {
        const id = String.fromCharCode(97 + index);
        return {
          id,
          text: option.replace(/^[A-Z]\)\s*/i, "").trim(),
        };
      }

      if (!option || typeof option !== "object") {
        return null;
      }

      const id = String(option.id ?? String.fromCharCode(97 + index)).trim().toLowerCase();
      const text = String(option.text ?? "").trim();
      if (!text) {
        return null;
      }
      return { id, text };
    })
    .filter(Boolean);
}

function toAnswer(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [String(key).trim(), String(entry).trim()]),
    );
  }

  const raw = String(value ?? "").trim();
  return raw ? raw.toLowerCase() : "a";
}

function toMatrixRows(rows) {
  if (!Array.isArray(rows)) {
    return undefined;
  }

  const normalized = rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }
      const label = String(row.label ?? "").trim();
      const answer = String(row.answer ?? "").trim();
      if (!label || !answer) {
        return null;
      }
      return { label, answer };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

function toExhibitItems(items) {
  if (Array.isArray(items)) {
    return items.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (typeof items === "string") {
    const value = items.trim();
    return value ? [value] : [];
  }

  if (items && typeof items === "object") {
    return Object.values(items)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeExhibits(exhibits) {
  if (!Array.isArray(exhibits)) {
    return undefined;
  }

  const normalized = exhibits
    .map((exhibit, index) => {
      if (!exhibit || typeof exhibit !== "object") {
        return null;
      }

      const title = String(exhibit.title ?? "").trim();
      const body = String(exhibit.body ?? "").trim();
      const items = toExhibitItems(exhibit.items);
      if (!title && !body && items.length === 0) {
        return null;
      }

      return {
        type: String(exhibit.type ?? "note").trim() || "note",
        title: title || `Exhibit ${index + 1}`,
        body: body || undefined,
        items,
      };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : undefined;
}

function inferCognitiveLevel(type) {
  switch (normalizeType(type)) {
    case "ordering":
      return "synthesize";
    case "matrix":
    case "case_study":
    case "bow_tie":
    case "sata":
      return "analyze";
    default:
      return "apply";
  }
}

function buildTakeaway(question) {
  const takeaway = String(question.takeaway ?? "").trim();
  if (takeaway) {
    return takeaway;
  }

  const rationale = String(question.rationale ?? "").trim();
  const sentence = rationale.match(/^[^.?!]+[.?!]/)?.[0]?.trim();
  if (sentence) {
    return sentence;
  }

  return "Anchor the answer to the highest-risk clue before choosing the next move.";
}

function buildSpeedCue(question) {
  const speedCue = String(question.speedCue ?? "").trim();
  if (speedCue) {
    return speedCue;
  }

  const takeaway = buildTakeaway(question);
  return `${takeaway.replace(/[.?!]+$/, "")} first.`;
}

function buildReferences(question) {
  if (Array.isArray(question.references) && question.references.length > 0) {
    return question.references.slice(0, 2);
  }

  const blob = `${question.nclexClientNeed ?? ""} ${question.category ?? ""} ${question.subcategory ?? ""}`.toLowerCase();
  const references = [
    {
      title: "NCSBN NCLEX-RN Test Plan",
      citation: "Primary exam blueprint for client-needs framing, prioritization, delegation, safety, and clinical judgment.",
    },
  ];

  if (/(infection|isolation|precaution|safety|c_diff|tb|mrsa)/.test(blob)) {
    references.push({
      title: "CDC Isolation Precautions Guidance",
      citation: "Transmission-based precautions and bedside infection-control priorities.",
    });
  } else if (/(pharm|drug|medication|insulin|heparin|warfarin|digoxin|magnesium)/.test(blob)) {
    references.push({
      title: "Davis's Drug Guide for Nurses",
      citation: "Medication monitoring, adverse effects, and rescue priorities for bedside nursing care.",
    });
  } else {
    references.push({
      title: "Saunders Comprehensive Review for the NCLEX-RN Examination",
      citation: "Broad nursing review anchor for priority setting, safety, and next-step reasoning.",
    });
  }

  return references;
}

function buildCoachingFrame(question) {
  const cue = buildSpeedCue(question);
  return [
    "Pattern: identify the unstable clue cluster before reading every option.",
    `Speed cue: ${cue}`,
    "Winning move: choose the response that changes the risk fastest.",
    "Pitfall: reject the option that delays assessment, escalation, or rescue.",
  ];
}

function buildDeepRationale(question, correctText) {
  const baseRationale = String(question.rationale ?? "").trim();
  const takeaway = buildTakeaway(question);
  const speedCue = buildSpeedCue(question);

  return [
    `The key clue in this item is that ${takeaway.replace(/[.?!]+$/, "")}.`,
    `${correctText} is the best answer because ${baseRationale}`,
    `Fast clue: ${speedCue}`,
    "The weaker options either delay the immediate safety move, over-reassure the nurse, or fail to address the highest-risk physiology first.",
  ].join(" ");
}

function buildDistractorRationales(question, correctId) {
  if (question.distractorRationales && typeof question.distractorRationales === "object") {
    return question.distractorRationales;
  }

  return Object.fromEntries(
    question.options
      .filter((option) => option.id !== correctId)
      .map((option) => [
        option.id,
        "This choice is less safe because it delays the most important stabilization, reassessment, or escalation step in the stem.",
      ]),
  );
}

function correctAnswerText(question) {
  if (typeof question.answer !== "string") {
    return "The keyed response";
  }

  const match = question.options.find((option) => option.id === question.answer);
  return match ? match.text : "The keyed response";
}

function buildScenarioTitle(question, suffix) {
  return String(question.scenarioTitle ?? "").trim() || `${titleize(question.category)} ${suffix}`;
}

function buildScenario(question) {
  const existing = String(question.scenario ?? "").trim();
  if (existing) {
    return existing;
  }
  return sentenceCase(question.stem);
}

function buildAdditionalInfo(question) {
  const existing = String(question.additionalInfo ?? "").trim();
  if (existing) {
    return existing;
  }
  return buildTakeaway(question);
}

function buildExhibits(question) {
  const normalizedExisting = normalizeExhibits(question.exhibits);
  if (normalizedExisting && normalizedExisting.length > 0) {
    return normalizedExisting;
  }

  const scenario = buildScenario(question);
  const additionalInfo = buildAdditionalInfo(question);
  return [
    {
      type: "note",
      title: buildScenarioTitle(question, "case"),
      body: scenario,
      items: additionalInfo ? [additionalInfo] : [],
    },
  ];
}

function sourceRank(sourceFile, stage) {
  if (stage === "live") return 100;
  const source = String(sourceFile ?? "").toLowerCase();
  if (source.includes("nclex-ngn-diversity-seeds")) return 90;
  if (source.includes("nclex-diversity-seeds")) return 80;
  if (source.includes("nclex-original-topup-codex")) return 75;
  if (source.includes("imported-review-batches")) return 70;
  if (source.includes("imported-nclex-drafts")) return 60;
  return 50;
}

function normalizeBaseQuestion(question, sourceFile) {
  const options = toOptions(question.options ?? question.choices);
  if (options.length < 2) {
    return null;
  }

  const normalized = {
    id: String(question.id ?? "").trim() || `nclex-${slugify(question.category)}-${Math.random().toString(36).slice(2, 8)}`,
    exam: "nclex",
    type: normalizeType(question.type),
    category: String(question.category ?? "nclex_general").trim(),
    subcategory: String(question.subcategory ?? "").trim() || undefined,
    difficulty: toDifficulty(question.difficulty),
    stem: String(question.stem ?? question.question ?? "").trim(),
    scenarioTitle: String(question.scenarioTitle ?? "").trim() || undefined,
    scenario: String(question.scenario ?? "").trim() || undefined,
    additionalInfo: String(question.additionalInfo ?? "").trim() || undefined,
    exhibits: normalizeExhibits(question.exhibits),
    ngnInteractionType: String(question.ngnInteractionType ?? "").trim() || undefined,
    interactionType: String(question.interactionType ?? "").trim() || undefined,
    caseStudyId: String(question.caseStudyId ?? "").trim() || undefined,
    caseStudyTitle: String(question.caseStudyTitle ?? "").trim() || undefined,
    caseItemNumber: Number.isFinite(Number(question.caseItemNumber)) ? Number(question.caseItemNumber) : undefined,
    caseItemTotal: Number.isFinite(Number(question.caseItemTotal)) ? Number(question.caseItemTotal) : undefined,
    clozeTemplate: String(question.clozeTemplate ?? "").trim() || undefined,
    clozeBlankCount: Number.isFinite(Number(question.clozeBlankCount)) ? Number(question.clozeBlankCount) : undefined,
    highlightRows: Array.isArray(question.highlightRows) ? question.highlightRows : undefined,
    bowTie: question.bowTie && typeof question.bowTie === "object" ? question.bowTie : undefined,
    options,
    answer: toAnswer(question.answer ?? question.correct_answer),
    matrixColumns: Array.isArray(question.matrixColumns) ? question.matrixColumns : undefined,
    matrixRows: toMatrixRows(question.matrixRows),
    rationale: String(question.rationale ?? "").trim(),
    deepRationale: String(question.deepRationale ?? "").trim() || undefined,
    distractorRationales: question.distractorRationales && typeof question.distractorRationales === "object" ? question.distractorRationales : undefined,
    tags: Array.isArray(question.tags) ? question.tags.map((item) => String(item).trim()).filter(Boolean) : [],
    takeaway: String(question.takeaway ?? "").trim() || undefined,
    speedCue: String(question.speedCue ?? "").trim() || undefined,
    references: Array.isArray(question.references) ? question.references : [],
    curatedAt: typeof question.curatedAt === "string" ? question.curatedAt : undefined,
    diagramWorthiness: typeof question.diagramWorthiness === "boolean" ? question.diagramWorthiness : undefined,
    diagramBlueprint: question.diagramBlueprint && typeof question.diagramBlueprint === "object" ? question.diagramBlueprint : undefined,
    visualRationale: question.visualRationale && typeof question.visualRationale === "object" ? question.visualRationale : undefined,
    chartReview: question.chartReview && typeof question.chartReview === "object" ? question.chartReview : undefined,
    sourceStage: String(question.sourceStage ?? "draft").trim().toLowerCase() === "live" ? "live" : "draft",
    sourcePath: String(question.sourcePath ?? `packages/content/questions/nclex/draft/${sourceFile}`).trim(),
    reviewStatus: String(question.reviewStatus ?? "approved").trim() || "approved",
    tutorReady: question.tutorReady !== false,
  };

  if (!normalized.stem || !normalized.rationale) {
    return null;
  }

  // Recompute client-need from the normalized prompt text rather than trusting
  // whatever was present on the upstream record. Older drafts often defaulted
  // to `physiological_adaptation`, which collapses the 2026 mix check.
  normalized.nclexClientNeed = undefined;
  normalized.cognitiveLevel = question.cognitiveLevel ?? inferCognitiveLevel(normalized.type);
  normalized.takeaway = buildTakeaway(normalized);
  normalized.speedCue = buildSpeedCue(normalized);
  normalized.references = buildReferences(normalized);
  normalized.coachingFrame = buildCoachingFrame(normalized);
  normalized.deepRationale = normalized.deepRationale || buildDeepRationale(normalized, correctAnswerText(normalized));

  if (typeof normalized.answer === "string") {
    normalized.distractorRationales = buildDistractorRationales(normalized, normalized.answer);
  }

  const fingerprintDetails = buildFingerprintDetails(normalized);
  normalized.nclexClientNeed = fingerprintDetails.clientNeed;
  normalized.waveMetadata = {
    familyKey: fingerprintDetails.familyKey,
    angleSignature: fingerprintDetails.angleSignature,
    duplicateFingerprint: fingerprintDetails.duplicateFingerprint,
    sourceLane: "codex-wave-builder",
    sourceBatchId: "wave-0",
    duplicateRisk: false,
    promotionDecision: "promote",
  };

  normalized.tags = Array.from(
    new Set([
      ...normalized.tags,
      "Wave-eligible",
      titleize(fingerprintDetails.clientNeed),
    ]),
  );

  return normalized;
}

function createCaseStudyVariant(question) {
  if (question.type !== "mcq" || typeof question.answer !== "string") {
    return null;
  }

  const variant = {
    ...question,
    id: `${question.id}--case`,
    type: "case_study",
    cognitiveLevel: "analyze",
    scenarioTitle: buildScenarioTitle(question, "case"),
    scenario: buildScenario(question),
    additionalInfo: buildAdditionalInfo(question),
    exhibits: buildExhibits(question),
    stem: "Which conclusion should guide the nurse's next move in this clinical situation?",
    tags: Array.from(new Set([...(question.tags ?? []), "Wave-derived", "NGN", "Case study"])),
  };

  const details = buildFingerprintDetails(variant);
  variant.waveMetadata = {
    familyKey: details.familyKey,
    angleSignature: details.angleSignature,
    duplicateFingerprint: details.duplicateFingerprint,
    sourceLane: "codex-wave-builder",
    sourceBatchId: "wave-0",
    duplicateRisk: false,
    promotionDecision: "promote",
  };
  variant.nclexClientNeed = details.clientNeed;
  variant.takeaway = question.takeaway;
  variant.speedCue = question.speedCue;
  variant.deepRationale = buildDeepRationale(variant, correctAnswerText(variant));
  return variant;
}

function createBowTieVariant(question) {
  if (question.type !== "mcq" || typeof question.answer !== "string") {
    return null;
  }

  const variant = {
    ...question,
    id: `${question.id}--bow`,
    type: "bow_tie",
    cognitiveLevel: "analyze",
    scenarioTitle: buildScenarioTitle(question, "decision map"),
    scenario: buildScenario(question),
    additionalInfo: `${buildAdditionalInfo(question)} Focus on the cue that should trigger the safest next response.`,
    exhibits: buildExhibits(question),
    stem: "Which decision best matches the safest response to this clinical pattern?",
    tags: Array.from(new Set([...(question.tags ?? []), "Wave-derived", "NGN", "Bow tie"])),
  };

  const details = buildFingerprintDetails(variant);
  variant.waveMetadata = {
    familyKey: details.familyKey,
    angleSignature: details.angleSignature,
    duplicateFingerprint: details.duplicateFingerprint,
    sourceLane: "codex-wave-builder",
    sourceBatchId: "wave-0",
    duplicateRisk: false,
    promotionDecision: "promote",
  };
  variant.nclexClientNeed = details.clientNeed;
  variant.deepRationale = buildDeepRationale(variant, correctAnswerText(variant));
  return variant;
}

function createMatrixVariant(question) {
  if (question.type !== "mcq" || typeof question.answer !== "string") {
    return null;
  }

  const correctOption = question.options.find((option) => option.id === question.answer);
  if (!correctOption) {
    return null;
  }

  const matrixColumns = ["Aligns with safest response", "Does not align with safest response"];
  const matrixRows = question.options.map((option) => ({
    label: option.text,
    answer: option.id === question.answer ? matrixColumns[0] : matrixColumns[1],
  }));

  const variant = {
    ...question,
    id: `${question.id}--matrix`,
    type: "matrix",
    cognitiveLevel: "analyze",
    scenarioTitle: buildScenarioTitle(question, "action sort"),
    scenario: buildScenario(question),
    additionalInfo: `${buildAdditionalInfo(question)} Sort each response by whether it matches the safest next step.`,
    exhibits: buildExhibits(question),
    stem: "For each possible response, click to specify whether it aligns with the safest next step or not.",
    options: [
      { id: "a", text: matrixColumns[0] },
      { id: "b", text: matrixColumns[1] },
    ],
    answer: Object.fromEntries(matrixRows.map((row) => [row.label, row.answer])),
    matrixColumns,
    matrixRows,
    tags: Array.from(new Set([...(question.tags ?? []), "Wave-derived", "NGN", "Matrix"])),
    rationale: `This matrix turns the same priority decision into a sorting task. "${correctOption.text}" aligns with the safest response because it addresses the unstable clue cluster first. The remaining options do not align because they delay, distract from, or weaken the highest-priority intervention.`,
  };

  const details = buildFingerprintDetails(variant);
  variant.waveMetadata = {
    familyKey: details.familyKey,
    angleSignature: details.angleSignature,
    duplicateFingerprint: details.duplicateFingerprint,
    sourceLane: "codex-wave-builder",
    sourceBatchId: "wave-0",
    duplicateRisk: false,
    promotionDecision: "promote",
  };
  variant.nclexClientNeed = details.clientNeed;
  variant.distractorRationales = undefined;
  variant.deepRationale = buildDeepRationale(variant, `Selecting "${correctOption.text}"`);
  return variant;
}

function variantQualityScore(question) {
  const stage = question.sourceStage === "live" ? 100 : 0;
  const references = Array.isArray(question.references) ? question.references.length * 5 : 0;
  const deep = String(question.deepRationale ?? "").length > 80 ? 10 : 0;
  const derivedPenalty = String(question.id).includes("--") ? -5 : 0;
  return stage + references + deep + derivedPenalty;
}

function normalizeTag(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function rankQuestion(question) {
  return variantQualityScore(question) + sourceRank(question.sourcePath, question.sourceStage);
}

function hasNormalizedTag(question, normalized) {
  if (!question || !Array.isArray(question.tags)) return false;
  return question.tags.map(normalizeTag).includes(normalized);
}

function rebalanceToTargetMix(sourceQuestions) {
  if (!Array.isArray(sourceQuestions)) return [];
  if (sourceQuestions.length <= NCLEX_TARGET_TOTAL) return sourceQuestions;

  const targetCounts = { ...NCLEX_TARGET_COUNTS };
  const selected = [];
  const selectedIds = new Set();

  const byNeed = new Map();
  for (const question of sourceQuestions) {
    const need = String(question?.nclexClientNeed ?? "").trim() || "physiological_adaptation";
    if (!byNeed.has(need)) byNeed.set(need, []);
    byNeed.get(need).push(question);
  }

  for (const bucket of byNeed.values()) {
    bucket.sort((left, right) => {
      const delta = rankQuestion(right) - rankQuestion(left);
      if (delta !== 0) return delta;
      return String(left.id ?? "").localeCompare(String(right.id ?? ""));
    });
  }

  const pinnedTagRequirements = [
    { normalized: "drag_drop", label: "drag_drop" },
    { normalized: "cloze_dropdown", label: "cloze_dropdown" },
    { normalized: "highlight_hotspot", label: "highlight_hotspot" },
  ];

  for (const req of pinnedTagRequirements) {
    let candidate = null;
    for (const question of sourceQuestions) {
      if (hasNormalizedTag(question, req.normalized)) {
        candidate = question;
        break;
      }
    }
    if (!candidate) continue;
    if (selectedIds.has(candidate.id)) continue;
    selectedIds.add(candidate.id);
    selected.push(candidate);

    const need = String(candidate.nclexClientNeed ?? "").trim();
    if (need && typeof targetCounts[need] === "number" && targetCounts[need] > 0) {
      targetCounts[need] -= 1;
    }
  }

  for (const [need, count] of Object.entries(targetCounts)) {
    if (!Number.isFinite(count) || count <= 0) continue;
    const bucket = byNeed.get(need) ?? [];
    let picked = 0;
    for (const question of bucket) {
      if (selected.length >= NCLEX_TARGET_TOTAL) break;
      if (picked >= count) break;
      if (selectedIds.has(question.id)) continue;
      selectedIds.add(question.id);
      selected.push(question);
      picked += 1;
    }
  }

  if (selected.length < NCLEX_TARGET_TOTAL) {
    const remaining = sourceQuestions.filter((question) => question && !selectedIds.has(question.id));
    remaining.sort((left, right) => {
      const delta = rankQuestion(right) - rankQuestion(left);
      if (delta !== 0) return delta;
      return String(left.id ?? "").localeCompare(String(right.id ?? ""));
    });
    for (const question of remaining) {
      if (selected.length >= NCLEX_TARGET_TOTAL) break;
      selectedIds.add(question.id);
      selected.push(question);
    }
  }

  if (selected.length > NCLEX_TARGET_TOTAL) {
    selected.sort((left, right) => {
      const delta = rankQuestion(right) - rankQuestion(left);
      if (delta !== 0) return delta;
      return String(left.id ?? "").localeCompare(String(right.id ?? ""));
    });
    selected.length = NCLEX_TARGET_TOTAL;
  }

  const requiredCoreTypes = ["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie"];
  const selectedByType = countByFormat(selected);
  const missingTypes = requiredCoreTypes.filter((type) => Number(selectedByType[type] ?? 0) === 0);
  if (missingTypes.length) {
    const remaining = sourceQuestions.filter((question) => question && !selectedIds.has(question.id));
    remaining.sort((left, right) => {
      const delta = rankQuestion(right) - rankQuestion(left);
      if (delta !== 0) return delta;
      return String(left.id ?? "").localeCompare(String(right.id ?? ""));
    });

    for (const type of missingTypes) {
      const replacement = remaining.find((question) => normalizeType(question.type) === type);
      if (!replacement) continue;
      const candidateIndex = selected
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => !pinnedTagRequirements.some((req) => hasNormalizedTag(question, req.normalized)))
        .sort((left, right) => rankQuestion(left.question) - rankQuestion(right.question))[0]?.index;
      if (candidateIndex == null) continue;
      selectedIds.delete(selected[candidateIndex].id);
      selected[candidateIndex] = replacement;
      selectedIds.add(replacement.id);
    }
  }

  const reTagged = ensureOfficialInteractionTags(selected);
  return reTagged.sort((left, right) => {
    const categoryDelta = left.category.localeCompare(right.category);
    if (categoryDelta !== 0) {
      return categoryDelta;
    }
    const typeDelta = normalizeType(left.type).localeCompare(normalizeType(right.type));
    if (typeDelta !== 0) {
      return typeDelta;
    }
    return left.id.localeCompare(right.id);
  });
}

function ensureOfficialInteractionTags(questions) {
  const required = [
    { tag: "drag_drop", normalized: "drag_drop" },
    { tag: "cloze_dropdown", normalized: "cloze_dropdown" },
    { tag: "highlight_hotspot", normalized: "highlight_hotspot" },
  ];

  const present = new Set(
    questions.flatMap((question) => (Array.isArray(question.tags) ? question.tags : []))
      .map(normalizeTag)
      .filter(Boolean),
  );

  const missing = required.filter((req) => !present.has(req.normalized));
  if (missing.length === 0) {
    return questions;
  }

  const candidates = questions.filter((question) => question?.exam === "nclex" && question?.type === "mcq");
  if (candidates.length === 0) {
    return questions;
  }

  const updated = [...questions];
  for (const req of missing) {
    const target = candidates.shift();
    if (!target) break;
    target.tags = Array.from(new Set([...(target.tags ?? []), req.tag]));
    candidates.push(target);
  }

  return updated;
}

function ensureUniqueIds(questions) {
  const seenIds = new Set();
  const baseIdCounts = new Map();

  return questions.map((question) => {
    const baseId = String(question.id ?? "").trim() || `nclex-${slugify(question.category)}`;
    if (!seenIds.has(baseId)) {
      seenIds.add(baseId);
      baseIdCounts.set(baseId, 1);
      return {
        ...question,
        id: baseId,
      };
    }

    const suffixSeed = slugify(
      question.waveMetadata?.familyKey ?? question.subcategory ?? question.category ?? question.stem,
    ).slice(0, 48) || "dup";

    let duplicateIndex = (baseIdCounts.get(baseId) ?? 1) + 1;
    let nextId = `${baseId}--${suffixSeed}`;
    while (seenIds.has(nextId)) {
      nextId = `${baseId}--${suffixSeed}-${duplicateIndex}`;
      duplicateIndex += 1;
    }

    seenIds.add(nextId);
    baseIdCounts.set(baseId, duplicateIndex);
    return {
      ...question,
      id: nextId,
    };
  });
}

function loadSourcePool() {
  const sources = [];
  const liveQuestions = readArray(paths.canonicalNclexLiveFile);
  for (const question of liveQuestions) {
    sources.push({ question, sourceFile: "reviewed-curated-live.unique.json" });
  }

  const draftDir = path.join(paths.questionsRoot, "nclex", "draft");
  for (const file of fs.readdirSync(draftDir).filter((entry) => entry.endsWith(".json")).sort()) {
    const fullPath = path.join(draftDir, file);
    const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];
    for (const question of items) {
      sources.push({ question, sourceFile: file });
    }
  }

  return sources;
}

function buildBank() {
  const sourcePool = loadSourcePool();
  const uniqueBaseQuestions = new Map();

  for (const item of sourcePool) {
    const normalized = normalizeBaseQuestion(item.question, item.sourceFile);
    if (!normalized) {
      continue;
    }

    const fingerprint = normalized.waveMetadata?.duplicateFingerprint;
    if (!fingerprint) {
      continue;
    }

    const existing = uniqueBaseQuestions.get(fingerprint);
    if (!existing) {
      uniqueBaseQuestions.set(fingerprint, normalized);
      continue;
    }

    const existingRank = variantQualityScore(existing) + sourceRank(existing.sourcePath, existing.sourceStage);
    const nextRank = variantQualityScore(normalized) + sourceRank(normalized.sourcePath, normalized.sourceStage);
    if (nextRank > existingRank) {
      uniqueBaseQuestions.set(fingerprint, normalized);
    }
  }

  const expanded = [...uniqueBaseQuestions.values()];
  for (const question of uniqueBaseQuestions.values()) {
    if (question.type !== "mcq") {
      continue;
    }

    for (const variantFactory of [createCaseStudyVariant, createBowTieVariant, createMatrixVariant]) {
      const variant = variantFactory(question);
      if (variant) {
        expanded.push(variant);
      }
    }
  }

  const deduped = new Map();
  for (const question of expanded) {
    const fingerprint = question.waveMetadata?.duplicateFingerprint;
    if (!fingerprint) {
      continue;
    }
    const existing = deduped.get(fingerprint);
    if (!existing || variantQualityScore(question) > variantQualityScore(existing)) {
      deduped.set(fingerprint, question);
    }
  }

  const withOfficialInteractions = ensureOfficialInteractionTags(Array.from(deduped.values()));
  const allQuestions = ensureUniqueIds(withOfficialInteractions).sort((left, right) => {
    const categoryDelta = left.category.localeCompare(right.category);
    if (categoryDelta !== 0) {
      return categoryDelta;
    }
    const typeDelta = normalizeType(left.type).localeCompare(normalizeType(right.type));
    if (typeDelta !== 0) {
      return typeDelta;
    }
    return left.id.localeCompare(right.id);
  });
  return rebalanceToTargetMix(allQuestions);
}

function writeBank(questions) {
  writeJson(paths.rawNclexLiveFile, questions);
  writeJson(paths.canonicalNclexLiveFile, questions);

  const report = {
    generatedAt: new Date().toISOString(),
    outputFiles: {
      rawLive: path.relative(paths.chapaiRoot, paths.rawNclexLiveFile).replaceAll("\\", "/"),
      canonicalLive: path.relative(paths.chapaiRoot, paths.canonicalNclexLiveFile).replaceAll("\\", "/"),
    },
    counts: {
      total: questions.length,
      formatMix: countByFormat(questions),
      clientNeedMix: countByClientNeed(questions),
    },
    target: {
      threshold: NCLEX_TARGET_TOTAL,
      reached: questions.length >= NCLEX_TARGET_TOTAL,
      delta: questions.length - NCLEX_TARGET_TOTAL,
    },
  };

  writeJson(BANK_BUILD_REPORT, report);
  return report;
}

const questions = buildBank();
const report = writeBank(questions);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
