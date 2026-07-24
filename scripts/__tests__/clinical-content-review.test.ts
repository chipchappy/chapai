import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getQuestionQualityProfile } from "../../apps/web/src/lib/question-quality";
import { parseQuestionQualityMetadata } from "../../apps/web/src/lib/question-provenance";
import {
  buildGuardedReviewSql,
  desiredStateIssues,
  expectedStateIssues,
  loadReviewBatch,
} from "../apply-clinical-content-review.mjs";
import { questionToRow } from "../sync-d1-question-bank.mjs";

const trustedClinicalHosts = new Set([
  "www.aabb.org",
  "www.acog.org",
  "www.dailymed.nlm.nih.gov",
  "www.fda.gov",
  "www.hematology.org",
  "cpr.heart.org",
  "dailymed.nlm.nih.gov",
  "diabetesjournals.org",
  "ginasthma.org",
  "goldcopd.org",
  "kdigo.org",
  "madeforthismoment.asahq.org",
  "professional.heart.org",
]);

describe("source-verified readiness clinical review", () => {
  it("keeps all twelve high-risk items at the premium gate with trusted sources", () => {
    const batch = loadReviewBatch();

    assert.equal(batch.questions.length, 12);
    assert.equal(new Set(batch.questions.map((question: { id: string }) => question.id)).size, 12);
    for (const question of batch.questions) {
      assert.equal(question.reviewStatus, "final-curated-live", question.id);
      assert.equal(question.publishState, "published", question.id);
      assert.equal(question.qualityMetadata.evidenceStatus, "source-verified", question.id);
      assert.equal(question.qualityMetadata.clinicalReviewStatus, "pending", question.id);
      assert.equal(question.qualityMetadata.psychometricStatus, "precalibration", question.id);
      assert.ok(question.rationale.trim().split(/\s+/).length >= 120, question.id);
      assert.ok(question.references.length >= 2, question.id);
      assert.equal(getQuestionQualityProfile(question).tier, 0, question.id);

      for (const reference of question.references) {
        const host = new URL(reference.href).hostname;
        assert.ok(trustedClinicalHosts.has(host), `${question.id}:${host}`);
      }
    }
  });

  it("locks the patient-safety corrections that motivated the review", () => {
    const batch = loadReviewBatch();
    const byId = new Map(batch.questions.map((question: { id: string }) => [question.id, question]));

    assert.doesNotMatch(
      byId.get("prem_nclex_ng8191").rationale,
      /(?:suppress|preserve)(?:ing)? (?:the )?hypoxic drive/i,
    );
    assert.match(byId.get("prem_nclex_ng8191").options[0].text, /88%-92%/);
    assert.doesNotMatch(byId.get("prem_nclex_ng8924").options[1].text, /sliding scale/i);
    assert.match(byId.get("prem_nclex_ng8924").options[1].text, /protocolized IV regular-insulin infusion/i);
    assert.deepEqual(byId.get("prem_nclex_ng7916").answer, ["a", "b", "c", "d"]);
    assert.match(byId.get("prem_nclex_pa6145").options[0].text, /atropine 1 mg/i);
    assert.doesNotMatch(byId.get("prem_nclex_pa6145").rationale, /atropine 0\.5 mg/i);
    assert.match(byId.get("prem_nclex_ph0747").options[1].text, /^Stop the transfusion/i);
    assert.match(byId.get("prem_nclex_ph4712").stem, /day 6/i);
    assert.match(byId.get("prem_nclex_ph4712").stem, /235,000\/mm3 to 104,000\/mm3/i);
  });

  it("refuses stale live rows and emits guarded updates only", () => {
    const batch = loadReviewBatch();
    const question = batch.questions[0];
    const desiredRow = questionToRow(question, batch);
    const current = {
      ...desiredRow,
      answer: typeof question.expectedCurrent.answer === "string"
        ? question.expectedCurrent.answer
        : JSON.stringify(question.expectedCurrent.answer),
      category: question.expectedCurrent.category,
      publish_state: question.expectedCurrent.publishState,
      review_status: question.expectedCurrent.reviewStatus,
      stem: question.expectedCurrent.stem,
    };

    assert.deepEqual(expectedStateIssues(current, question), []);
    assert.ok(desiredStateIssues(current, desiredRow).length > 0);
    assert.deepEqual(expectedStateIssues({ ...current, stem: "changed elsewhere" }, question), ["stem"]);

    const sql = buildGuardedReviewSql([{
      alreadyApplied: false,
      current,
      desiredIssues: desiredStateIssues(current, desiredRow),
      desiredRow,
      question,
    }]);
    assert.match(sql, /^UPDATE questions SET /);
    assert.match(sql, /WHERE id=/);
    assert.match(sql, /AND stem=/);
    assert.match(sql, /AND answer=/);
    assert.doesNotMatch(sql, /DELETE FROM|INSERT INTO|ON CONFLICT/i);
  });

  it("hydrates D1 provenance quality metadata into runtime ranking", () => {
    const batch = loadReviewBatch();
    const question = batch.questions[0];
    const row = questionToRow(question, batch);
    const metadata = parseQuestionQualityMetadata(row.provenance);

    assert.equal(metadata?.evidenceStatus, "source-verified");
    assert.equal(metadata?.clinicalReviewStatus, "pending");
    assert.equal(getQuestionQualityProfile({
      ...question,
      qualityMetadata: metadata,
    }).tier, 0);
    assert.equal(parseQuestionQualityMetadata("{not-json"), undefined);
    assert.equal(parseQuestionQualityMetadata(JSON.stringify({
      qualityMetadata: {
        evidenceStatus: "source-verified",
        contentVersion: 2,
      },
    })), undefined);
  });
});
