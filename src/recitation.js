export function normalize(text) {
  return text.normalize('NFD').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ـ/g, '').replace(/[^\u0621-\u064a\s]/g, '').trim();
}
// Align the spoken words against a prefix of the ayah. An omitted or repeated
// word should not cause every later word to be marked as a substitution.
export function compareRecitation(expected, spoken) {
  const target = expected.trim().split(/\s+/).map(normalize);
  const actual = normalize(spoken).split(/\s+/).filter(Boolean);
  const statuses = target.map(() => 'pending');
  const dp = Array.from({length: target.length + 1}, (_, i) =>
    Array.from({length: actual.length + 1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      dp[i][j] = Math.min(dp[i-1][j-1] + (target[i-1] === actual[j-1] ? 0 : 1), dp[i-1][j] + 1, dp[i][j-1] + 1);
    }
  }
  let end = 0;
  for (let i = 1; i <= target.length; i++) {
    if (dp[i][actual.length] <= dp[end][actual.length]) end = i;
  }
  let i = end, j = actual.length, extraWords = 0;
  while (i > 0 || j > 0) {
    if (i && j && dp[i][j] === dp[i-1][j-1] + (target[i-1] === actual[j-1] ? 0 : 1)) {
      statuses[i-1] = target[i-1] === actual[j-1] ? 'correct' : 'mistake'; i--; j--;
    } else if (i && dp[i][j] === dp[i-1][j] + 1) {
      statuses[--i] = 'mistake';
    } else { extraWords++; j--; }
  }
  return { statuses, extraWords, complete: statuses.every(s => s === 'correct') && extraWords === 0 };
}
export function compareWords(expected, spoken) {
  return compareRecitation(expected, spoken).statuses;
}
