import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, compareWords } from "../src/recitation.js";
test("Arabic normalization ignores vowel marks and alef variants", () => {
  assert.equal(normalize("بِسْمِ ٱللَّهِ"), normalize("بسم الله"));
});
test("matching recognized words turn correct and unspoken words stay pending", () => {
  assert.deepEqual(
    compareWords("الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", "الحمد لله"),
    ["correct", "correct", "pending", "pending"],
  );
});
test("a substituted word is a possible mistake", () => {
  assert.deepEqual(compareWords("مَالِكِ يَوْمِ الدِّينِ", "مالك نور الدين"), [
    "correct",
    "mistake",
    "correct",
  ]);
});
test("empty recognition does not flag a mistake", () => {
  assert.deepEqual(compareWords("الرَّحْمَٰنِ الرَّحِيمِ", ""), [
    "pending",
    "pending",
  ]);
});

import { compareRecitation } from "../src/recitation.js";
test("an omitted word does not flag later correctly recited words", () => {
  assert.deepEqual(compareWords("الحمد لله رب العالمين", "الحمد رب العالمين"), [
    "correct",
    "mistake",
    "correct",
    "correct",
  ]);
});
test("a repeated word is counted without shifting the rest of the ayah", () => {
  const result = compareRecitation(
    "الحمد لله رب العالمين",
    "الحمد الحمد لله رب العالمين",
  );
  assert.deepEqual(result.statuses, [
    "correct",
    "correct",
    "correct",
    "correct",
  ]);
  assert.equal(result.extraWords, 1);
  assert.equal(result.complete, false);
});
test("extra trailing words prevent completion", () => {
  assert.equal(compareRecitation("بسم الله", "بسم الله نور").complete, false);
});
test("a complete matching ayah is complete", () => {
  assert.equal(
    compareRecitation("الرَّحْمَٰنِ الرَّحِيمِ", "الرحمن الرحيم").complete,
    true,
  );
});

test("feedback distinguishes substitution, omission and extra speech", () => {
  assert.equal(
    compareRecitation("مالك يوم الدين", "مالك نور الدين").details[0].type,
    "incorrect",
  );
  assert.equal(
    compareRecitation("الحمد لله رب العالمين", "الحمد رب العالمين").details[0]
      .type,
    "missed",
  );
  assert.equal(
    compareRecitation("بسم الله", "بسم الله نور").details[0].type,
    "extra",
  );
});
test("only an explicitly finished attempt marks unrecited ending words missed", () => {
  assert.deepEqual(
    compareRecitation("الحمد لله رب العالمين", "الحمد لله").statuses,
    ["correct", "correct", "pending", "pending"],
  );
  const result = compareRecitation("الحمد لله رب العالمين", "الحمد لله", {
    finished: true,
  });
  assert.deepEqual(result.statuses, [
    "correct",
    "correct",
    "mistake",
    "mistake",
  ]);
  assert.equal(result.details.length, 2);
  assert.ok(result.details.every((d) => d.type === "missed"));
});
