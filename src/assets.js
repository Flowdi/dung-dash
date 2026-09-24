const spriteSources = {
  player: "./assets/sprites/player.png",
  playerLeft: "./assets/sprites/player-left.png",
  playerRight: "./assets/sprites/player-right.png",
  fly: "./assets/sprites/fly.png",
  hazardsAtlas: "./assets/sprites/hazards-atlas.png",
  toilet: "./assets/sprites/toilet.png",
  platform: "./assets/sprites/platform.png",
  bathroomBackground: "./assets/themes/bathroom-background.png",
  bathroomAtlas: "./assets/themes/bathroom-atlas.png",
  sewerBackground: "./assets/themes/sewer-background.png",
  sewerAtlas: "./assets/themes/sewer-atlas.png",
  festivalBackground: "./assets/themes/festival-background.png",
  festivalAtlas: "./assets/themes/festival-atlas.png",
  royalBackground: "./assets/themes/royal-background.png",
  royalAtlas: "./assets/themes/royal-atlas.png",
  porcelainBackground: "./assets/themes/porcelain-background.png",
  porcelainAtlas: "./assets/themes/porcelain-atlas.png",
  pipeBackground: "./assets/themes/pipe-background.png",
  pipeAtlas: "./assets/themes/pipe-atlas.png",
};

export const loadSprites = (ImageConstructor = Image, onProgress = () => {}) => {
  const sprites = {};
  const total = Object.keys(spriteSources).length;
  let loaded = 0;
  const ready = Promise.all(
    Object.entries(spriteSources).map(([name, source]) =>
      new Promise((resolve, reject) => {
        const image = new ImageConstructor();
        sprites[name] = image;
        image.addEventListener("load", () => {
          loaded += 1;
          onProgress({ loaded, total, percent: Math.round(loaded / total * 100) });
          resolve();
        }, { once: true });
        image.addEventListener(
          "error",
          () => reject(new Error(`Sprite konnte nicht geladen werden: ${source}`)),
          { once: true }
        );
        image.src = source;
      })
    )
  );

  return { sprites, ready, total };
};
