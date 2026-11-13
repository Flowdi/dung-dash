import { LEVELS } from "./levels.js";
import { isLevelMastered } from "./level-mastery.js";

export const ACHIEVEMENTS = Object.freeze([
  { id: "first-flush", name: "Erste Spülung", description: "Schließe dein erstes Level ab." },
  { id: "fly-hunter", name: "Fliegenjäger", description: "Sammle insgesamt 50 Fliegen." },
  { id: "combo-master", name: "Combo-Meister", description: "Erreiche eine ×4-Combo." },
  { id: "golden-pile", name: "Goldstück", description: "Verdiene eine Goldmedaille." },
  { id: "speed-runner", name: "Ab durch die Schüssel", description: "Beende ein Level in höchstens 60 Sekunden." },
  { id: "sure-footed", name: "Trittsicher", description: "Beende ein Level ohne einen Sturz." },
  { id: "campaign-complete", name: "König der Keramik", description: "Schließe die gesamte Kampagne ab." },
  { id: "long-haul", name: "Dauerspülung", description: "Spiele insgesamt 30 Minuten." },
  { id: "spotless-five", name: "Saubere Serie", description: "Schließe fünf Läufe fehlerfrei ab." },
  { id: "all-stars", name: "Sternenhimmel", description: "Schließe alle Level-Missionen ab." },
  { id: "perfect-pile", name: "Makelloser Haufen", description: "Schaffe einen perfekten Lauf." },
  { id: "master-one", name: "Level-Legende", description: "Meistere ein Level vollständig." },
  { id: "perfect-three", name: "Dreifach sauber", description: "Schaffe drei perfekte Läufe in Folge." },
  { id: "record-chaser", name: "Rekordjäger", description: "Stelle zehn persönliche Rekorde auf." },
  { id: "week-regular", name: "Stammgast", description: "Spiele an sieben verschiedenen Tagen." },
]);

export const findNewAchievements = (progress, result) => {
  const unlocked = new Set(progress.achievements ?? []);
  const completedMissions = Object.values(progress.levelRecords ?? {})
    .reduce((total, record) => total + new Set(record.missions ?? []).size, 0);
  const qualifies = {
    "first-flush": progress.totalRuns >= 1,
    "fly-hunter": progress.totalFlies >= 50,
    "combo-master": result.bestCombo >= 4,
    "golden-pile": result.medal === "Gold",
    "speed-runner": result.elapsedSeconds <= 60,
    "sure-footed": result.falls === 0,
    "campaign-complete": LEVELS.every(({ id }) => progress.levelRecords?.[id]),
    "long-haul": progress.totalPlayTime >= 30 * 60,
    "spotless-five": progress.flawlessRuns >= 5,
    "all-stars": completedMissions >= LEVELS.reduce((total, level) => total + level.missions.length, 0),
    "perfect-pile": progress.perfectRuns >= 1,
    "master-one": LEVELS.some((level) => isLevelMastered(level, progress.levelRecords?.[level.id])),
    "perfect-three": progress.bestPerfectStreak >= 3,
    "record-chaser": (progress.scoreRecords ?? 0) + (progress.timeRecords ?? 0) >= 10,
    "week-regular": progress.activeDays >= 7,
  };
  return ACHIEVEMENTS.filter(({ id }) => qualifies[id] && !unlocked.has(id));
};

export const achievementProgressText = (achievementId, progress) => {
  const completedLevels = Object.keys(progress.levelRecords ?? {}).length;
  const fastestTime = Object.values(progress.levelRecords ?? {})
    .reduce((fastest, record) => Math.min(fastest, record.bestTime ?? Infinity), Infinity);
  const completedMissions = Object.values(progress.levelRecords ?? {})
    .reduce((total, record) => total + new Set(record.missions ?? []).size, 0);
  const missionTotal = LEVELS.reduce((total, level) => total + level.missions.length, 0);
  const values = {
    "first-flush": `${Math.min(progress.totalRuns ?? 0, 1)}/1 Level`,
    "fly-hunter": `${Math.min(progress.totalFlies ?? 0, 50)}/50 Fliegen`,
    "combo-master": "In einem Lauf ×4 erreichen",
    "golden-pile": `${Math.min(progress.medals?.Gold ?? 0, 1)}/1 Goldmedaille`,
    "speed-runner": fastestTime <= 60 ? "1/1 Speedrun" : "0/1 unter 60 Sekunden",
    "sure-footed": "Ein Level ohne Treffer",
    "campaign-complete": `${Math.min(completedLevels, LEVELS.length)}/${LEVELS.length} Level`,
    "long-haul": `${Math.min(Math.floor((progress.totalPlayTime ?? 0) / 60), 30)}/30 Minuten`,
    "spotless-five": `${Math.min(progress.flawlessRuns ?? 0, 5)}/5 fehlerfreie Läufe`,
    "all-stars": `${Math.min(completedMissions, missionTotal)}/${missionTotal} Sterne`,
    "perfect-pile": `${Math.min(progress.perfectRuns ?? 0, 1)}/1 perfekter Lauf`,
    "master-one": `${Math.min(LEVELS.filter((level) => isLevelMastered(level, progress.levelRecords?.[level.id])).length, 1)}/1 gemeistertes Level`,
    "perfect-three": `${Math.min(progress.bestPerfectStreak ?? 0, 3)}/3 perfekte Läufe in Folge`,
    "record-chaser": `${Math.min((progress.scoreRecords ?? 0) + (progress.timeRecords ?? 0), 10)}/10 persönliche Rekorde`,
    "week-regular": `${Math.min(progress.activeDays ?? 0, 7)}/7 aktive Tage`,
  };
  return values[achievementId] ?? "";
};
