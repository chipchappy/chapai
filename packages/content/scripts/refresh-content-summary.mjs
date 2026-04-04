import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const questionsRoot = path.join(packageRoot, "questions");
const summaryFile = path.join(packageRoot, "src", "generated-summary.ts");

function loadArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadExamCounts(exam) {
  const examRoot = path.join(questionsRoot, exam);
  if (!fs.existsSync(examRoot)) {
    return { live: 0, draft: 0 };
  }

  let live = 0;
  let draft = 0;

  for (const bucket of ["live", "draft", "approved"]) {
    const bucketDir = path.join(examRoot, bucket);
    if (!fs.existsSync(bucketDir)) {
      continue;
    }
    const files = fs.readdirSync(bucketDir).filter((file) => file.endsWith(".json"));
    for (const file of files) {
      const items = loadArray(path.join(bucketDir, file));
      if (bucket === "live") {
        live += items.length;
      } else {
        draft += items.length;
      }
    }
  }

  return { live, draft };
}

const payload = {
  generatedAt: new Date().toISOString(),
  ccrn: loadExamCounts("ccrn"),
  nclex: loadExamCounts("nclex"),
};

fs.writeFileSync(summaryFile, `export const contentSummary = ${JSON.stringify(payload, null, 2)} as const;\n`, "utf8");
console.log(JSON.stringify(payload, null, 2));
