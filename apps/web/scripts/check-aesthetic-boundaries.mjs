import { readdirSync, readFileSync, statSync } from "node:fs";
import { sep } from "node:path";

const root = process.cwd();

function walk(dir) {
  const entries = readdirSync(dir);
  const results = [];
  for (const entry of entries) {
    const path = `${dir}/${entry}`;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      results.push(...walk(path));
    } else if (/\.(ts|tsx|css)$/.test(entry) && !entry.endsWith(".d.ts")) {
      results.push(path);
    }
  }
  return results;
}

const files = walk("src");

const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const normalized = file.split(sep).join("/");
  const inExam = normalized.includes("src/components/exam/");
  const inMarketing = normalized.includes("src/components/marketing/");
  const inTestRunner = normalized.includes("src/app/(test-runner)/");

  if (inExam && source.includes("@/components/marketing")) {
    violations.push(`${file}: exam component imports marketing code`);
  }
  if (inMarketing && source.includes("@/components/exam")) {
    violations.push(`${file}: marketing component imports exam code`);
  }
  if (inExam && /--c-[a-z-]+/.test(source)) {
    violations.push(`${file}: exam component references premium --c-* token`);
  }
  if (!inExam && !inTestRunner && /--exam-[a-z0-9-]+/.test(source)) {
    violations.push(`${file}: non-exam file references --exam-* token`);
  }
}

if (violations.length > 0) {
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exit(1);
}

console.log("Aesthetic boundaries passed.");
