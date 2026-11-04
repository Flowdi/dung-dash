export const isLevelMastered = (level, record) => Boolean(record) &&
  record.medal === "Gold" &&
  new Set(record.missions ?? []).size >= level.missions.length &&
  (record.bestFlies ?? 0) >= level.flies.length;

export const calculateMasteryProgress = (progress, levels) => {
  const masteredLevels = levels.filter((level) => isLevelMastered(level, progress.levelRecords?.[level.id])).length;
  const totalLevels = levels.length;
  const percent = totalLevels === 0 ? 0 : Math.round((masteredLevels / totalLevels) * 100);
  return { masteredLevels, totalLevels, percent };
};

export const levelMasteryLabel = (level, record) =>
  isLevelMastered(level, record) ? "🏆 Level gemeistert" : "Meisterschaft noch offen";
