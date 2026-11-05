import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { chapter, practiceText } from "../src/quran.js";
import {
  studyKey,
  describeSegments,
  wordFrequency,
  repeatColour,
} from "../src/word-study.js";
const read = (s) =>
  JSON.parse(
    readFileSync(new URL(`../public/data/grammar/${s}.json`, import.meta.url)),
  );
test("every attached grammar annotation matches its exact display word position", () => {
  let matched = 0;
  for (let s = 1; s <= 114; s++) {
    const data = read(s),
      verses = chapter(s).verses;
    assert.equal(data.length, verses.length);
    verses.forEach((v, i) => {
      const words = practiceText(s, i, v).split(/\s+/);
      assert.equal(data[i].length, words.length);
      data[i].forEach((segments, j) => {
        if (segments) {
          assert.equal(
            studyKey(segments.map((x) => x[0]).join("")),
            studyKey(words[j]),
            `${s}:${i + 1}:${j + 1}`,
          );
          matched++;
        }
      });
    });
  }
  const provenance = read("provenance");
  assert.equal(matched, provenance.matchedWords);
  assert.ok(matched > 77000);
  assert.equal(
    createHash("sha256")
      .update(
        readFileSync(
          new URL("../public/data/grammar/source.txt", import.meta.url),
        ),
      )
      .digest("hex"),
    provenance.sha256,
  );
});
test("verb details distinguish imperative, root and dictionary lemma in Fatiha", () => {
  const details = describeSegments(read(1)[5][0]);
  assert.match(details[0].type, /Verb/);
  assert.equal(details[0].root, "هدي");
  assert.equal(details[0].lemma, "هَدَى");
  assert.ok(details[0].details.includes("Imperative · أمر"));
  assert.match(details[1].type, /Pronoun/);
});
test("Bismillah does not shift Baqarah annotations and disconnected letters are not labelled verbs", () => {
  assert.equal(read(2)[0].length, 1);
  assert.equal(read(2)[0][0][0][1], "INL");
  const verbs = describeSegments(read(1)[4][1]);
  assert.equal(verbs[0].root, "عبد");
  assert.equal(verbs[0].lemma, "عَبَدَ");
});
test("repeated spelling counts and colours ignore diacritics without claiming shared roots", () => {
  assert.equal(studyKey("ٱلرَّحْمَٰنِ"), studyKey("الرحمان"));
  assert.equal(wordFrequency("قُلْ"), wordFrequency("قل"));
  assert.ok(wordFrequency("قل") > 100);
  assert.equal(repeatColour("قُلْ"), repeatColour("قل"));
  assert.equal(wordFrequency("not an Arabic word"), 0);
});
