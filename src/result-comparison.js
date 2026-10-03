import { formatTime } from "./score.js";

export const compareRunWithRecord = (result, previousRecord) => {
  if (!previousRecord) return null;
  const scoreDelta = result.score - (previousRecord.bestScore ?? 0);
  const timeDelta = previousRecord.bestTime == null ? null : previousRecord.bestTime - result.elapsedSeconds;
  return {
    score: {
      improved: scoreDelta > 0,
      text: scoreDelta === 0 ? "Highscore eingestellt" : `${scoreDelta > 0 ? "+" : "−"}${Math.abs(scoreDelta)} Punkte`,
    },
    time: timeDelta === null ? null : {
      improved: timeDelta > 0,
      text: timeDelta === 0
        ? "Bestzeit eingestellt"
        : `${formatTime(Math.abs(timeDelta))} ${timeDelta > 0 ? "schneller" : "langsamer"}`,
    },
  };
};
