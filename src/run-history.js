export const resolveReplayLevel = (levels, progress, levelId) =>
  levels.some(({ id }) => id === levelId) && progress.unlockedLevels.includes(levelId)
    ? levelId
    : null;
