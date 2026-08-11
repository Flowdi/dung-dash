const spriteSources = {
  player: "./assets/sprites/player.png",
  playerLeft: "./assets/sprites/player-left.png",
  playerRight: "./assets/sprites/player-right.png",
  fly: "./assets/sprites/fly.png",
  toilet: "./assets/sprites/toilet.png",
  platform: "./assets/sprites/platform.png",
};

export const loadSprites = (ImageConstructor = Image) => {
  const sprites = {};
  const ready = Promise.all(
    Object.entries(spriteSources).map(([name, source]) =>
      new Promise((resolve, reject) => {
        const image = new ImageConstructor();
        sprites[name] = image;
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener(
          "error",
          () => reject(new Error(`Sprite konnte nicht geladen werden: ${source}`)),
          { once: true }
        );
        image.src = source;
      })
    )
  );

  return { sprites, ready };
};
