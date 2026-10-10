const clamp = (value) => Math.max(0, Math.min(1, value));

export const calculateRouteProgress = (level) => {
  const goal = [...level.checkpoints].sort((a, b) => b.order - a.order)[0]?.position;
  if (!goal) return 0;
  const start = level.spawn;
  const current = level.player.position;
  const vertical = level.mode === "vertical";
  const distance = vertical ? start.y - goal.y : goal.x - start.x;
  const travelled = vertical ? start.y - current.y : current.x - start.x;
  return distance === 0 ? 0 : Math.round(clamp(travelled / distance) * 100);
};
