import { letterNames } from "./letter-names.js";
import { normalize } from "./arabic.js";
export { normalize } from "./arabic.js";
import comparisonWords from "./data/comparison-words.json" with { type: "json" };
export function spokenTokens(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => normalize(word).length > 0);
}
export function matchingWord(word) {
  return comparisonWords[word] || normalize(word);
}

// Align words, permitting identical Arabic letters to be joined/split by a
// recognizer. This changes comparison boundaries, never the displayed Quran.
export function compareRecitation(expected, spoken, { finished = false } = {}) {
  const original = expected.trim().split(/\s+/),
    target = original.map(matchingWord);
  const actual = normalize(spoken).split(/\s+/).filter(Boolean);
  const forms = original.map((word, index) => [
    target[index],
    ...(letterNames[word] || []),
  ]);
  const same = (index, spoken) => forms[index].includes(spoken);
  const statuses = target.map((w) => (w ? "pending" : "correct")),
    ranges = target.map(() => null);
  const dp = Array.from(
    { length: target.length + 1 },
    () => new Float64Array(actual.length + 1),
  );
  for (let i = 1; i <= target.length; i++)
    dp[i][0] = dp[i - 1][0] + (target[i - 1] ? 1 : 0);
  for (let j = 1; j <= actual.length; j++) dp[0][j] = j;
  for (let i = 1; i <= target.length; i++)
    for (let j = 1; j <= actual.length; j++) {
      let score = Math.min(
        dp[i - 1][j - 1] + (same(i - 1, actual[j - 1]) ? 0 : 1),
        dp[i - 1][j] + (target[i - 1] ? 1 : 0),
        dp[i][j - 1] + 1,
      );
      for (let count = 2; count <= 5; count++) {
        if (
          j >= count &&
          target[i - 1] &&
          same(i - 1, actual.slice(j - count, j).join(""))
        )
          score = Math.min(score, dp[i - 1][j - count]);
        if (
          i >= count &&
          target.slice(i - count, i).every(Boolean) &&
          target.slice(i - count, i).join("") === actual[j - 1]
        )
          score = Math.min(score, dp[i - count][j - 1]);
      }
      dp[i][j] = score;
    }
  let end = 0;
  for (let i = 1; i <= target.length; i++)
    if (dp[i][actual.length] <= dp[end][actual.length]) end = i;
  let i = end,
    j = actual.length,
    extraWords = 0;
  const details = [];
  while (i > 0 || j > 0) {
    if (i && !target[i - 1] && dp[i][j] === dp[i - 1][j]) {
      ranges[--i] = { from: j, to: j };
      continue;
    }
    if (i && j && same(i - 1, actual[j - 1]) && dp[i][j] === dp[i - 1][j - 1]) {
      statuses[i - 1] = "correct";
      ranges[i - 1] = { from: j - 1, to: j };
      i--;
      j--;
      continue;
    }
    let joined = false;
    if (i && j)
      for (let count = 2; count <= 5; count++) {
        if (
          j >= count &&
          same(i - 1, actual.slice(j - count, j).join("")) &&
          dp[i][j] === dp[i - 1][j - count]
        ) {
          statuses[i - 1] = "correct";
          ranges[i - 1] = { from: j - count, to: j };
          i--;
          j -= count;
          joined = true;
          break;
        }
        if (
          i >= count &&
          target.slice(i - count, i).every(Boolean) &&
          target.slice(i - count, i).join("") === actual[j - 1] &&
          dp[i][j] === dp[i - count][j - 1]
        ) {
          for (let n = i - count; n < i; n++) {
            statuses[n] = "correct";
            ranges[n] = { from: j - 1, to: j };
          }
          i -= count;
          j--;
          joined = true;
          break;
        }
      }
    if (joined) continue;
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + 1) {
      statuses[i - 1] = "mistake";
      ranges[i - 1] = { from: j - 1, to: j };
      details.push({
        type: "incorrect",
        position: i - 1,
        expected: original[i - 1],
        recited: actual[j - 1],
      });
      i--;
      j--;
    } else if (i && dp[i][j] === dp[i - 1][j] + 1) {
      statuses[i - 1] = "mistake";
      ranges[i - 1] = { from: j, to: j };
      details.push({
        type: "missed",
        position: i - 1,
        expected: original[i - 1],
        recited: "",
      });
      i--;
    } else {
      extraWords++;
      details.push({
        type: "extra",
        position: i,
        expected: "",
        recited: actual[--j],
        actualIndex: j,
      });
    }
  }
  details.reverse();
  if (finished)
    for (let k = end; k < target.length; k++)
      if (target[k]) {
        statuses[k] = "mistake";
        details.push({
          type: "missed",
          position: k,
          expected: original[k],
          recited: "",
        });
      }
  return {
    statuses,
    extraWords,
    details,
    reached: end,
    ranges,
    actual,
    complete: statuses.every((s) => s === "correct") && extraWords === 0,
  };
}
export function compareWords(expected, spoken) {
  return compareRecitation(expected, spoken).statuses;
}

// Keep the original exact-only helper for callers needing strict completion.
export function advanceMatchedVerses(verses, start, spoken) {
  const actual = spokenTokens(spoken);
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

// A later matching phrase anchors the position even if an earlier word was
// different or omitted. Completed ayahs retain their red words as we advance.
export function followVerses(verses, start, spoken) {
  const spokenWords = spokenTokens(spoken);
  if (!spokenWords.length)
    return { verse: start, consumed: 0, completed: [], ended: false };
  let limit = start,
    total = 0;
  while (
    limit < verses.length &&
    (total < spokenWords.length + 12 || limit < start + 2)
  ) {
    total += verses[limit].trim().split(/\s+/).length;
    limit++;
  }
  const selected = verses.slice(start, limit),
    counts = selected.map((v) => v.trim().split(/\s+/).length);
  const result = compareRecitation(selected.join(" "), spoken);
  const completed = [];
  let offset = 0,
    consumed = 0,
    verse = start;
  for (const count of counts) {
    const end = offset + count;
    if (end > result.reached) break;
    const statuses = result.statuses.slice(offset, end);
    // Require at least one recognized correct word to advance; silence or an
    // entirely unrelated transcript cannot silently skip an ayah.
    if (!statuses.includes("correct")) break;
    const to = Math.max(
      consumed,
      ...result.ranges
        .slice(offset, end)
        .filter(Boolean)
        .map((r) => r.to),
    );
    const errors = result.details
      .filter((d) => d.position >= offset && d.position < end)
      .map((d) => ({ ...d, position: d.position - offset }));
    const extra = result.details.filter(
      (d) =>
        d.type === "extra" && d.position === end && verse === verses.length - 1,
    );
    errors.push(...extra.map((d) => ({ ...d, position: count })));
    const finalTo = verse === verses.length - 1 ? spokenWords.length : to;
    completed.push({
      verse,
      text: spokenWords.slice(consumed, finalTo).join(" "),
      statuses,
      details: errors,
      extraWords: errors.filter((d) => d.type === "extra").length,
      complete: statuses.every((s) => s === "correct") && errors.length === 0,
    });
    consumed = finalTo;
    verse++;
    offset = end;
  }
  return { verse, consumed, completed, ended: verse === verses.length };
}
