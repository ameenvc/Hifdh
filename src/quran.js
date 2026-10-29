import text from "./data/uthmani.json" with { type: "json" };
import metadata from "./data/chapters.json" with { type: "json" };

// Tanzil Uthmani text is retained verbatim in data/uthmani.json. Only the
// presentation splits the opening Bismillah from the rest of the first ayah.
export const BISMILLAH = text["1"][0].text;
export const SURAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];
export const surahs = metadata.chapters.map((chapter) => ({
  number: chapter.id,
  name: chapter.name,
  englishName: chapter.transliteration,
  numberOfAyahs: chapter.total_verses,
}));

export function chapter(number) {
  const rows = text[String(number)];
  if (!rows) throw new Error("Unknown surah");
  const offset = SURAH_COUNTS.slice(0, number - 1).reduce(
    (sum, n) => sum + n,
    0,
  );
  return {
    number,
    verses: rows.map((row) => row.text),
    ayahNumbers: rows.map((row) => offset + row.verse),
  };
}
// Exactly four whitespace-delimited words, including the source's shadda on
// the opening ba in 95 and 97. The source characters themselves are unchanged.
export function splitOpening(surah, firstVerse) {
  if (surah === 9) return { bismillah: null, verse: firstVerse };
  if (surah === 1) return { bismillah: firstVerse, verse: "", number: 1 };
  const words = firstVerse.split(" ");
  return {
    bismillah: words.slice(0, 4).join(" "),
    verse: words.slice(4).join(" "),
  };
}
export function practiceText(surah, index, verse) {
  return index === 0 && surah !== 1 && surah !== 9
    ? splitOpening(surah, verse).verse
    : verse;
}
export function searchQuran(query, normalize) {
  const phrase = normalize(query).replace(/\s+/g, " ");
  if (phrase.length < 2) return [];
  const matches = [];
  for (const surah of surahs) {
    for (const verse of text[String(surah.number)]) {
      const value = practiceText(surah.number, verse.verse - 1, verse.text);
      if (normalize(value).replace(/\s+/g, " ").includes(phrase))
        matches.push({ surah, numberInSurah: verse.verse, text: value });
    }
  }
  return matches;
}

// The unnumbered opening may be recited before ayah 1. It is not an extra word
// error, but it must never be stripped from Fatiha 1:1 or from a later ayah.
export function ayahTranscript(surah, index, spoken, normalize) {
  if (index !== 0 || surah === 1 || surah === 9) return spoken;
  const words = spoken.trim().split(/\s+/),
    opening = normalize(BISMILLAH).split(/\s+/);
  if (
    words.length >= 4 &&
    words.slice(0, 4).every((word, i) => normalize(word) === opening[i])
  )
    return words.slice(4).join(" ");
  return spoken;
}
