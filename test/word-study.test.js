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
  assert.ok(details[0].details.includes("Imperative · أَمْرٌ"));
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

test("English meaning source is intact and maps to corpus word positions", async () => {
  const { default: entries } =
    await import("../public/data/meanings/english.js");
  const meanings = new Map(entries);
  const provenance = JSON.parse(
    readFileSync(
      new URL("../public/data/meanings/provenance.json", import.meta.url),
    ),
  );
  assert.equal(
    createHash("sha256")
      .update(
        readFileSync(
          new URL("../public/data/meanings/english.js", import.meta.url),
        ),
      )
      .digest("hex"),
    provenance.sha256,
  );
  assert.equal(JSON.parse(meanings.get("1:6:1:1")), "Guide us");
  assert.equal(JSON.parse(meanings.get("1:5:2:1")), "we worship");
  let covered = 0,
    absent = 0;
  for (let s = 1; s <= 114; s++) {
    const rows = read(s);
    chapter(s).verses.forEach((verse, i) => {
      let position = 0;
      practiceText(s, i, verse)
        .split(/\s+/)
        .forEach((word, w) => {
          if (studyKey(word)) position++;
          if (rows[i][w]) {
            if (meanings.has(`${s}:${i + 1}:${position}:1`)) covered++;
            else absent++;
          }
        });
    });
  }
  assert.ok(covered > 77000);
  assert.equal(absent, 0);
});

test("full English verse translations cover all Hafs ayahs and retain the source checksum", () => {
  const source = readFileSync(
    new URL(
      "../public/data/verse-meanings/english-pickthall.json",
      import.meta.url,
    ),
  );
  const translation = JSON.parse(source);
  const provenance = JSON.parse(
    readFileSync(
      new URL("../public/data/verse-meanings/provenance.json", import.meta.url),
    ),
  );
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    provenance.sha256,
  );
  let total = 0;
  for (let s = 1; s <= 114; s++) {
    assert.equal(translation[s].length, chapter(s).verses.length);
    translation[s].forEach((row, i) => {
      assert.equal(row.chapter, s);
      assert.equal(row.verse, i + 1);
      assert.ok(row.text.trim());
      total++;
    });
  }
  assert.equal(total, 6236);
  assert.equal(translation[1][5].text, "Show us the straight path");
  assert.equal(translation[2][0].text, "Alif. Lam. Mim");
});

test("articles and attached pronouns remain available without crowding the main grammar view", async () => {
  const { partitionSegments } = await import("../src/word-study.js");
  const { primary, attached } = partitionSegments(read(1)[2][0]);
  assert.equal(primary.length, 1);
  assert.equal(primary[0][1], "ADJ");
  assert.equal(attached[0][1], "DET");
  const verb = partitionSegments(read(1)[5][0]);
  assert.equal(verb.primary[0][1], "V");
  assert.equal(verb.attached[0][1], "PRON");
});

test("verb cards show corpus forms and distinguish weak imperatives from Form IV", () => {
  assert.equal(describeSegments(read(1)[5][0])[0].verbForm.number, "I");
  assert.equal(describeSegments(read(1)[4][3])[0].verbForm.number, "X");
  assert.equal(describeSegments(read(1)[6][2])[0].verbForm.pattern, "أَفْعَلَ");
  assert.equal(
    describeSegments(read(2)[213][15]).find((segment) => segment.verbForm)
      ?.verbForm.quadriliteral,
    true,
  );
  assert.equal(
    describeSegments(read(2)[213][15]).find((segment) => segment.verbForm)
      ?.verbForm.pattern,
    "فَعْلَلَ",
  );
  assert.equal(describeSegments(read(1)[1][2])[0].verbForm, null);
});

test("rare forms and incomplete annotations do not receive invented patterns", async () => {
  const { verbForm } = await import("../src/word-study.js");
  assert.equal(verbForm("V", ["STEM", "ROOT:طمن", "(XII)"]).number, "XII");
  assert.equal(verbForm("V", ["STEM", "ROOT:طمن", "(XII)"]).pattern, null);
  assert.equal(verbForm("V", ["STEM"]), null);
  assert.equal(verbForm("N", ["STEM", "ROOT:كتب"]), null);
});

test("Form I shows one past-stem pattern from lemma vowels, including the Nisa screenshot example", async () => {
  const { verbForm } = await import("../src/word-study.js");
  const created = read(4)[0]
    .flatMap((parts) => parts || [])
    .find((s) => s[1] === "V" && s[2].includes("ROOT:خلق"));
  assert.ok(created);
  assert.equal(describeSegments([created])[0].verbForm.pattern, "فَعَلَ");
  assert.equal(
    verbForm("V", ["STEM", "ROOT:علم", "LEM:عَلِمَ"]).pattern,
    "فَعِلَ",
  );
  assert.equal(
    verbForm("V", ["STEM", "ROOT:كبر", "LEM:كَبُرَ"]).pattern,
    "فَعُلَ",
  );
  assert.equal(verbForm("V", ["STEM", "ROOT:خلق", "LEM:خلق"]).pattern, null);
  assert.equal(verbForm("V", ["STEM", "ROOT:قول", "LEM:قَالَ"]).pattern, null);
});

test("Arabic grammar labels carry harakat without altering corpus words or roots", () => {
  const verb = describeSegments(read(1)[5][0])[0];
  assert.equal(verb.type, "Verb · فِعْلٌ");
  assert.ok(verb.details.includes("Imperative · أَمْرٌ"));
  assert.equal(verb.root, "هدي");
  assert.equal(verb.lemma, "هَدَى");
  const noun = describeSegments(read(1)[1][2])[0];
  assert.equal(noun.type, "Noun · اِسْمٌ");
  assert.ok(noun.details.includes("Genitive · مَجْرُورٌ"));
});
