import { formatTimeDelta } from "./score.js";

export const compareCheckpointSplits = (splits = [], bestSplits = []) => splits.map((split) => {
  const best = bestSplits.find(({ order }) => order === split.order);
  if (!best) return { ...split, comparison: "Erste Zeit", improved: false };
  const delta = split.elapsedSeconds - best.elapsedSeconds;
  return {
    ...split,
    comparison: delta === 0 ? "PB eingestellt" : `PB ${formatTimeDelta(delta)}`,
    improved: delta < 0,
  };
});
