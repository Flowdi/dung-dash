export const calculateCareerAverages = (progress) => {
  const runs = Math.max(0, Number(progress.totalRuns) || 0);
  if (runs === 0) return { score: 0, falls: 0 };
  return {
    score: Math.round((Number(progress.totalScore) || 0) / runs),
    falls: Math.round(((Number(progress.totalFalls) || 0) / runs) * 10) / 10,
  };
};
