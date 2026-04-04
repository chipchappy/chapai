import * as fs from "node:fs";
import * as path from "node:path";
import { contentSummary } from "@chapai/content/generated-summary";

type ExamSummary = {
  live: number;
  draft: number;
};

type LiveContentSummary = {
  generatedAt: string;
  ccrn: ExamSummary;
  nclex: ExamSummary;
};

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

    return {
      generatedAt: new Date().toISOString(),
      ccrn: {
        live: countQuestions(path.join(questionsRoot, "ccrn", "live")),
        draft: countQuestions(path.join(questionsRoot, "ccrn", "draft")),
      },
      nclex: {
        live: countQuestions(path.join(questionsRoot, "nclex", "live")),
        draft: countQuestions(path.join(questionsRoot, "nclex", "draft")),
      },
    };
  } catch {
    return {
      generatedAt: contentSummary.generatedAt,
      ccrn: { ...contentSummary.ccrn },
      nclex: { ...contentSummary.nclex },
    };
  }
}
