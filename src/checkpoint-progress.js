export const calculateCheckpointProgress = (checkpoints = []) => ({
  reached: checkpoints.filter(({ claimed }) => claimed).length,
  total: checkpoints.length,
});
