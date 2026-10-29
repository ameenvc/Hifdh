import { test } from "node:test";
import assert from "node:assert/strict";
import { dateKey, activitySummary } from "../src/activity.js";

test("new users have no fabricated streak or activity", () => {
  const result = activitySummary({}, new Date(2026, 9, 29));
  assert.equal(result.streak, 0);
  assert.equal(result.days.length, 84);
  assert.equal(result.week.length, 7);
  assert.ok(result.days.every((d) => d.sessions === 0));
});
test("streak includes yesterday until today is practiced", () => {
  const activity = {
    "2026-10-27": { seconds: 60, sessions: 1 },
    "2026-10-28": { seconds: 180, sessions: 1 },
  };
  assert.equal(activitySummary(activity, new Date(2026, 9, 29)).streak, 2);
  activity["2026-10-29"] = { seconds: 120, sessions: 1 };
  assert.equal(activitySummary(activity, new Date(2026, 9, 29)).streak, 3);
  assert.equal(activitySummary(activity, new Date(2026, 9, 31)).streak, 0);
});
test("activity includes calendar boundaries and real time values", () => {
  const result = activitySummary(
    { "2026-01-01": { seconds: 300, sessions: 2 } },
    new Date(2026, 0, 1),
  );
  assert.equal(result.days.at(-1).date, "2026-01-01");
  assert.equal(result.days.at(-2).date, "2025-12-31");
  assert.equal(result.week.at(-1).seconds, 300);
  assert.equal(dateKey(new Date(2026, 0, 9)), "2026-01-09");
});
