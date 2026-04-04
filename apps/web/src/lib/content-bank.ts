import type { QuizQuestion, Exam } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";

type CanonicalQuestionFile = QuizQuestion[];
type QuestionBankMode = "live" | "all";

const cache: Partial<Record<QuestionBankMode, Record<string, QuizQuestion[]>>> = {};
const cacheVersion: Partial<Record<QuestionBankMode, string>> = {};

function workspaceRoot() {
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

function readJsonArray(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CanonicalQuestionFile;
}

function readQuestionDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => readJsonArray(path.join(dirPath, file)));
}

function mergeQuestionSets(...sets: QuizQuestion[][]) {
  const merged = new Map<string, QuizQuestion>();

  for (const set of sets) {
    for (const question of set) {
      merged.set(question.id, question);
    }
  }

  return Array.from(merged.values());
}

function directoryVersion(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    return "missing";
  }

  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      return `${file}:${stats.mtimeMs}`;
    })
    .sort()
    .join("|");
}

function loadCache(mode: QuestionBankMode = "live") {
  const root = workspaceRoot();
  const contentRoot = path.join(root, "packages", "content", "questions");
  const nextVersion = mode === "all"
    ? [
        directoryVersion(path.join(contentRoot, "ccrn", "live")),
        directoryVersion(path.join(contentRoot, "ccrn", "draft")),
        directoryVersion(path.join(contentRoot, "nclex", "live")),
        directoryVersion(path.join(contentRoot, "nclex", "draft")),
      ].join("::")
    : [
        directoryVersion(path.join(contentRoot, "ccrn", "live")),
        directoryVersion(path.join(contentRoot, "nclex", "live")),
      ].join("::");

  if (cache[mode] && cacheVersion[mode] === nextVersion) {
    return cache[mode]!;
  }

  cache[mode] = {
    ccrn: mode === "all"
      ? mergeQuestionSets(
          readQuestionDirectory(path.join(contentRoot, "ccrn", "draft")),
          readQuestionDirectory(path.join(contentRoot, "ccrn", "live")),
        )
      : mergeQuestionSets(
          readQuestionDirectory(path.join(contentRoot, "ccrn", "live")),
        ),
    nclex: mode === "all"
      ? mergeQuestionSets(
          readQuestionDirectory(path.join(contentRoot, "nclex", "draft")),
          readQuestionDirectory(path.join(contentRoot, "nclex", "live")),
        )
      : mergeQuestionSets(
          readQuestionDirectory(path.join(contentRoot, "nclex", "live")),
        ),
  };
  cacheVersion[mode] = nextVersion;

  return cache[mode]!;
}

export function getQuestionBank(exam: Exam, options?: { mode?: QuestionBankMode }) {
  const bank = loadCache(options?.mode ?? "live")[exam] ?? [];
  return bank.map((question) => ({
    ...question,
    tags: question.tags ?? [],
  }));
}

export function getQuestionById(questionId: string, options?: { mode?: QuestionBankMode }) {
  const banks = loadCache(options?.mode ?? "live");
  return [...(banks.ccrn ?? []), ...(banks.nclex ?? [])].find((question) => question.id === questionId) ?? null;
}

export function invalidateQuestionBankCache() {
  for (const key of ["live", "all"] as QuestionBankMode[]) {
    delete cache[key];
    delete cacheVersion[key];
  }
}
