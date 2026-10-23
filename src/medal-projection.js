import { calculateMedal } from "./score.js";

export const projectCurrentMedal = (stats, totalFlies) => calculateMedal({
  elapsedSeconds: stats.elapsedSeconds,
  fliesCollected: stats.fliesCollected,
  totalFlies,
  falls: stats.falls,
});
