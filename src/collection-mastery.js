export const calculateBestCollection = (collected, total) => {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeCollected = Math.min(safeTotal, Math.max(0, Number(collected) || 0));
  return {
    collected: safeCollected,
    percent: safeTotal === 0 ? 0 : Math.round((safeCollected / safeTotal) * 100),
    complete: safeTotal > 0 && safeCollected === safeTotal,
  };
};
