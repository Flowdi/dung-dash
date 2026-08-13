import { Blockade, CheckPoint, Fly, Platform, Player } from "./entities.js";
import { getLevelDefinition } from "./levels.js";

export const createLevel = (levelId) => {
  const definition = getLevelDefinition(levelId);
  return {
    id: definition.id,
    name: definition.name,
    width: definition.width,
    height: definition.height ?? 800,
    mode: definition.mode ?? "horizontal",
    player: new Player(definition.spawn, {
      worldWidth: definition.width,
      groundY: (definition.height ?? 800) - 40,
      jumpMode: definition.mode === "vertical" ? "charged" : "arcade",
    }),
    platforms: definition.platforms.map(([x, y, type = "normal"]) => new Platform(x, y, type)),
    blockades: definition.blockades.map(([x, y]) => new Blockade(x, y)),
    flies: definition.flies.map(([x, y, type = "normal"]) => new Fly(x, y, type)),
    checkpoints: definition.checkpoints.map(([x, y, order]) => new CheckPoint(x, y, order)),
  };
};
