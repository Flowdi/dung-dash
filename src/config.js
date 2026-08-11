export const WORLD_HEIGHT = 800;
export const LEVEL_WIDTH = 5000;
export const GROUND_HEIGHT = 40;
export const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
export const GRAVITY = 2200;
export const MOVE_SPEED = 300;
export const JUMP_SPEED = 1650;
export const COYOTE_TIME = 0.12;
export const JUMP_BUFFER_TIME = 0.12;
export const MAX_FRAME_TIME = 0.05;

export const GameState = Object.freeze({
  READY: "ready",
  PLAYING: "playing",
  FINISHED: "finished",
  ERROR: "error",
});

export const calculateViewport = (width, height, pixelRatio = 1) => {
  const renderScale = Math.min(1, height / WORLD_HEIGHT);
  return {
    devicePixelRatio: Math.min(pixelRatio || 1, 2),
    renderScale,
    viewportWidth: width / renderScale,
    viewportHeight: height / renderScale,
  };
};
