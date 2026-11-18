const hashDate = (dateKey) => [...String(dateKey)].reduce((hash, character) =>
  Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);

export const chooseDailyLevel = (levels, unlockedLevelIds, dateKey) => {
  const unlocked = new Set(unlockedLevelIds ?? []);
  const available = levels.filter(({ id }) => unlocked.has(id));
  if (available.length === 0) return null;
  return available[hashDate(dateKey) % available.length].id;
};

export const updateDailyCompletions = (count, lastDate, completedDate) => ({
  count: Math.max(0, Number(count) || 0) + (completedDate && completedDate !== lastDate ? 1 : 0),
  lastDate: completedDate || lastDate || null,
});

export const dailyLevelButtonLabel = (levelName, completed) =>
  `${completed ? "✓ " : ""}Tageslevel: ${levelName ?? "nicht verfügbar"}`;

export const dailyCompletionText = (dailyDate, previousDate) => {
  if (!dailyDate) return "";
  return dailyDate === previousDate ? " · Tageslevel erneut geschafft" : " · Tageslevel abgeschlossen!";
};

export const updatePerfectDailyCompletions = (count, lastDate, dailyDate, perfect) => ({
  count: Math.max(0, Number(count) || 0) + (perfect && dailyDate && dailyDate !== lastDate ? 1 : 0),
  lastDate: perfect && dailyDate ? dailyDate : lastDate ?? null,
});
