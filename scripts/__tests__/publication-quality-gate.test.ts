import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { describe, it } from "node:test";

import {
  evaluatePublicationBatch,
  evaluatePublicationQuality,
} from "../../packages/content/scripts/publication-quality-gate.mjs";
import {
  insertSql,
  questionToRow,
} from "../sync-d1-question-bank.mjs";

const longRationale = [
  "The client has a new oxygenation problem that requires immediate stabilization before routine care.",
  "The selected intervention addresses the active physiologic threat, permits rapid reassessment, and reduces the risk of preventable deterioration.",
  "Each distractor either delays treatment, focuses on a chronic background finding, or attempts an intervention that does not correct the mechanism.",
  "The nurse should connect the acute cue cluster to airway, breathing, circulation, safety, and the expected response rather than reacting to one isolated value.",
].join(" ");

function publishableQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "codex-gate-test-001",
    exam: "nclex",
    type: "mcq",
    category: "Physiological Adaptation",
    difficulty: 4,
    stem: "Which nursing action most directly addresses the client's new oxygenation and perfusion changes?",
    options: [
      { id: "a", text: "Address the immediate physiologic threat" },
      { id: "b", text: "Delay intervention for routine documentation" },
      { id: "c", text: "Focus only on stable chronic history" },
      { id: "d", text: "Reassess at the end of the shift" },
    ],
    answer: "a",
    rationale: longRationale,
    structuredRationale: {
      overview: longRationale,
      mechanism: "Impaired oxygen delivery threatens cellular function, so rapid stabilization, circulation support, and repeated bedside assessment reduce secondary injury to vulnerable organs.",
      whyCorrect: "The correct action treats the immediate physiologic mechanism and creates a measurable response that the nurse can reassess.",
      whyWrong: {
        b: "Delaying treatment for documentation allows the time-sensitive oxygenation problem to worsen.",
        c: "Stable chronic history does not outrank a new physiologic change that threatens organ perfusion.",
        d: "Waiting until the end of the shift is unsafe because the client requires prompt intervention and reassessment.",
      },
      citations: [{ source: "Official clinical guideline", href: "https://example.gov/guideline" }],
    },
    distractorRationales: {
      b: "Delaying treatment for documentation allows the time-sensitive oxygenation problem to worsen.",
      c: "Stable chronic history does not outrank a new physiologic change that threatens organ perfusion.",
      d: "Waiting until the end of the shift is unsafe because the client requires prompt intervention and reassessment.",
    },
    references: [{ title: "Official clinical guideline", href: "https://example.gov/guideline" }],
    visualRationale: {
      type: "flow",
      title: "Cue to action",
      nodes: [{ label: "Cue", value: "Acute oxygenation change" }],
    },
    reviewStatus: "final-curated-live",
    publishState: "published",
    qualityMetadata: {
      gateVersion: "nclex-publication-v1",
      contentVersion: 1,
      evidenceStatus: "source-verified",
      sourceIds: ["official-guideline"],
    },
    ...overrides,
  };
}

describe("publication quality gate", () => {
  it("passes a fully sourced item and blocks placeholder teaching", () => {
    const passed = evaluatePublicationQuality(publishableQuestion());
    const failed = evaluatePublicationQuality(publishableQuestion({
      rationale: "N/A this is the correct choice.",
    }));

    assert.equal(passed.passed, true);
    assert.equal(failed.passed, false);
    assert.ok(failed.issues.includes("placeholder-rationale"));
  });

  it("requires a complete six-step case before publication", () => {
    const steps = [
      "recognize-cues",
      "analyze-cues",
      "prioritize-hypotheses",
      "generate-solutions",
      "take-actions",
      "evaluate-outcomes",
    ];
    const chartReview = {
      hpi: ["Acute symptom began today.", "A second history detail is documented.", "Baseline function was normal."],
      nursingNotes: ["0800: New bedside observation documented.", "0810: Reassessment finding documented."],
      vitals: [{ label: "Heart rate", value: "120/min" }],
      labs: [{ label: "Lactate", value: "4 mmol/L" }],
      providerOrders: ["Begin the prescribed intervention."],
    };
    const complete = steps.map((cjmmStep, index) => publishableQuestion({
      id: `codex-gate-case-${index + 1}`,
      caseStudyId: "codex-gate-case",
      cjmmStep,
      chartReview,
    }));

    assert.equal(evaluatePublicationBatch(complete).passed, true);
    assert.equal(evaluatePublicationBatch(complete.slice(0, 5)).passed, false);
  });

  it("defaults imports to draft and preserves terminal live review decisions on conflict", () => {
    const row = questionToRow(
      publishableQuestion({
        publishState: undefined,
        reviewStatus: undefined,
      }),
      { batchId: "gate-test-batch" },
    );
    const sql = insertSql(row);
    const provenance = JSON.parse(row.provenance);

    assert.equal(row.publish_state, "draft");
    assert.equal(row.review_status, "needs_review");
    assert.equal(provenance.qualityGate.gateVersion, "nclex-publication-v1");
    assert.match(sql, /questions\.publish_state[^;]+<> 'published'/i);
    assert.match(sql, /final-curated-live/);
    assert.match(sql, /rejected/);

    const database = new DatabaseSync(":memory:");
    const columns = Object.keys(row);
    database.exec(`CREATE TABLE questions (${columns.map((column) => (
      column === "id" ? "id TEXT PRIMARY KEY" : `${column} TEXT`
    )).join(", ")})`);
    database.exec(sql);
    database.exec("UPDATE questions SET publish_state='published', review_status='final-curated-live' WHERE id='codex-gate-test-001'");

    const attemptedOverwrite = questionToRow(
      publishableQuestion({
        stem: "This draft must not overwrite the protected live question record.",
        publishState: undefined,
        reviewStatus: undefined,
      }),
      { batchId: "later-draft-batch" },
    );
    database.exec(insertSql(attemptedOverwrite));
    const protectedRow = database.prepare("SELECT stem, publish_state, review_status FROM questions WHERE id=?")
      .get("codex-gate-test-001") as { stem: string; publish_state: string; review_status: string };

    assert.notEqual(protectedRow.stem, attemptedOverwrite.stem);
    assert.equal(protectedRow.publish_state, "published");
    assert.equal(protectedRow.review_status, "final-curated-live");
    database.close();
  });
});
