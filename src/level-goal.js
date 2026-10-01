export const describeNextLevelGoal = (level, record) => {
  if (!record) return "Erstes Ziel: Level abschließen";
  const completed = new Set(record.missions ?? []);
  const nextMission = level.missions.find(({ id }) => !completed.has(id));
  if (nextMission) return `Nächstes Ziel: ${nextMission.label}`;
  if (record.medal !== "Gold") return "Nächstes Ziel: Goldmedaille holen";
  return "Alle Ziele dieses Levels erreicht";
};
