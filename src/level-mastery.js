export const isLevelMastered = (level, record) => Boolean(record) &&
  record.medal === "Gold" &&
  new Set(record.missions ?? []).size >= level.missions.length &&
  (record.bestFlies ?? 0) >= level.flies.length;

export const calculateMasteryProgress = (progress, levels) => {
  const masteredLevels = levels.filter((level) => isLevelMastered(level, progress.levelRecords?.[level.id])).length;
  return { masteredLevels, totalLevels: levels.length };
};
