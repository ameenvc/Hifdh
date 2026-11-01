import { test } from "node:test";
import assert from "node:assert/strict";
import { locatePassage } from "../src/locator.js";
import { makeChallenge } from "../src/challenge.js";
import { chapter, practiceText } from "../src/quran.js";
test("passage finder locates a unique phrase in the middle of an ayah and its standard page", () => {
  const result = locatePassage("وبشر الذين آمنوا أن لهم قدم صدق");
  assert.equal(result.status, "matched");
  assert.equal(result.match.surah, 10);
  assert.equal(result.match.verse, 1);
  assert.equal(result.match.wordIndex, 11);
  assert.equal(result.match.page, 208);
});
test("common phrases remain ambiguous rather than jumping to an arbitrary page", () => {
  const result = locatePassage("الحمد لله رب العالمين");
  assert.equal(result.status, "ambiguous");
  assert.ok(result.candidates.length > 1);
  assert.equal(locatePassage("الحمد لله").status, "waiting");
  assert.equal(
    locatePassage("مرحبا بكم اليوم في هذا المكان الجميل").status,
    "not-found",
  );
});
test("finder accepts detached letters and an opening Bismillah without using them as sufficient location evidence", () => {
  const result = locatePassage(
    "بسم الله الرحمن الرحيم ألف لام ميم ذلك الكتاب لا ريب فيه",
  );
  assert.equal(result.status, "matched");
  assert.equal(result.match.surah, 2);
  assert.equal(result.match.verse, 0);
  assert.equal(result.match.ignoredWords, 4);
  assert.equal(locatePassage("بسم الله الرحمن الرحيم").status, "waiting");
});
test("a full-ayah challenge keeps its cue and targets the following ayah", () => {
  const result = makeChallenge(1, 1, "next");
  assert.equal(result.cue, practiceText(1, 1, chapter(1).verses[1]));
  assert.equal(result.targetVerse, 2);
  assert.equal(result.cueWords, 0);
  assert.throws(() => makeChallenge(1, 6, "next"), /earlier/);
});
test("partial-ayah challenge reserves visible prompt words and rejects single-word ayahs", () => {
  const result = makeChallenge(1, 6, "finish");
  assert.equal(result.targetVerse, 6);
  assert.equal(result.cueWords, 4);
  assert.throws(() => makeChallenge(2, 0, "finish"), /too short/);
  assert.throws(() => makeChallenge(1, -1, "next"), RangeError);
});

test("short distinctive complete ayahs locate without needing an artificial long transcript", () => {
  const ikhlas = locatePassage("قل هو الله احد");
  assert.equal(ikhlas.status, "matched");
  assert.equal(ikhlas.match.surah, 112);
  const kawthar = locatePassage("إنا أعطيناك الكوثر");
  assert.equal(kawthar.status, "matched");
  assert.equal(kawthar.match.surah, 108);
  const letters = locatePassage("كاف هاء ياء عين صاد");
  assert.equal(letters.status, "matched");
  assert.equal(letters.match.surah, 19);
});
