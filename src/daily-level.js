const hashDate = (dateKey) => [...String(dateKey)].reduce((hash, character) =>
  Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);

export const chooseDailyLevel = (levels, unlockedLevelIds, dateKey) => {
  const unlocked = new Set(unlockedLevelIds ?? []);
  const available = levels.filter(({ id }) => unlocked.has(id));
  if (available.length === 0) return null;
  return available[hashDate(dateKey) % available.length].id;
};
