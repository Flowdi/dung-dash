const hashDate = (dateKey) => [...String(dateKey)].reduce((hash, character) =>
  Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);

export const chooseDailyLevel = (levels, unlockedLevelIds, dateKey) => {
  const unlocked = new Set(unlockedLevelIds ?? []);
  const available = levels.filter(({ id }) => unlocked.has(id));
  if (available.length === 0) return null;
  return available[hashDate(dateKey) % available.length].id;
};

export const updateDailyCompletions = (count, lastDate, completedDate) => {
  const advanced = Boolean(completedDate && (!lastDate || completedDate > lastDate));
  return {
    count: Math.max(0, Number(count) || 0) + Number(advanced),
    lastDate: advanced ? completedDate : lastDate ?? null,
  };
};

export const dailyLevelButtonLabel = (levelName, completed, streak = 0) =>
  `${completed ? "✓ " : ""}Tageslevel: ${levelName ?? "nicht verfügbar"}` +
  (streak > 0 ? ` · Serie ${streak}` : "");

export const dailyCompletionText = (dailyDate, previousDate) => {
  if (!dailyDate) return "";
  if (previousDate && dailyDate < previousDate) return " · Älteres Tageslevel geschafft (ohne Serienwertung)";
  return dailyDate === previousDate ? " · Tageslevel erneut geschafft" : " · Tageslevel abgeschlossen!";
};

export const updatePerfectDailyCompletions = (count, lastDate, dailyDate, perfect) =>
  updateDailyCompletions(count, lastDate, perfect ? dailyDate : null);

const dateDistance = (from, to) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;

export const visibleDailyStreak = (current, lastDate, today) => {
  const distance = dateDistance(lastDate, today);
  return distance === 0 || distance === 1 ? current : 0;
};

export const updateDailyCompletionStreak = (current, best, lastDate, dailyDate) => {
  const safeCurrent = Math.max(0, Number(current) || 0);
  const safeBest = Math.max(safeCurrent, Number(best) || 0);
  if (!dailyDate) return { current: safeCurrent, best: safeBest };
  const distance = lastDate ? dateDistance(lastDate, dailyDate) : null;
  const nextCurrent = distance !== null && distance <= 0 ? safeCurrent : distance === 1 ? safeCurrent + 1 : 1;
  return { current: nextCurrent, best: Math.max(safeBest, nextCurrent) };
};
