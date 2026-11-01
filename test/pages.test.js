import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGE_COUNT, quranPage, pageForVerse, chapter } from "../src/quran.js";
test("all 604 standard pages cover each of the 6236 ayahs once in canonical order", () => {
  assert.equal(PAGE_COUNT, 604);
  let expectedSurah = 1,
    index = 0,
    total = 0;
  for (let page = 1; page <= 604; page++) {
    const data = quranPage(page);
    assert.ok(data.rows.length);
    for (const row of data.rows) {
      assert.equal(row.surah, expectedSurah);
      assert.equal(row.index, index);
      assert.equal(row.text, chapter(expectedSurah).verses[index]);
      assert.equal(pageForVerse(row.surah, row.index), page);
      total++;
      index++;
      if (index === chapter(expectedSurah).verses.length) {
        expectedSurah++;
        index = 0;
      }
    }
  }
  assert.equal(total, 6236);
  assert.equal(expectedSurah, 115);
});
test("standard page boundaries and pages containing multiple surahs remain intact", () => {
  assert.deepEqual(quranPage(1).first, {
    surah: 1,
    index: 0,
    text: chapter(1).verses[0],
  });
  assert.equal(quranPage(2).first.surah, 2);
  assert.equal(quranPage(2).rows.length, 5);
  assert.equal(quranPage(3).first.index, 5);
  assert.deepEqual(
    quranPage(604).segments.map((s) => s.surah),
    [112, 113, 114],
  );
  assert.equal(quranPage(604).last.index, 5);
  assert.throws(() => quranPage(0), RangeError);
  assert.throws(() => quranPage(605), RangeError);
});
