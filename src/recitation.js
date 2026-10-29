import { normalize } from "./arabic.js";
export { normalize } from "./arabic.js";
import comparisonWords from "./data/comparison-words.json" with { type: "json" };

// Align the spoken words against a prefix of the ayah. An omitted or repeated
// word should not cause every later word to be marked as a substitution.
export function compareRecitation(expected, spoken, { finished = false } = {}) {
  const original = expected.trim().split(/\s+/);
  const target = original.map(matchingWord);
  const actual = normalize(spoken).split(/\s+/).filter(Boolean);
  const statuses = target.map(() => "pending");
  const dp = Array.from({ length: target.length + 1 }, (_, i) =>
    Array.from({ length: actual.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + (target[i - 1] === actual[j - 1] ? 0 : 1),
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
      );
    }
  }
  let end = 0;
  for (let i = 1; i <= target.length; i++) {
    if (dp[i][actual.length] <= dp[end][actual.length]) end = i;
  }
  let i = end,
    j = actual.length,
    extraWords = 0;
  const details = [];
  while (i > 0 || j > 0) {
    if (
      i &&
      j &&
      dp[i][j] === dp[i - 1][j - 1] + (target[i - 1] === actual[j - 1] ? 0 : 1)
    ) {
      statuses[i - 1] = target[i - 1] === actual[j - 1] ? "correct" : "mistake";
      if (statuses[i - 1] === "mistake")
        details.push({
          type: "incorrect",
          position: i - 1,
          expected: original[i - 1],
          recited: actual[j - 1],
        });
      i--;
      j--;
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) {
      statuses[--i] = "mistake";
      details.push({
        type: "missed",
        position: i,
        expected: original[i],
        recited: "",
      });
    } else {
      extraWords++;
      details.push({
        type: "extra",
        position: i,
        expected: "",
        recited: actual[--j],
      });
    }
  }
  details.reverse();
  if (finished) {
    for (let k = end; k < target.length; k++) {
      statuses[k] = "mistake";
      details.push({
        type: "missed",
        position: k,
        expected: original[k],
        recited: "",
      });
    }
  }
  return {
    statuses,
    extraWords,
    details,
    complete: statuses.every((s) => s === "correct") && extraWords === 0,
  };
}
export function compareWords(expected, spoken) {
  return compareRecitation(expected, spoken).statuses;
}

// Use the companion standard-spelling text only for comparison. The Uthmani
// words rendered by the reader stay exactly as stored in the source snapshot.
export function matchingWord(word) {
  return comparisonWords[word] || normalize(word);
}

// Move forward only over complete, exactly matched FINAL ayahs. A provisional
// speech result must never advance the reader or consume the next ayah's words.
export function advanceMatchedVerses(verses, start, spoken) {
  const actual = spoken.trim().split(/\s+/).filter(Boolean);
  let verse = start,
    consumed = 0;
  const completed = [];
  while (verse < verses.length) {
    const expected = verses[verse].trim().split(/\s+/).map(matchingWord);
    if (actual.length - consumed < expected.length) break;
    if (
      verse === verses.length - 1 &&
      actual.length - consumed > expected.length
    )
      break;
    if (
      !expected.every(
        (word, index) => word === normalize(actual[consumed + index]),
      )
    )
      break;
    completed.push({
      verse,
      text: actual.slice(consumed, consumed + expected.length).join(" "),
    });
    consumed += expected.length;
    verse++;
  }
  return { verse, consumed, completed, ended: verse === verses.length };
}
