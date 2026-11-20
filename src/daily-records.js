export const updateDailyRecords = (progress, result, isDaily) => {
  if (!isDaily) return {
    bestScore: progress.bestDailyScore ?? 0,
    bestTime: progress.bestDailyTime ?? null,
    scoreRecords: progress.dailyScoreRecords ?? 0,
    timeRecords: progress.dailyTimeRecords ?? 0,
    flags: { score: false, time: false },
  };
  const score = Math.max(0, Number(result.score) || 0);
  const time = Math.max(0, Number(result.elapsedSeconds) || 0);
  const scoreImproved = score > (progress.bestDailyScore ?? 0);
  const timeImproved = progress.bestDailyTime == null || time < progress.bestDailyTime;
  return {
    bestScore: Math.max(progress.bestDailyScore ?? 0, score),
    bestTime: progress.bestDailyTime == null ? time : Math.min(progress.bestDailyTime, time),
    scoreRecords: (progress.dailyScoreRecords ?? 0) + (scoreImproved ? 1 : 0),
    timeRecords: (progress.dailyTimeRecords ?? 0) + (timeImproved ? 1 : 0),
    flags: { score: scoreImproved, time: timeImproved },
  };
};
