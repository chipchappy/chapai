import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(process.cwd());
const aiRoot = path.resolve(root, "..");
const legacyRoot = path.join(aiRoot, "ccrn-agent");
const outputRoot = path.join(root, "packages", "content", "questions");

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function loadLegacyCcrnBank() {
  const file = path.join(legacyRoot, "app", "questions.js");
  const source = fs.readFileSync(file, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.window.CCRN_QUESTION_BANK || [];
}

function difficultyToNumber(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "easy") return 2;
  if (normalized === "medium") return 3;
  if (normalized === "hard") return 4;
  const asNumber = Number.parseInt(normalized, 10);
  return Number.isFinite(asNumber) ? asNumber : 3;
}

function mapLegacyCcrnQuestion(question, sourcePath) {
  return {
    id: question.id,
    exam: "ccrn",
    type: "mcq",
    category: String(question.topic || "general").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    subcategory: question.topic,
    difficulty: difficultyToNumber(question.difficulty),
    stem: question.stem,
    options: question.options,
    answer: question.correctOptionId,
    rationale: question.rationale,
    distractorRationales: question.distractorRationales || {},
    tags: [question.topic, question.takeaway].filter(Boolean),
    takeaway: question.takeaway,
    sourceStage: "live",
    sourcePath,
    visualRationale: question.diagram
      ? {
          type: question.diagram.type || "overview",
          accent: question.diagram.accent,
          title: question.diagram.title,
          caption: question.diagram.caption,
          metrics: question.diagram.metrics,
          nodes: question.diagram.nodes,
          conclusion: question.diagram.conclusion,
        }
      : undefined,
  };
}

function parseMarkdownSets(pattern, exam) {
  const draftsDir = path.join(legacyRoot, "drafts");
  const files = fs.readdirSync(draftsDir)
    .filter((name) => pattern.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const questionBlocks = [];

  for (const fileName of files) {
    const filePath = path.join(draftsDir, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const chunks = raw.split(/\n---\n/g).filter((chunk) => chunk.includes("## Q"));

    for (const chunk of chunks) {
      const id = chunk.match(/##\s+(Q\d+)\s+-/i)?.[1];
      const topic = chunk.match(/\*\*Topic:\*\*\s*(.+?)\s{2,}|\*\*Topic:\*\*\s*(.+)/i);
      const difficulty = chunk.match(/\*\*Difficulty:\*\*\s*(.+)/i)?.[1]?.trim();
      const question = chunk.match(/\*\*Question:\*\*\s*([\s\S]*?)\n\n\*\*A\./i)?.[1]?.trim();
      const optionMatches = [...chunk.matchAll(/\*\*([A-D])\.\*\*\s*(.+)/g)];
      const answer = chunk.match(/\*\*Correct Answer:\*\*\s*([A-D])/i)?.[1]?.toLowerCase();
      const rationale = chunk.match(/\*\*Rationale:\*\*\s*([\s\S]*?)\n\n\*\*Study Takeaway:\*\*/i)?.[1]?.trim();
      const takeaway = chunk.match(/\*\*Study Takeaway:\*\*\s*([\s\S]*?)\n\n\*\*Metadata Hint:\*\*/i)?.[1]?.trim();
      const metadata = chunk.match(/\*\*Metadata Hint:\*\*\s*(.+)/i)?.[1]?.trim();

      if (!id || !question || !answer || !rationale || optionMatches.length < 4) {
        continue;
      }

      questionBlocks.push({
        id: `${exam}_${id.toLowerCase()}`,
        exam,
        type: "mcq",
        category: String((topic?.[1] || topic?.[2] || "general")).toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        subcategory: topic?.[1] || topic?.[2] || "General",
        difficulty: difficultyToNumber(difficulty),
        stem: question,
        options: optionMatches.map((match) => ({ id: match[1].toLowerCase(), text: match[2].trim() })),
        answer,
        rationale,
        tags: metadata ? metadata.split(",").map((part) => part.trim()).filter(Boolean) : [],
        takeaway,
        sourceStage: "draft",
        sourcePath: filePath,
      });
    }
  }

  return questionBlocks;
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

const legacyCcrn = loadLegacyCcrnBank().map((question) =>
  mapLegacyCcrnQuestion(question, "ccrn-agent/app/questions.js")
);
const ccrnDrafts = parseMarkdownSets(/^original-ccrn-question-set-.*\.md$/i, "ccrn");
const nclexDrafts = parseMarkdownSets(/^original-nclex-question-set-.*\.md$/i, "nclex");

writeJson(path.join(outputRoot, "ccrn", "live", "legacy-ccrn-bank.json"), legacyCcrn);
writeJson(path.join(outputRoot, "ccrn", "draft", "imported-ccrn-drafts.json"), ccrnDrafts);
writeJson(path.join(outputRoot, "nclex", "draft", "imported-nclex-drafts.json"), nclexDrafts);

const summaryFile = path.join(root, "packages", "content", "src", "generated-summary.ts");
fs.writeFileSync(
  summaryFile,
  `export const contentSummary = ${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      ccrn: { live: legacyCcrn.length, draft: ccrnDrafts.length },
      nclex: { live: 0, draft: nclexDrafts.length },
    },
    null,
    2
  )} as const;\n`,
  "utf8"
);

console.log(
  JSON.stringify(
    {
      ccrnLive: legacyCcrn.length,
      ccrnDraft: ccrnDrafts.length,
      nclexDraft: nclexDrafts.length,
      outputRoot,
    },
    null,
    2
  )
);
