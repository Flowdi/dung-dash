export const chooseRandomUnlockedLevel = (levels, unlockedLevelIds, currentLevelId, random = Math.random) => {
  const unlocked = levels.filter(({ id }) => unlockedLevelIds.includes(id));
  const candidates = unlocked.length > 1
    ? unlocked.filter(({ id }) => id !== currentLevelId)
    : unlocked;
  if (candidates.length === 0) return levels[0]?.id ?? null;
  return candidates[Math.floor(random() * candidates.length)]?.id ?? candidates[0].id;
};
