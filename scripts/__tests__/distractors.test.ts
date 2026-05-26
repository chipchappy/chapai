import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BOILERPLATE_DISTRACTOR_RATIONALE,
  matchesBoilerplate,
  scanBankForBoilerplate,
  validateRationale,
} from "../rewrite-distractor-rationales.mjs";
import { scanQuestionTypes } from "../retag-question-types.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..", "..");
const defaultPromotedV2 = path.join(repoRoot, "packages", "content", "staging", "promoted-v2");
const defaultPromoted = path.join(repoRoot, "packages", "content", "staging", "promoted");
const bankDir = process.env.CLARITY_BANK_DIR
  ? path.resolve(process.env.CLARITY_BANK_DIR)
  : defaultPromotedV2;
const scanDir = bankDir === defaultPromotedV2 && !pathExists(defaultPromotedV2)
  ? defaultPromoted
  : bankDir;

function pathExists(targetPath) {
  return Boolean(targetPath) && fs.existsSync(targetPath);
}

describe("distractor rationale boilerplate guard", () => {
  it("recognizes the forbidden boilerplate", () => {
    assert.equal(matchesBoilerplate(BOILERPLATE_DISTRACTOR_RATIONALE), true);
  });

  it("validates specific clinical rationales", () => {
    const validation = validateRationale(
      "Giving insulin would worsen symptomatic hypoglycemia by driving glucose lower and increasing seizure risk.",
    );
    assert.deepEqual(validation.errors, []);
  });

  it("finds zero boilerplate distractor rationale matches in the selected bank", () => {
    const summary = scanBankForBoilerplate(scanDir);

    assert.deepEqual(summary.invalidFiles, []);
    assert.equal(
      summary.targetMatches,
      0,
      `Expected zero boilerplate distractor rationales in ${scanDir}; first matches: ${JSON.stringify(
        summary.matches.slice(0, 5),
      )}`,
    );
  });
});

describe("NGN type relabel guard", () => {
  it("finds zero fake case studies or bow-ties in the selected bank", () => {
    const summary = scanQuestionTypes(scanDir);

    assert.deepEqual(summary.invalidFiles, []);
    assert.equal(summary.retaggableCaseStudy, 0, "case_study items must share scenarioTitle and scenario with at least two siblings");
    assert.equal(summary.retaggableBowTie, 0, "bow_tie items must have a real three-zone bowTie answer structure");
  });
});
