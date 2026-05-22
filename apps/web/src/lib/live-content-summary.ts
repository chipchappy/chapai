import * as fs from "node:fs";
import * as path from "node:path";
import { contentSummary } from "@chapai/content/generated-summary";

type ExamSummary = {
  live: number;
  draft: number;
  mcqLive: number;
  ngnLive: number;
  ngnRatio: number;
};

type LiveContentSummary = {
  generatedAt: string;
  ccrn: ExamSummary;
  nclex: ExamSummary;
};

function countQuestionsInFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function summarizeNclexCanonical(filePath: string): ExamSummary {
  if (!fs.existsSync(filePath)) {
    return { live: 0, draft: 0, mcqLive: 0, ngnLive: 0, ngnRatio: 0 };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const questions = Array.isArray(parsed) ? parsed : [];
    const mcqLive = questions.filter((question) => String(question?.type || "mcq") === "mcq").length;
    const ngnLive = questions.length - mcqLive;
    const ngnRatio = questions.length > 0 ? Math.round((ngnLive / questions.length) * 100) : 0;
    return {
      live: questions.length,
      draft: 0,
      mcqLive,
      ngnLive,
      ngnRatio,
    };
  } catch {
    return { live: 0, draft: 0, mcqLive: 0, ngnLive: 0, ngnRatio: 0 };
  }
}

function countQuestions(dir: string) {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      } catch {
        return [];
      }
    }).length;
}

function resolveWorkspaceRoot() {
  let current = process.cwd();
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, "packages", "content"))) {
      return current;
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return process.cwd();
}

export function getLiveContentSummary(): LiveContentSummary {
  try {
    const workspaceRoot = resolveWorkspaceRoot();
    const questionsRoot = path.join(workspaceRoot, "packages", "content", "questions");
    const canonicalNclexLiveFile = path.join(questionsRoot, "nclex", "live", "reviewed-curated-live.unique.json");
    const nclexCanonical = summarizeNclexCanonical(canonicalNclexLiveFile);
    const summary: LiveContentSummary = {
      generatedAt: new Date().toISOString(),
      ccrn: {
        live: countQuestions(path.join(questionsRoot, "ccrn", "live")),
        draft: countQuestions(path.join(questionsRoot, "ccrn", "draft")),
        mcqLive: countQuestions(path.join(questionsRoot, "ccrn", "live")),
        ngnLive: 0,
        ngnRatio: 0,
      },
      nclex: {
        live: nclexCanonical.live > 0
          ? nclexCanonical.live
          : countQuestions(path.join(questionsRoot, "nclex", "live")),
        draft: countQuestions(path.join(questionsRoot, "nclex", "draft")),
        mcqLive: nclexCanonical.live > 0 ? nclexCanonical.mcqLive : countQuestions(path.join(questionsRoot, "nclex", "live")),
        ngnLive: nclexCanonical.ngnLive,
        ngnRatio: nclexCanonical.ngnRatio,
      },
    };

    if (summary.ccrn.live > 0 || summary.nclex.live > 0) {
      return summary;
    }
  } catch {
    // Fall through to bundled summary when fs is unavailable.
  }

  return {
    generatedAt: contentSummary.generatedAt,
    ccrn: { ...contentSummary.ccrn, mcqLive: contentSummary.ccrn.live, ngnLive: 0, ngnRatio: 0 },
    nclex: { ...contentSummary.nclex, mcqLive: contentSummary.nclex.live, ngnLive: 0, ngnRatio: 0 },
  };
}
