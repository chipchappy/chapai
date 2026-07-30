import assert from "node:assert/strict";
import test from "node:test";
import {
  describeStateChanges,
  summarizeStateChanges,
} from "../../apps/web/src/lib/clinical-simulation/clinical-language";
import type { StateChange } from "../../apps/web/src/lib/clinical-simulation/engine";

// The whole point of this module is that engine internals never reach a student.
// These tests lock that contract in: anything that looks like developer output is
// a regression, not a cosmetic issue.

const change = (path: string, before: unknown, after: unknown): StateChange => ({ path, before, after });

test("internal bookkeeping flags never surface", () => {
  const described = describeStateChanges([
    change("flags.rapidResponseActivated", undefined, true),
    change("flags.documented", undefined, true),
    change("timeSinceLastReassessment", 6, 0),
    change("ventilator.mode", "PC", "VC"),
  ]);
  assert.deepEqual(described, []);
});

test("no rendered text ever contains a raw path or undefined", () => {
  const described = describeStateChanges([
    change("vitals.map", 74, 58),
    change("labs.lactate", 2.1, 4.4),
    change("devices.peripheralIV", undefined, "patency verified"),
    change("flags.somethingNew", undefined, true),
    change("someFutureEngineField", undefined, true),
  ]);
  for (const item of described) {
    assert.doesNotMatch(item.text, /undefined|null|\bflags\b|\bvitals\.|\blabs\.|→\s*$/, item.text);
  }
  // The unrecognised field is suppressed rather than leaked.
  assert.equal(described.some((item) => item.path === "someFutureEngineField"), false);
});

test("numeric changes read clinically and carry direction", () => {
  const [map] = describeStateChanges([change("vitals.map", 74, 58)]);
  assert.equal(map.text, "MAP 74 → 58 mmHg");
  assert.equal(map.direction, "worsened");
  assert.equal(map.salient, true);

  const [spo2] = describeStateChanges([change("vitals.spo2", 86, 94)]);
  assert.equal(spo2.text, "SpO₂ 86 → 94 %");
  assert.equal(spo2.direction, "improved");
});

test("changes below the clinical-noise threshold are dropped", () => {
  assert.deepEqual(describeStateChanges([change("vitals.heartRate", 88, 90)]), []);
  assert.equal(describeStateChanges([change("vitals.heartRate", 88, 104)]).length, 1);
});

test("temperature keeps one decimal instead of rounding away the fever", () => {
  const [temp] = describeStateChanges([change("vitals.temperatureC", 37.1, 38.9)]);
  assert.equal(temp.text, "Temperature 37.1 → 38.9 °C");
});

test("first-time findings read as statements, not transitions from undefined", () => {
  const [iv] = describeStateChanges([change("devices.peripheralIV", undefined, "patency verified")]);
  assert.equal(iv.text, "Peripheral IV: patency verified");
});

test("clinical acronyms survive de-camel-casing", () => {
  const [ecg] = describeStateChanges([change("devices.ecgLeads", "3-lead", "5-lead")]);
  assert.equal(ecg.text, "ECG leads: 3 lead → 5 lead");
  const [foley] = describeStateChanges([change("devices.foleyCatheter", undefined, "20 mL clear yellow")]);
  assert.equal(foley.text, "Foley catheter: 20 mL clear yellow");
});

test("position enums lose their slug formatting", () => {
  const [position] = describeStateChanges([change("position", "supine", "high-fowler")]);
  assert.equal(position.text, "Position: supine → high fowler");
});

test("new complications are reported as additions only", () => {
  const [complication] = describeStateChanges([
    change("activeComplications", ["ileus"], ["ileus", "acute kidney injury"]),
  ]);
  assert.equal(complication.text, "New complication: acute kidney injury");
  assert.equal(complication.salient, true);
  // Nothing added means nothing to say.
  assert.deepEqual(describeStateChanges([change("activeComplications", ["ileus"], ["ileus"])]), []);
});

test("labs use proper names and units", () => {
  const [lactate] = describeStateChanges([change("labs.lactate", 2.1, 4.4)]);
  assert.equal(lactate.text, "Lactate 2.1 → 4.4 mmol/L");
  assert.equal(lactate.direction, "worsened");
});

test("summary prioritises salient changes and reports the overflow", () => {
  const summary = summarizeStateChanges([
    change("vitals.heartRate", 88, 91),          // noise, dropped
    change("position", "supine", "semi-fowler"), // not salient
    change("vitals.map", 74, 55),                // salient, worsened
    change("vitals.spo2", 96, 88),               // salient, worsened
    change("labs.lactate", 2.0, 4.0),            // salient, worsened
    change("flags.documented", undefined, true), // suppressed
  ], 2);
  assert.ok(summary);
  assert.equal(summary.direction, "worsened");
  assert.equal(summary.count, 4);
  assert.match(summary.text, /\+2 more$/);
  assert.doesNotMatch(summary.text, /Heart rate/);
});

test("a change set with only internals summarises to nothing", () => {
  assert.equal(summarizeStateChanges([change("flags.documented", undefined, true)]), null);
});
