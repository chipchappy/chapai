import assert from "node:assert/strict";
import test from "node:test";
import { formatTimeOnSite, segmentOf } from "../../apps/web/src/lib/roster-format";

// formatTimeOnSite ─────────────────────────────────────────────────────────
// Only a fraction of quiz_answers rows carry a time_spent_ms value, so most
// roster rows have never been timed at all. That case must read as "we never
// measured this" (an em dash), not "0m" — "0m" reads as "visited and did
// nothing", which is a different and false claim.

test("no timed answers renders as a dash, not zero", () => {
  assert.equal(formatTimeOnSite(null), "—");
});

test("a genuine zero-millisecond sum is a real measurement, not a dash", () => {
  // Distinct from the null case: the student has timed answers and they
  // summed to exactly zero. That is honest data, so it renders as "0m".
  assert.equal(formatTimeOnSite(0), "0m");
});

test("durations under a minute round down but are not misreported as zero", () => {
  assert.equal(formatTimeOnSite(1), "<1m");
  assert.equal(formatTimeOnSite(30_000), "<1m");
  assert.equal(formatTimeOnSite(59_999), "<1m");
});

test("minute boundary", () => {
  assert.equal(formatTimeOnSite(60_000), "1m");
  assert.equal(formatTimeOnSite(119_999), "1m");
});

test("hour boundary", () => {
  assert.equal(formatTimeOnSite(3_600_000), "1h 0m");
  assert.equal(formatTimeOnSite(3_659_999), "1h 0m");
  assert.equal(formatTimeOnSite(3_660_000), "1h 1m");
});

test("multi-hour durations format as Xh Ym", () => {
  // 135.5 minutes -> floors to 135 minutes -> 2h 15m.
  assert.equal(formatTimeOnSite(8_130_000), "2h 15m");
});

// segmentOf ────────────────────────────────────────────────────────────────
// The roster's three populations (demo cohort / independent paid /
// independent free) drive different questions, so misclassifying one as
// another would put a student in front of the wrong faculty narrative.

test("cohort membership beats tier: a demo student on a paid plan is still demo", () => {
  assert.equal(segmentOf({ cohort: "fairfield-2026", tier: "pro" }), "demo");
  assert.equal(segmentOf({ cohort: "fairfield-2026", tier: "plus" }), "demo");
});

test("cohort membership beats tier: a demo student on the free tier is still demo", () => {
  assert.equal(segmentOf({ cohort: "fairfield-2026", tier: "free" }), "demo");
});

test("no cohort and free tier is independent free", () => {
  assert.equal(segmentOf({ cohort: null, tier: "free" }), "free");
});

test("no cohort and a paid tier is independent paid", () => {
  assert.equal(segmentOf({ cohort: null, tier: "plus" }), "paid");
  assert.equal(segmentOf({ cohort: null, tier: "pro" }), "paid");
});
