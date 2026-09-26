export const supportsFullscreen = (documentObject) =>
  Boolean(documentObject?.documentElement?.requestFullscreen && documentObject?.exitFullscreen);

export const fullscreenButtonLabel = (isFullscreen) =>
  isFullscreen ? "Vollbild verlassen" : "Vollbild";
