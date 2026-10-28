import { calculateScoreBreakdown } from "./score.js";

export const calculateProjectedScore = (stats, totalFlies) => calculateScoreBreakdown({
  elapsedSeconds: stats.elapsedSeconds,
  fliesCollected: stats.fliesCollected,
  totalFlies,
  falls: stats.falls,
  flyScore: stats.flyScore,
}).total;
