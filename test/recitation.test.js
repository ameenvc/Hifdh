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

import { chapter } from "../src/quran.js";
import { advanceMatchedVerses } from "../src/recitation.js";
test("actual Uthmani spelling of Alhamdulillah matches standard browser transcription", () => {
  assert.equal(
    compareRecitation(chapter(1).verses[1], "الحمد لله رب العالمين").complete,
    true,
  );
  assert.equal(
    compareRecitation(chapter(1).verses[3], "مالك يوم الدين").complete,
    true,
  );
});
test("standard-spelling correspondence does not accept a genuinely different word", () => {
  assert.equal(
    compareRecitation(chapter(1).verses[1], "الحمد لله رب المؤمنين").complete,
    false,
  );
  assert.equal(
    compareRecitation(chapter(1).verses[3], "ملك يوم الدين").complete,
    false,
  );
});
test("exact final ayahs progress without consuming an unfinished next ayah", () => {
  const verses = chapter(1).verses;
  const result = advanceMatchedVerses(
    verses,
    0,
    "بسم الله الرحمن الرحيم الحمد لله",
  );
  assert.equal(result.verse, 1);
  assert.equal(result.consumed, 4);
  assert.equal(result.completed.length, 1);
});
test("extra final words at the end of a surah are not silently discarded", () => {
  const result = advanceMatchedVerses(["بسم الله"], 0, "بسم الله نور");
  assert.equal(result.ended, false);
  assert.equal(result.consumed, 0);
});

import { followVerses } from "../src/recitation.js";
import { practiceText } from "../src/quran.js";
test("spoken disconnected letters match only the exact source opening forms", () => {
  for (const [number, spoken] of [
    [2, "ألف لام ميم"],
    [7, "ألف لام ميم صاد"],
    [19, "كاف هاء ياء عين صاد"],
    [20, "طاء هاء"],
    [26, "طاء سين ميم"],
    [36, "ياء سين"],
    [40, "حاء ميم"],
    [50, "قاف"],
    [68, "نون"],
  ]) {
    const expected = practiceText(number, 0, chapter(number).verses[0]);
    const result = compareRecitation(expected, spoken);
    assert.equal(result.statuses[0], "correct", String(number));
    assert.equal(result.extraWords, 0, String(number));
  }
  assert.equal(compareRecitation("أَلَمْ", "ألف لام ميم").complete, false);
  assert.equal(compareRecitation("الٓمٓ", "ألف لام نون").complete, false);
});
test("split and joined Arabic words compare without changing source word statuses", () => {
  assert.equal(
    compareRecitation("وَإِيَّاكَ نَسْتَعِينُ", "و إياك نستعين").complete,
    true,
  );
  assert.deepEqual(
    compareRecitation("الْحَمْدُ لِلَّهِ", "الحمدلله").statuses,
    ["correct", "correct"],
  );
  assert.equal(
    compareRecitation("وَإِيَّاكَ نَسْتَعِينُ", "و إياك نعبد").complete,
    false,
  );
  assert.equal(
    compareRecitation(
      "۞ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
      "إهدنا الصراط المستقيم",
    ).complete,
    true,
  );
});
test("flow advances past wrong and omitted words without painting the later ayah red", () => {
  const verses = chapter(1).verses;
  const result = followVerses(
    verses,
    0,
    "بسم نور الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم",
  );
  assert.equal(result.verse, 3);
  assert.equal(result.completed[0].statuses[1], "mistake");
  assert.ok(
    result.completed
      .slice(1)
      .every((v) => v.statuses.every((s) => s === "correct")),
  );
  const skipped = followVerses(verses, 1, "الحمد لله رب الرحمن الرحيم");
  assert.equal(skipped.verse, 3);
  assert.equal(skipped.completed[0].details[0].type, "missed");
});

import { letterNames } from "../src/letter-names.js";
test("all 29 surahs with disconnected-letter openings have a spoken-name form", () => {
  const openings = [
    2, 3, 7, 10, 11, 12, 13, 14, 15, 19, 20, 26, 27, 28, 29, 30, 31, 32, 36, 38,
    40, 41, 42, 43, 44, 45, 46, 50, 68,
  ];
  for (const number of openings) {
    const word = practiceText(number, 0, chapter(number).verses[0]).split(
      /\s+/,
    )[0];
    assert.ok(letterNames[word], String(number));
    assert.equal(
      compareRecitation(word, letterNames[word][0]).complete,
      true,
      String(number),
    );
  }
  assert.equal(
    compareRecitation(chapter(42).verses[1], "عين سين قاف").complete,
    true,
  );
});

import standardText from "../src/data/simple-clean.json" with { type: "json" };
import { spokenTokens } from "../src/recitation.js";
test("Yunus 10:1–3 aligns accurate text and standalone recognition punctuation without drifting", () => {
  const verses = chapter(10).verses.map((text, i) => practiceText(10, i, text));
  const spoken = standardText["10"]
    .slice(0, 3)
    .map((row, i) => practiceText(10, i, row.text))
    .join(" ")
    .replace(/^الر /, "ألف لام راء ")
    .split(" ")
    .join(" ، ");
  const result = followVerses(verses, 0, spoken);
  assert.equal(result.verse, 3);
  assert.equal(result.consumed, spokenTokens(spoken).length);
  assert.ok(
    result.completed.every((v) => v.statuses.every((s) => s === "correct")),
  );
});
