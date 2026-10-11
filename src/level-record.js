import { formatTime } from "./score.js";

export const buildLevelRecordStats = (record, missionTotal) => {
  if (!record) return null;
  const completedMissions = new Set(record.missions ?? []).size;
  return [
    ["Medaille", record.medal ?? "–"],
    ["Highscore", record.bestScore ?? 0],
    ["Bestzeit", record.bestTime == null ? "–" : formatTime(record.bestTime)],
    ["Beste Combo", `×${record.bestCombo ?? 0}`],
    ["Fehlerfrei", record.flawlessRuns ?? 0],
    ["Sterne", `${completedMissions}/${missionTotal}`],
  ];
};
