export function normalize(text) {
  return text.normalize('NFD').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ـ/g, '').replace(/[^\u0621-\u064a\s]/g, '').trim();
}
export function compareWords(expected, spoken) {
  const target = expected.trim().split(/\s+/);
  const actual = normalize(spoken).split(/\s+/).filter(Boolean);
  return target.map((word, i) => !actual[i] ? 'pending' : normalize(word) === actual[i] ? 'correct' : 'mistake');
}
