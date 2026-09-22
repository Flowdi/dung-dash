import { LEVELS } from "./levels.js";

export const ACHIEVEMENTS = Object.freeze([
  { id: "first-flush", name: "Erste Spülung", description: "Schließe dein erstes Level ab." },
  { id: "fly-hunter", name: "Fliegenjäger", description: "Sammle insgesamt 50 Fliegen." },
  { id: "combo-master", name: "Combo-Meister", description: "Erreiche eine ×4-Combo." },
  { id: "golden-pile", name: "Goldstück", description: "Verdiene eine Goldmedaille." },
  { id: "speed-runner", name: "Ab durch die Schüssel", description: "Beende ein Level in höchstens 60 Sekunden." },
  { id: "sure-footed", name: "Trittsicher", description: "Beende ein Level ohne einen Sturz." },
  { id: "campaign-complete", name: "König der Keramik", description: "Schließe die gesamte Kampagne ab." },
]);

export const findNewAchievements = (progress, result) => {
  const unlocked = new Set(progress.achievements ?? []);
  const qualifies = {
    "first-flush": progress.totalRuns >= 1,
    "fly-hunter": progress.totalFlies >= 50,
    "combo-master": result.bestCombo >= 4,
    "golden-pile": result.medal === "Gold",
    "speed-runner": result.elapsedSeconds <= 60,
    "sure-footed": result.falls === 0,
    "campaign-complete": LEVELS.every(({ id }) => progress.levelRecords?.[id]),
  };
  return ACHIEVEMENTS.filter(({ id }) => qualifies[id] && !unlocked.has(id));
};

export const achievementProgressText = (achievementId, progress) => {
  const completedLevels = Object.keys(progress.levelRecords ?? {}).length;
  const fastestTime = Object.values(progress.levelRecords ?? {})
    .reduce((fastest, record) => Math.min(fastest, record.bestTime ?? Infinity), Infinity);
  const values = {
    "first-flush": `${Math.min(progress.totalRuns ?? 0, 1)}/1 Level`,
    "fly-hunter": `${Math.min(progress.totalFlies ?? 0, 50)}/50 Fliegen`,
    "combo-master": "In einem Lauf ×4 erreichen",
    "golden-pile": `${Math.min(progress.medals?.Gold ?? 0, 1)}/1 Goldmedaille`,
    "speed-runner": fastestTime <= 60 ? "1/1 Speedrun" : "0/1 unter 60 Sekunden",
    "sure-footed": "Ein Level ohne Treffer",
    "campaign-complete": `${Math.min(completedLevels, LEVELS.length)}/${LEVELS.length} Level`,
  };
  return values[achievementId] ?? "";
};
