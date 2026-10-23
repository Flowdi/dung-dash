export const calculateCollectionProgress = (collected, total) => ({
  percent: total <= 0 ? 100 : Math.round(Math.max(0, Math.min(1, collected / total)) * 100),
  complete: total <= 0 || collected >= total,
});
