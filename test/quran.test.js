import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  chapter,
  splitOpening,
  practiceText,
  searchQuran,
  surahs,
  SURAH_COUNTS,
  BISMILLAH,
  ayahTranscript,
} from "../src/quran.js";
import { normalize } from "../src/recitation.js";

test("bundled Quran matches the pinned upstream text and metadata checksums", () => {
  const provenance = JSON.parse(
    readFileSync(
      new URL("../src/data/provenance.json", import.meta.url),
      "utf8",
    ),
  );
  for (const entry of provenance.files) {
    const name = entry.path.split("/").at(-1);
    const actual = createHash("sha256")
      .update(readFileSync(new URL("../src/data/" + name, import.meta.url)))
      .digest("hex");
    assert.equal(actual, entry.sha256);
  }
});
test("all 114 surahs have the expected Hafs ayah counts and sequential audio IDs", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../src/data/uthmani.json", import.meta.url), "utf8"),
  );
  assert.equal(surahs.length, 114);
  let next = 1;
  for (const surah of surahs) {
    const loaded = chapter(surah.number);
    assert.equal(loaded.verses.length, SURAH_COUNTS[surah.number - 1]);
    assert.equal(loaded.verses.length, surah.numberOfAyahs);
    raw[surah.number].forEach((row, i) => {
      assert.equal(row.verse, i + 1);
      assert.equal(row.chapter, surah.number);
      assert.equal(loaded.verses[i], row.text);
      assert.equal(loaded.ayahNumbers[i], next++);
    });
  }
  assert.equal(next - 1, 6236);
});
test("separate opening Bismillah preserves every source character and every verse number", () => {
  for (const surah of surahs) {
    const loaded = chapter(surah.number),
      first = loaded.verses[0],
      opening = splitOpening(surah.number, first);
    if (surah.number === 1) {
      assert.equal(opening.number, 1);
      assert.equal(opening.bismillah, BISMILLAH);
      assert.equal(loaded.verses.length, 7);
    } else if (surah.number === 9) {
      assert.equal(opening.bismillah, null);
      assert.equal(opening.verse, first);
    } else {
      assert.equal(normalize(opening.bismillah), normalize(BISMILLAH));
      assert.ok(opening.verse.length);
      assert.equal(opening.bismillah + " " + opening.verse, first);
      assert.equal(practiceText(surah.number, 0, first), opening.verse);
    }
  }
});
test("Bismillah inside An-Naml 27:30 is preserved as part of the ayah", () => {
  const verse = chapter(27).verses[29];
  assert.equal(practiceText(27, 29, verse), verse);
  assert.match(normalize(verse), /بسم الله الرحمن الرحيم/);
});
test("corpus phrase search works locally and preserves canonical references", () => {
  const matches = searchQuran("قل هو الله احد", normalize);
  assert.ok(
    matches.some((m) => m.surah.number === 112 && m.numberInSurah === 1),
  );
  assert.ok(
    !normalize(matches.find((m) => m.surah.number === 112).text).includes(
      "بسم",
    ),
  );
  assert.equal(searchQuran("zzz", normalize).length, 0);
});

test("optional unnumbered opening is accepted only before first ayah of applicable surahs", () => {
  assert.equal(
    ayahTranscript(112, 0, "بسم الله الرحمن الرحيم قل هو الله احد", normalize),
    "قل هو الله احد",
  );
  assert.equal(
    ayahTranscript(1, 0, "بسم الله الرحمن الرحيم", normalize),
    "بسم الله الرحمن الرحيم",
  );
  assert.equal(
    ayahTranscript(27, 29, "بسم الله الرحمن الرحيم", normalize),
    "بسم الله الرحمن الرحيم",
  );
});

test("a partially recognized optional Bismillah is not mistaken for the first ayah", () => {
  assert.equal(ayahTranscript(112, 0, "بسم الله", normalize), "");
  assert.equal(ayahTranscript(112, 0, "قل هو", normalize), "قل هو");
});
