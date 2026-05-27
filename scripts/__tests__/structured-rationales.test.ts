import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { structuredRationaleSchema } from "../../packages/content/src/schema";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..", "..");
const pilotPath = path.join(repoRoot, "packages/content/staging/rationale-pilot/p1.6-structured-rationale-pilot.json");

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

describe("structured rationale pilot", () => {
  it("has valid schema and complete structured teaching fields", () => {
    const payload = JSON.parse(fs.readFileSync(pilotPath, "utf8"));
    assert.equal(payload.validation.valid, true);
    assert.equal(payload.questions.length, 150);

    for (const question of payload.questions) {
      assert.ok(question.structuredRationale, `${question.id} missing structuredRationale`);
      const structuredRationale = structuredRationaleSchema.parse(question.structuredRationale);
      assert.ok(wordCount(structuredRationale.overview) >= 12, `${question.id} overview too short`);
      assert.ok(wordCount(structuredRationale.mechanism) >= 12, `${question.id} mechanism too short`);
      assert.ok(wordCount(structuredRationale.whyCorrect) >= 12, `${question.id} whyCorrect too short`);
      assert.ok(structuredRationale.citations.length >= 1, `${question.id} missing citations`);

      for (const [key, value] of Object.entries(structuredRationale.whyWrong)) {
        assert.ok(wordCount(value) >= 12, `${question.id} whyWrong.${key} too short`);
      }
    }
  });
});
