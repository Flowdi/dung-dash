export const analyzeRun = (result) => ({
  collectionPercent: result.totalFlies === 0
    ? 100
    : Math.round((result.fliesCollected / result.totalFlies) * 100),
  bestCombo: Math.max(0, Number(result.bestCombo) || 0),
  flawless: result.falls === 0,
});
