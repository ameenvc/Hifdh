import { surahs, chapter, practiceText, pageForVerse } from "./quran.js";
import { matchingWord, normalize, spokenTokens } from "./recitation.js";
import { letterNames } from "./letter-names.js";

let corpus;
function getCorpus() {
  if (corpus) return corpus;
  let value = "";
  const starts = new Map(),
    ends = new Set();
  for (const surah of surahs) {
    for (const [index, verse] of chapter(surah.number).verses.entries()) {
      const words = practiceText(surah.number, index, verse).split(/\s+/);
      words.forEach((word, wordIndex) => {
        const form = matchingWord(word);
        if (!form) return;
        starts.set(value.length, {
          surah: surah.number,
          verse: index,
          wordIndex,
          page: pageForVerse(surah.number, index),
        });
        value += form;
        ends.add(value.length);
      });
    }
    value += "|";
  }
  corpus = { value, starts, ends };
  return corpus;
}
const openings = [
  ...new Map(
    Object.entries(letterNames).flatMap(([word, forms]) =>
      forms.map((form) => [form, matchingWord(word)]),
    ),
  ).entries(),
].sort((a, b) => b[0].length - a[0].length);
function queryForm(words) {
  let form = words.map(normalize).join("");
  for (const [spoken, written] of openings)
    if (form.startsWith(spoken)) {
      form = written + form.slice(spoken.length);
      break;
    }
  return form;
}
export function locatePassage(spoken) {
  const original = spokenTokens(spoken);
  let words = [...original];
  const strip = (phrase) => {
    const target = phrase.split(" ");
    if (
      words.length >= target.length &&
      target.every((word, i) => normalize(words[i]) === word)
    )
      words = words.slice(target.length);
  };
  strip("اعوذ بالله من الشيطان الرجيم");
  strip("بسم الله الرحمن الرحيم");
  const ignoredWords = original.length - words.length;
  const sufficient = (sample) => {
    const raw = sample.map(normalize).join("");
    const named =
      sample.length >= 3 && openings.some(([spoken]) => raw.startsWith(spoken));
    const size = queryForm(sample).length;
    return (
      named ||
      (sample.length >= 4 && size >= 10) ||
      (sample.length >= 3 && size >= 14)
    );
  };
  if (!sufficient(words))
    return {
      status: "waiting",
      candidates: [],
      ignoredWords,
      message:
        "Recite a few clear words. Short or common phrases need more context.",
    };
  const { value, starts, ends } = getCorpus();
  // Require exact letters and real source word boundaries. Never guess a page
  // from the closest fuzzy phrase or an isolated common word.
  for (let count = Math.min(words.length, 18); count >= 3; count--) {
    const query = queryForm(words.slice(0, count));
    if (!sufficient(words.slice(0, count))) continue;
    const candidates = [];
    let position = -1;
    while ((position = value.indexOf(query, position + 1)) !== -1) {
      const candidate = starts.get(position);
      if (!candidate || !ends.has(position + query.length)) continue;
      candidates.push({ ...candidate, matchedWords: count, ignoredWords });
      if (candidates.length >= 20) break;
    }
    if (!candidates.length) continue;
    if (candidates.length === 1)
      return {
        status: "matched",
        match: candidates[0],
        candidates,
        ignoredWords,
        message: "Recognized text matched one Quran passage.",
      };
    return {
      status: "ambiguous",
      candidates,
      ignoredWords,
      message:
        "This phrase occurs in several places. Keep reciting or choose the passage.",
    };
  }
  return {
    status: "not-found",
    candidates: [],
    ignoredWords,
    message:
      "No confident text match yet. Keep reciting, or choose a surah manually.",
  };
}
