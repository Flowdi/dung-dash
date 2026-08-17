export const LEVELS = Object.freeze([
  {
    id: "bathroom-run",
    name: "Badezimmer-Sprint",
    description: "Der klassische horizontale Lauf zur letzten Toilette.",
    theme: {
      background: "bathroomBackground",
      atlas: "bathroomAtlas",
      platformCrop: [0, 600, 850, 300],
      toiletCrop: [850, 250, 404, 680],
    },
    width: 5000,
    spawn: { x: 100, y: 400 },
    platforms: [
      [500, 450], [700, 400], [850, 350], [900, 350], [1050, 150],
      [2500, 450, "bounce"], [2900, 400], [3150, 350], [3900, 450],
      [4200, 400, "fragile"], [4400, 200], [4550, 200], [4700, 150],
    ],
    blockades: [[1210, -10], [2860, 240], [2860, 0], [4860, -10]],
    flies: [
      [550, 350], [700, 250], [1100, 450, "gold"], [1450, 350], [1800, 250],
      [2000, 450], [2300, 350], [2500, 150, "time"], [2875, 220], [3000, 450],
      [3250, 250], [3400, 450], [3600, 250], [3780, 750], [3900, 550],
      [4050, 600], [4300, 250], [4500, 100, "gold"], [4700, 20], [4800, 500],
    ],
    checkpoints: [[1170, 80, 1], [2900, 330, 2], [4800, 80, 3]],
  },
  {
    id: "sewer-shortcut",
    name: "Kanal-Kürzel",
    description: "Kürzer, aber mit Sprungpolstern und zerbrechlichen Steinen.",
    theme: {
      background: "sewerBackground",
      atlas: "sewerAtlas",
      platformCrop: [0, 560, 810, 310],
      toiletCrop: [800, 240, 454, 650],
    },
    width: 3600,
    spawn: { x: 80, y: 600 },
    platforms: [
      [380, 560], [650, 430, "bounce"], [930, 260], [1250, 430, "fragile"],
      [1550, 600], [1850, 420, "bounce"], [2200, 230], [2550, 420, "fragile"],
      [2900, 300], [3250, 160],
    ],
    blockades: [[1100, 560], [2350, 500], [3500, -10]],
    flies: [
      [450, 500], [700, 350], [980, 190, "gold"], [1300, 360], [1600, 530],
      [1900, 350, "time"], [2250, 160], [2600, 350], [2950, 230], [3300, 90, "gold"],
    ],
    checkpoints: [[1050, 490, 1], [2300, 430, 2], [3400, 90, 3]],
  },
  {
    id: "festival-flush",
    name: "Festival-Flucht",
    description: "Ein riskanter Expertenlauf mit wertvollen Fliegen.",
    theme: {
      background: "festivalBackground",
      atlas: "festivalAtlas",
      platformCrop: [0, 510, 930, 390],
      toiletCrop: [900, 230, 354, 680],
    },
    width: 4200,
    spawn: { x: 100, y: 680 },
    platforms: [
      [420, 600, "fragile"], [720, 460], [1050, 300, "bounce"], [1400, 180],
      [1750, 420, "fragile"], [2100, 260], [2450, 520, "bounce"], [2800, 330],
      [3150, 180, "fragile"], [3500, 380], [3850, 140],
    ],
    blockades: [[1550, 500], [3000, 420], [4100, -10]],
    flies: [
      [470, 530], [770, 390], [1100, 230, "gold"], [1450, 110, "gold"],
      [1800, 350], [2150, 190, "time"], [2500, 450], [2850, 260],
      [3200, 110, "gold"], [3550, 310], [3900, 70, "gold"],
    ],
    checkpoints: [[1500, 430, 1], [2950, 350, 2], [4000, 70, 3]],
  },
  {
    id: "royal-flush",
    name: "Royal Flush",
    description: "Vertikaler Aufstieg mit der direkten Steuerung aus den normalen Levels.",
    theme: {
      background: "royalBackground",
      atlas: "royalAtlas",
      platformCrop: [0, 500, 840, 360],
      toiletCrop: [820, 160, 434, 750],
    },
    mode: "vertical",
    width: 1000,
    height: 3200,
    spawn: { x: 100, y: 3100 },
    platforms: [
      [80, 3140], [360, 2980], [680, 2820], [300, 2640], [40, 2460],
      [430, 2290], [720, 2100], [360, 1900], [60, 1710], [500, 1510],
      [750, 1310], [380, 1110], [80, 900], [460, 690], [720, 470], [390, 250],
    ],
    blockades: [],
    flies: [
      [460, 2910], [780, 2750], [400, 2570, "gold"], [130, 2390],
      [530, 2220, "time"], [820, 2030], [460, 1830], [150, 1640, "gold"],
      [590, 1440], [840, 1240], [470, 1040], [170, 830], [550, 620], [810, 400, "gold"],
    ],
    checkpoints: [[790, 2040, 1], [120, 830, 2], [470, 180, 3]],
  },
]);

export const getLevelDefinition = (levelId) =>
  LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];
