import { formatTime } from "./score.js";

export const buildLevelRecordStats = (record, missionTotal) => {
  if (!record) return null;
  const completedMissions = new Set(record.missions ?? []).size;
  return [
    ["Medaille", record.medal ?? "–"],
    ["Highscore", record.bestScore ?? 0],
    ["Bestzeit", record.bestTime == null ? "–" : formatTime(record.bestTime)],
    ["Sterne", `${completedMissions}/${missionTotal}`],
  ];
};
