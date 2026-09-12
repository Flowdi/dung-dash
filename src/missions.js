import { formatTime } from "./score.js";

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

export const formatMissionProgress = (mission, stats) => {
  if (mission.type === "flies") return `${stats.fliesCollected}/${mission.target} Fliegen`;
  if (mission.type === "time") return `${formatTime(stats.elapsedSeconds)}/${formatTime(mission.target)}`;
  if (mission.type === "combo") return `×${stats.bestCombo}/×${mission.target}`;
  if (mission.type === "score") return `${stats.flyScore}/${mission.target} Punkte`;
  return mission.label;
};
