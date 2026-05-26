import fs from "node:fs";
import path from "node:path";

type BankQuestion = {
  type?: string;
  scenarioTitle?: string;
  scenario?: string;
  bowTie?: {
    center?: { id?: string; text?: string };
    leftActions?: unknown[];
    rightMonitoring?: unknown[];
  };
};

type BankStats = {
  total: number;
  realNgn: number;
  realNgnPercent: number;
  byType: Record<string, number>;
};

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

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function scenarioKey(question: BankQuestion) {
  const scenarioTitle = normalizeText(question.scenarioTitle);
  const scenario = normalizeText(question.scenario);
  if (!scenarioTitle || !scenario) {
    return "";
  }
  return `${scenarioTitle}\u0000${scenario}`;
}

function hasRealBowTieShape(question: BankQuestion) {
  const bowTie = question.bowTie;
  if (!bowTie) {
    return false;
  }

  return Boolean(
    bowTie.center?.id
      && bowTie.center?.text
      && Array.isArray(bowTie.leftActions)
      && bowTie.leftActions.length >= 4
      && Array.isArray(bowTie.rightMonitoring)
      && bowTie.rightMonitoring.length >= 4,
  );
}

function readQuestionsFromDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const questions: BankQuestion[] = [];
  for (const file of fs.readdirSync(dir).filter((entry) => entry.endsWith(".json")).sort()) {
    try {
      const payload = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      if (Array.isArray(payload)) {
        questions.push(...payload);
      } else if (Array.isArray(payload.questions)) {
        questions.push(...payload.questions);
      }
    } catch {
      // Ignore malformed files so the homepage can still render from fallback data.
    }
  }
  return questions;
}

function candidateBankDirectories() {
  const root = resolveWorkspaceRoot();
  return [
    path.join(root, "packages", "content", "staging", "promoted-v2"),
    path.join(root, "packages", "content", "staging", "promoted"),
    path.join(root, "packages", "content", "questions", "nclex", "live"),
  ];
}

export function getLiveBankStats(): BankStats {
  const questions = candidateBankDirectories()
    .map(readQuestionsFromDirectory)
    .find((items) => items.length > 0) ?? [];

  const byType: Record<string, number> = {};
  const scenarioGroups = new Map<string, number>();

  for (const question of questions) {
    const type = question.type ?? "mcq";
    byType[type] = (byType[type] ?? 0) + 1;
    const key = scenarioKey(question);
    if (key) {
      scenarioGroups.set(key, (scenarioGroups.get(key) ?? 0) + 1);
    }
  }

  const realNgn = questions.filter((question) => {
    if (question.type === "matrix" || question.type === "sata") {
      return true;
    }
    if (question.type === "case_study") {
      const key = scenarioKey(question);
      return Boolean(key && (scenarioGroups.get(key) ?? 0) >= 3);
    }
    if (question.type === "bow_tie") {
      return hasRealBowTieShape(question);
    }
    return false;
  }).length;

  return {
    total: questions.length,
    realNgn,
    realNgnPercent: questions.length > 0 ? Math.round((realNgn / questions.length) * 100) : 0,
    byType,
  };
}
