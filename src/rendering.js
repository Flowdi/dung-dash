const clamp01 = (value) => Math.max(0, Math.min(1, value));

export const calculateCoverRect = (
  imageWidth,
  imageHeight,
  viewportWidth,
  viewportHeight,
  progressX = 0,
  progressY = 0
) => {
  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const offsetX = (width - viewportWidth) * clamp01(progressX);
  const offsetY = (height - viewportHeight) * clamp01(progressY);
  return {
    x: offsetX === 0 ? 0 : -offsetX,
    y: offsetY === 0 ? 0 : -offsetY,
    width,
    height,
  };
};
