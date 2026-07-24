import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, it } from "node:test";

import { concealReadinessAnswer } from "../../apps/web/src/lib/readiness-delivery";
import { getRichDeck } from "../../apps/web/src/lib/practice-data";

describe("readiness exam delivery hardening", () => {
  it("does not deliver answer keys or teaching payloads before submission", () => {
    const source = getRichDeck("case-study").find((question) => question.exam === "nclex");
    assert.ok(source);

    const delivered = concealReadinessAnswer(source) as Record<string, unknown>;
    for (const concealedField of [
      "correctAnswer",
      "rationale",
      "structuredRationale",
      "deepRationale",
      "distractorRationales",
      "takeaway",
      "speedCue",
      "references",
      "studyResources",
      "coachingFrame",
      "visualRationale",
      "diagramBlueprint",
    ]) {
      assert.equal(concealedField in delivered, false, concealedField);
    }

    assert.equal(delivered.id, source.id);
    assert.equal(delivered.stem, source.stem);
    assert.deepEqual(delivered.options, source.options);
    assert.deepEqual(delivered.chartReview, source.chartReview);
  });

  it("enforces one durable attempt per user launch and one answer per item", () => {
    const database = new DatabaseSync(":memory:");
    database.exec("PRAGMA foreign_keys = ON");
    database.exec("CREATE TABLE users (id TEXT PRIMARY KEY)");
    database.exec("INSERT INTO users (id) VALUES ('student-1')");
    database.exec(readFileSync(
      new URL("../../packages/db/drizzle/migration-0008-readiness-attempts.sql", import.meta.url),
      "utf8",
    ));

    const insertAttempt = database.prepare(`
      INSERT INTO readiness_exam_attempts (
        id, user_id, launch_id, exam_id, assembly_version,
        content_fingerprint, question_ids, scoring_manifest, total_items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAttempt.run(
      "attempt-1",
      "student-1",
      "launch-1",
      "nclex-sim-1",
      "nclex-readiness-v2",
      "fingerprint-1",
      '["question-1"]',
      '[{"id":"question-1","correctAnswer":"a","contentVersion":1}]',
      1,
    );

    assert.throws(() => insertAttempt.run(
      "attempt-duplicate",
      "student-1",
      "launch-1",
      "nclex-sim-1",
      "nclex-readiness-v2",
      "fingerprint-1",
      '["question-1"]',
      '[{"id":"question-1","correctAnswer":"a","contentVersion":1}]',
      1,
    ), /UNIQUE constraint failed/);

    const insertAnswer = database.prepare(`
      INSERT INTO readiness_exam_answers (
        id, attempt_id, question_id, question_snapshot, form_position,
        selected_answer, is_correct, points_earned, points_possible, partial_credit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAnswer.run(
      "answer-1",
      "attempt-1",
      "question-1",
      '{"contentVersion":1}',
      0,
      "a",
      1,
      1,
      1,
      1,
    );
    assert.throws(() => insertAnswer.run(
      "answer-duplicate",
      "attempt-1",
      "question-1",
      '{"contentVersion":1}',
      0,
      "a",
      1,
      1,
      1,
      1,
    ), /UNIQUE constraint failed/);

    assert.throws(() => insertAttempt.run(
      "attempt-null-user",
      null,
      "launch-2",
      "nclex-sim-1",
      "nclex-readiness-v2",
      "fingerprint-2",
      "[]",
      "[]",
      0,
    ), /NOT NULL constraint failed/);
    database.close();
  });
});
