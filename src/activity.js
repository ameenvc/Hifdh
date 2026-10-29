export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDay(date, offset) {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}
export function activitySummary(activity, today = new Date()) {
  const days = Array.from({ length: 84 }, (_, index) => {
    const date = shiftDay(today, index - 83);
    const key = dateKey(date);
    return { date: key, ...(activity[key] || { seconds: 0, sessions: 0 }) };
  });
  let cursor = activity[dateKey(today)] ? today : shiftDay(today, -1);
  let streak = 0;
  while (activity[dateKey(cursor)]) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDay(today, index - 6);
    return {
      date: dateKey(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      seconds: activity[dateKey(date)]?.seconds || 0,
    };
  });
  return { days, streak, week };
}
