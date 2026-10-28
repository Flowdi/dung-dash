export const compareProjectedScore = (projectedScore, bestScore) => {
  if (!(bestScore > 0)) return { hasRecord: false, ahead: false, text: "Noch kein Level-Highscore" };
  const delta = projectedScore - bestScore;
  if (delta === 0) return { hasRecord: true, ahead: false, text: "Highscore eingestellt" };
  return {
    hasRecord: true,
    ahead: delta > 0,
    text: `${delta > 0 ? "+" : "−"}${Math.abs(delta)} zum Highscore`,
  };
};
