export const ACHIEVEMENTS = Object.freeze([
  { id: "first-flush", name: "Erste Spülung", description: "Schließe dein erstes Level ab." },
  { id: "fly-hunter", name: "Fliegenjäger", description: "Sammle insgesamt 50 Fliegen." },
  { id: "combo-master", name: "Combo-Meister", description: "Erreiche eine ×4-Combo." },
  { id: "golden-pile", name: "Goldstück", description: "Verdiene eine Goldmedaille." },
  { id: "speed-runner", name: "Ab durch die Schüssel", description: "Beende ein Level in höchstens 60 Sekunden." },
  { id: "sure-footed", name: "Trittsicher", description: "Beende ein Level ohne einen Sturz." },
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
  };
  return ACHIEVEMENTS.filter(({ id }) => qualifies[id] && !unlocked.has(id));
};
