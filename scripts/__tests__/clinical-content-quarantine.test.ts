import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildGuardedQuarantineSql,
  loadQuarantineBatch,
  quarantinePreflightIssues,
} from "../apply-clinical-content-quarantine.mjs";

describe("high-risk clinical content quarantine", () => {
  it("enumerates only the seven measured live risks and keeps them recoverable", () => {
    const batch = loadQuarantineBatch();
    assert.equal(batch.questions.length, 7);
    assert.equal(new Set(batch.questions.map((question: { id: string }) => question.id)).size, 7);
    assert.deepEqual(batch.desiredState, {
      publishState: "draft",
      reviewStatus: "needs-revision",
    });
    assert.ok(batch.questions.some((question: { id: string }) => question.id === "respir126"));
  });

  it("fails closed when the live row or measured risk signature changes", () => {
    const batch = loadQuarantineBatch();
    const question = batch.questions[0];
    const row = {
      id: question.id,
      category: question.expectedCategory,
      stem: `Scenario includes ${question.requiredPatterns[1]}.`,
      options: JSON.stringify([{ id: "a", text: question.requiredPatterns[0] }]),
      answer: "a",
      rationale: "Pending review.",
      review_status: "curated-live",
      publish_state: "published",
      revision: 1,
    };

    assert.deepEqual(quarantinePreflightIssues(row, question, batch.desiredState), []);
    assert.deepEqual(
      quarantinePreflightIssues({ ...row, stem: "Changed elsewhere." }, question, batch.desiredState),
      [`pattern:${question.requiredPatterns[1]}`],
    );
  });

  it("emits guarded state-only updates without deleting content", () => {
    const batch = loadQuarantineBatch();
    const question = batch.questions[0];
    const row = {
      id: question.id,
      category: question.expectedCategory,
      stem: "Original stem",
      options: "[]",
      answer: "b",
      rationale: "Original rationale",
      review_status: "curated-live",
      publish_state: "published",
      revision: 1,
    };
    const sql = buildGuardedQuarantineSql([{
      alreadyApplied: false,
      question,
      row,
    }], batch.desiredState);

    assert.match(sql, /publish_state='draft'/);
    assert.match(sql, /review_status='needs-revision'/);
    assert.match(sql, /AND stem='Original stem'/);
    assert.match(sql, /AND answer='b'/);
    assert.doesNotMatch(sql, /DELETE FROM|INSERT INTO|DROP TABLE/i);
  });
});
