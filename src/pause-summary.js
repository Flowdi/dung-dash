import { formatTime } from "./score.js";
import { calculateRouteProgress } from "./route-progress.js";
import { calculateCheckpointProgress } from "./checkpoint-progress.js";

export const buildPauseSummary = (level, stats) => {
  const checkpoints = calculateCheckpointProgress(level.checkpoints);
  return [
    `Zeit ${formatTime(stats.elapsedSeconds)}`,
    `Fliegen ${stats.fliesCollected}/${level.flies.length}`,
    `Toiletten ${checkpoints.reached}/${checkpoints.total}`,
    `Strecke ${calculateRouteProgress(level)}%`,
    `Treffer ${stats.falls}`,
  ].join(" · ");
};
