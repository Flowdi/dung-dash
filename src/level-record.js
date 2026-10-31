import { formatTime } from "./score.js";
import { calculateBestCollection } from "./collection-mastery.js";

export const buildLevelRecordStats = (record, missionTotal, totalFlies = 0) => {
  if (!record) return null;
  const completedMissions = new Set(record.missions ?? []).size;
  const collection = calculateBestCollection(record.bestFlies, totalFlies);
  return [
    ["Medaille", record.medal ?? "–"],
    ["Highscore", record.bestScore ?? 0],
    ["Bestzeit", record.bestTime == null ? "–" : formatTime(record.bestTime)],
    ["Beste Combo", `×${record.bestCombo ?? 0}`],
    ["Beste Sammelquote", `${collection.collected}/${totalFlies} · ${collection.percent}%`],
    ["Fehlerfrei", record.flawlessRuns ?? 0],
    ["Versuche", record.attempts ?? 1],
    ["Sterne", `${completedMissions}/${missionTotal}`],
  ];
};
