export const evaluateMissions = (missions, result) => missions.map((mission) => ({
  ...mission,
  completed: mission.type === "time"
    ? result.elapsedSeconds <= mission.target
    : mission.type === "flies"
      ? result.fliesCollected >= mission.target
      : mission.type === "combo"
        ? result.bestCombo >= mission.target
        : mission.type === "score"
          ? result.score >= mission.target
          : false,
}));

export const completedMissionIds = (missions, result) =>
  evaluateMissions(missions, result).filter(({ completed }) => completed).map(({ id }) => id);
