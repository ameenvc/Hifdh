import { chapter, practiceText } from "./quran.js";
export function makeChallenge(surah, verse, style = "next") {
  const data = chapter(surah);
  if (!Number.isInteger(verse) || verse < 0 || verse >= data.verses.length)
    throw new RangeError("Choose an ayah in this surah");
  const cue = practiceText(surah, verse, data.verses[verse]);
  if (style === "finish") {
    const count = cue.split(/\s+/).length;
    if (count < 2)
      throw new RangeError(
        "This ayah is too short for a partial-ayah exercise. Choose another ayah.",
      );
    return {
      surah,
      cueVerse: verse,
      targetVerse: verse,
      style,
      cueWords: Math.min(4, Math.max(1, Math.floor(count / 2))),
      cue,
    };
  }
  if (verse === data.verses.length - 1)
    throw new RangeError(
      "Choose an earlier ayah so there is a following ayah to recite.",
    );
  return {
    surah,
    cueVerse: verse,
    targetVerse: verse + 1,
    style: "next",
    cueWords: 0,
    cue,
  };
}
