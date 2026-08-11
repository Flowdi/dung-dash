import { Blockade, CheckPoint, Fly, Platform, Player } from "./entities.js";

const platformPositions = [
  [500, 450], [700, 400], [850, 350], [900, 350], [1050, 150],
  [2500, 450], [2900, 400], [3150, 350], [3900, 450], [4200, 400],
  [4400, 200], [4550, 200], [4700, 150],
];

const blockadePositions = [[1210, -10], [2860, 240], [2860, 0], [4860, -10]];

const flyPositions = [
  [550, 350], [700, 250], [1100, 450], [1450, 350], [1800, 250],
  [2000, 450], [2300, 350], [2500, 150], [2875, 220], [3000, 450],
  [3250, 250], [3400, 450], [3600, 250], [3780, 750], [3900, 550],
  [4050, 600], [4300, 250], [4500, 100], [4700, 20], [4800, 500],
];

const checkpointPositions = [[1170, 80, 1], [2900, 330, 2], [4800, 80, 3]];

export const createLevel = () => ({
  player: new Player(),
  platforms: platformPositions.map(([x, y]) => new Platform(x, y)),
  blockades: blockadePositions.map(([x, y]) => new Blockade(x, y)),
  flies: flyPositions.map(([x, y]) => new Fly(x, y)),
  checkpoints: checkpointPositions.map(([x, y, order]) => new CheckPoint(x, y, order)),
});
