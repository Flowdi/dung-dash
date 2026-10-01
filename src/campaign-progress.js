export const calculateCampaignProgress = (progress, levels) => {
  const completedLevels = levels.filter(({ id }) => Boolean(progress.levelRecords?.[id])).length;
  const totalLevels = levels.length;
  const percent = totalLevels === 0 ? 0 : Math.round((completedLevels / totalLevels) * 100);
  return { completedLevels, totalLevels, percent };
};
