export const updatePerfectStreak = (current, best, perfect) => {
  const nextCurrent = perfect ? Math.max(0, Number(current) || 0) + 1 : 0;
  return {
    current: nextCurrent,
    best: Math.max(Math.max(0, Number(best) || 0), nextCurrent),
  };
};
