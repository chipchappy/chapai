import { clinicalScenarios } from "../apps/web/src/lib/clinical-simulation/scenarios";
import { futureScenarioOutlines } from "../apps/web/src/lib/clinical-simulation/future-scenario-outlines";
import { validateScenarioDefinition } from "../apps/web/src/lib/clinical-simulation/schema";

let failed = false;
for (const scenario of clinicalScenarios) {
  const validation = validateScenarioDefinition(scenario);
  if (validation.success) {
    console.log(`PASS ${scenario.slug} v${scenario.version} (${scenario.status}; ${scenario.clinicalReviewerStatus})`);
    continue;
  }
  failed = true;
  console.error(`FAIL ${scenario.slug} v${scenario.version}`);
  for (const issue of validation.issues) {
    console.error(`  ${issue.path.join(".") || "scenario"}: ${issue.message}`);
  }
}

const outlineIds = new Set(futureScenarioOutlines.map((outline) => outline.id));
if (outlineIds.size !== futureScenarioOutlines.length || futureScenarioOutlines.some((outline) => outline.playable || outline.status !== "outline")) {
  failed = true;
  console.error("FAIL future scenario outlines must be unique and explicitly non-playable");
} else {
  console.log(`PASS ${futureScenarioOutlines.length} future outlines remain explicitly non-playable`);
}

if (failed) process.exit(1);
console.log(`Validated ${clinicalScenarios.length} playable technical-testing scenarios.`);
