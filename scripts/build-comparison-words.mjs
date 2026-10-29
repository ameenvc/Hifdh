import { readFileSync, writeFileSync } from "node:fs";
import { normalize } from "../src/arabic.js";
const uthmani = JSON.parse(
  readFileSync(new URL("../src/data/uthmani.json", import.meta.url), "utf8"),
);
const standard = JSON.parse(
  readFileSync(
    new URL("../src/data/simple-clean.json", import.meta.url),
    "utf8",
  ),
);
const entries = new Map();
// Only pair words when the two source verses have the same word boundaries.
// Unaligned verses are excluded rather than guessing the correspondence.
for (const chapter of Object.keys(uthmani)) {
  for (let i = 0; i < uthmani[chapter].length; i++) {
    const left = uthmani[chapter][i].text.split(/\s+/),
      right = standard[chapter][i].text.split(/\s+/);
    if (left.length !== right.length) continue;
    left.forEach((word, index) => {
      const spelling = normalize(right[index]);
      if (normalize(word) === spelling) return;
      const previous = entries.get(word);
      if (previous && previous !== spelling)
        throw Error("Ambiguous comparison spelling: " + word);
      entries.set(word, spelling);
    });
  }
}
writeFileSync(
  new URL("../src/data/comparison-words.json", import.meta.url),
  JSON.stringify(
    Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b))),
    null,
    2,
  ) + "\n",
);
console.log(`Generated ${entries.size} source-backed comparison spellings`);
