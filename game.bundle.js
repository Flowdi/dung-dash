(() => {
  // src/config.js
  var WORLD_HEIGHT = 800;
  var LEVEL_WIDTH = 5e3;
  var GROUND_HEIGHT = 40;
  var GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
  var GRAVITY = 2200;
  var MOVE_SPEED = 300;
  var JUMP_SPEED = 1650;
  var COYOTE_TIME = 0.12;
  var JUMP_BUFFER_TIME = 0.12;
  var MAX_FRAME_TIME = 0.05;
  var GameState = Object.freeze({
    READY: "ready",
    PLAYING: "playing",
    PAUSED: "paused",
    FINISHED: "finished",
    ERROR: "error"
  });
  var calculateViewport = (width, height, pixelRatio = 1) => {
    const renderScale = Math.min(1, height / WORLD_HEIGHT);
    return {
      devicePixelRatio: Math.min(pixelRatio || 1, 2),
      renderScale,
      viewportWidth: width / renderScale,
      viewportHeight: height / renderScale
    };
  };

  // src/assets.js
  var spriteSources = {
    player: "./assets/sprites/player.png",
    playerLeft: "./assets/sprites/player-left.png",
    playerRight: "./assets/sprites/player-right.png",
    fly: "./assets/sprites/fly.png",
    toilet: "./assets/sprites/toilet.png",
    platform: "./assets/sprites/platform.png",
    bathroomBackground: "./assets/themes/bathroom-background.png",
    bathroomAtlas: "./assets/themes/bathroom-atlas.png",
    sewerBackground: "./assets/themes/sewer-background.png",
    sewerAtlas: "./assets/themes/sewer-atlas.png",
    festivalBackground: "./assets/themes/festival-background.png",
    festivalAtlas: "./assets/themes/festival-atlas.png",
    royalBackground: "./assets/themes/royal-background.png",
    royalAtlas: "./assets/themes/royal-atlas.png"
  };
  var loadSprites = (ImageConstructor = Image) => {
    const sprites = {};
    const ready = Promise.all(
      Object.entries(spriteSources).map(
        ([name, source]) => new Promise((resolve, reject) => {
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

  // src/input.js
  var InputController = class {
    constructor() {
      this.left = false;
      this.right = false;
      this.jumpBufferRemaining = 0;
    }
    get hasBufferedJump() {
      return this.jumpBufferRemaining > 0;
    }
    queueJump() {
      this.jumpBufferRemaining = JUMP_BUFFER_TIME;
    }
    consumeJump() {
      this.jumpBufferRemaining = 0;
    }
    tick(deltaTime) {
      this.jumpBufferRemaining = Math.max(0, this.jumpBufferRemaining - deltaTime);
    }
    reset() {
      this.left = false;
      this.right = false;
      this.jumpBufferRemaining = 0;
    }
    bind(windowObject, touchControls = [], { onPause = () => {
    } } = {}) {
      windowObject.addEventListener("keydown", (event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Escape"].includes(event.key)) {
          event.preventDefault();
        }
        if (event.key === "ArrowLeft") this.left = true;
        if (event.key === "ArrowRight") this.right = true;
        if (!event.repeat && (event.key === "Escape" || event.key.toLowerCase() === "p")) {
          onPause();
        }
        if (!event.repeat && (event.key === "ArrowUp" || event.key === " " || event.code === "Space")) {
          this.queueJump();
        }
      });
      windowObject.addEventListener("keyup", (event) => {
        if (event.key === "ArrowLeft") this.left = false;
        if (event.key === "ArrowRight") this.right = false;
      });
      windowObject.addEventListener("blur", () => this.reset());
      touchControls.forEach((button) => {
        const control = button.dataset.control;
        const press = (event) => {
          var _a;
          event.preventDefault();
          (_a = button.setPointerCapture) == null ? void 0 : _a.call(button, event.pointerId);
          if (control === "left") this.left = true;
          if (control === "right") this.right = true;
          if (control === "jump") this.queueJump();
        };
        const release = (event) => {
          event.preventDefault();
          if (control === "left") this.left = false;
          if (control === "right") this.right = false;
        };
        button.addEventListener("pointerdown", press);
        button.addEventListener("pointerup", release);
        button.addEventListener("pointercancel", release);
        button.addEventListener("pointerleave", release);
      });
    }
  };

  // src/entities.js
  var drawThemeSprite = (ctx, sprites, theme, cropName, fallbackName, x, y, width, height) => {
    const atlas = (theme == null ? void 0 : theme.atlas) ? sprites[theme.atlas] : null;
    const crop = theme == null ? void 0 : theme[cropName];
    if (atlas && crop) {
      ctx.drawImage(atlas, ...crop, x, y, width, height);
    } else {
      ctx.drawImage(sprites[fallbackName], x, y, width, height);
    }
  };
  var Player = class {
    constructor(spawn = { x: 100, y: 400 }, options = {}) {
      var _a, _b;
      this.position = { ...spawn };
      this.previousPosition = { ...this.position };
      this.velocity = { x: 0, y: 0 };
      this.width = 40;
      this.height = 40;
      this.isGrounded = false;
      this.coyoteTimeRemaining = 0;
      this.lookDirection = "neutral";
      this.worldWidth = (_a = options.worldWidth) != null ? _a : LEVEL_WIDTH;
      this.groundY = (_b = options.groundY) != null ? _b : GROUND_Y;
      this.supportPlatform = null;
    }
    followSupportPlatform() {
      var _a;
      if (!((_a = this.supportPlatform) == null ? void 0 : _a.active)) return;
      this.position.x += this.supportPlatform.movementDelta.x;
      this.position.y += this.supportPlatform.movementDelta.y;
      this.position.x = Math.max(0, Math.min(this.position.x, this.worldWidth - this.width));
    }
    update(deltaTime, input, canMove = true) {
      this.previousPosition = { ...this.position };
      const horizontalInput = Number(input.right) - Number(input.left);
      this.velocity.x = canMove ? horizontalInput * MOVE_SPEED : 0;
      if (horizontalInput < 0) this.lookDirection = "left";
      if (horizontalInput > 0) this.lookDirection = "right";
      if (this.isGrounded) {
        this.coyoteTimeRemaining = COYOTE_TIME;
      } else {
        this.coyoteTimeRemaining = Math.max(0, this.coyoteTimeRemaining - deltaTime);
      }
      input.tick(deltaTime);
      if (input.hasBufferedJump && this.coyoteTimeRemaining > 0 && canMove) {
        this.velocity.y = -JUMP_SPEED;
        this.isGrounded = false;
        this.coyoteTimeRemaining = 0;
        input.consumeJump();
      }
      this.velocity.y += GRAVITY * deltaTime;
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
      this.position.x = Math.max(0, Math.min(this.position.x, this.worldWidth - this.width));
      this.isGrounded = false;
      const floorY = this.groundY - this.height;
      if (this.position.y >= floorY) {
        this.position.y = floorY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
      if (this.position.y < 0) {
        this.position.y = 0;
        this.velocity.y = Math.max(0, this.velocity.y);
      }
    }
    draw(ctx, cameraX, sprites) {
      const sprite = this.lookDirection === "left" ? sprites.playerLeft : this.lookDirection === "right" ? sprites.playerRight : sprites.player;
      ctx.drawImage(sprite, this.position.x - cameraX, this.position.y, this.width, this.height);
    }
  };
  var Platform = class {
    constructor(x, y, type = "normal", options = {}) {
      var _a, _b, _c;
      this.position = { x, y };
      this.previousPosition = { ...this.position };
      this.origin = { ...this.position };
      this.width = 200;
      this.height = 40;
      this.type = type;
      this.active = true;
      this.range = (_a = options.range) != null ? _a : 140;
      this.speed = (_b = options.speed) != null ? _b : 110;
      this.phase = (_c = options.phase) != null ? _c : 0;
      this.elapsed = 0;
      this.movementDelta = { x: 0, y: 0 };
    }
    update(deltaTime) {
      this.previousPosition = { ...this.position };
      if (this.type !== "moving-x" && this.type !== "moving-y") {
        this.movementDelta = { x: 0, y: 0 };
        return;
      }
      this.elapsed += deltaTime;
      const offset = Math.sin(this.phase + this.elapsed * this.speed / this.range) * this.range;
      if (this.type === "moving-x") this.position.x = this.origin.x + offset;
      if (this.type === "moving-y") this.position.y = this.origin.y + offset;
      this.movementDelta = {
        x: this.position.x - this.previousPosition.x,
        y: this.position.y - this.previousPosition.y
      };
    }
    draw(ctx, cameraX, sprites, theme) {
      if (!this.active) return;
      drawThemeSprite(
        ctx,
        sprites,
        theme,
        "platformCrop",
        "platform",
        this.position.x - cameraX,
        this.position.y,
        this.width,
        this.height
      );
      if (this.type === "bounce" || this.type === "fragile") {
        ctx.save();
        ctx.globalAlpha = 0.36;
        ctx.fillStyle = this.type === "bounce" ? "#55e6ff" : "#fff3a0";
        ctx.fillRect(this.position.x - cameraX, this.position.y, this.width, this.height);
        ctx.restore();
      }
    }
  };
  var Blockade = class {
    constructor(x, y) {
      this.position = { x, y };
      this.width = 40;
      this.height = 200;
    }
    draw(ctx, cameraX, sprites, theme) {
      ctx.save();
      ctx.translate(this.position.x - cameraX + this.width, this.position.y);
      ctx.rotate(Math.PI / 2);
      drawThemeSprite(ctx, sprites, theme, "platformCrop", "platform", 0, 0, this.height, this.width);
      ctx.restore();
    }
  };
  var CheckPoint = class {
    constructor(x, y, order) {
      this.position = { x, y };
      this.width = 40;
      this.height = 70;
      this.order = order;
      this.claimed = false;
    }
    draw(ctx, cameraX, sprites, theme) {
      if (!this.claimed) {
        drawThemeSprite(
          ctx,
          sprites,
          theme,
          "toiletCrop",
          "toilet",
          this.position.x - cameraX,
          this.position.y,
          this.width,
          this.height
        );
      }
    }
  };
  var Fly = class {
    constructor(x, y, type = "normal") {
      this.position = { x, y };
      this.bodySize = 10;
      this.collected = false;
      this.type = type;
    }
    draw(ctx, cameraX, sprites) {
      if (!this.collected) {
        const size = this.bodySize * 4;
        if (this.type !== "normal") {
          ctx.save();
          ctx.fillStyle = this.type === "gold" ? "#ffd700" : "#6ee7ff";
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(this.position.x - cameraX, this.position.y, size * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.drawImage(sprites.fly, this.position.x - cameraX - size / 2, this.position.y - size / 2, size, size);
      }
    }
    collectIfTouching(player) {
      if (this.collected) return false;
      const x = player.position.x + player.width / 2 - this.position.x;
      const y = player.position.y + player.height / 2 - this.position.y;
      if (Math.hypot(x, y) < player.width / 2 + this.bodySize) {
        this.collected = true;
        return true;
      }
      return false;
    }
  };

  // src/levels.js
  var LEVELS = Object.freeze([
    {
      id: "bathroom-run",
      name: "Badezimmer-Sprint",
      description: "Der klassische horizontale Lauf zur letzten Toilette.",
      missions: [
        { id: "bathroom-collector", label: "Sammle alle 20 Fliegen", type: "flies", target: 20 },
        { id: "bathroom-speed", label: "Schaffe das Level in 100 Sekunden", type: "time", target: 100 },
        { id: "bathroom-combo", label: "Erreiche eine \xD73-Combo", type: "combo", target: 3 }
      ],
      theme: {
        background: "bathroomBackground",
        atlas: "bathroomAtlas",
        platformCrop: [0, 600, 850, 300],
        toiletCrop: [850, 250, 404, 680]
      },
      width: 5e3,
      spawn: { x: 100, y: 400 },
      platforms: [
        [500, 450],
        [700, 400],
        [850, 350],
        [900, 350],
        [1050, 150],
        [2500, 450, "bounce"],
        [2900, 400],
        [3150, 350],
        [3900, 450, "moving-y", { range: 110, speed: 90 }],
        [4200, 400, "fragile"],
        [4400, 200],
        [4550, 200],
        [4700, 150]
      ],
      blockades: [[1210, -10], [2860, 240], [2860, 0], [4860, -10]],
      flies: [
        [550, 350],
        [700, 250],
        [1100, 450, "gold"],
        [1450, 350],
        [1800, 250],
        [2e3, 450],
        [2300, 350],
        [2500, 150, "time"],
        [2875, 220],
        [3e3, 450],
        [3250, 250],
        [3400, 450],
        [3600, 250],
        [3780, 750],
        [3900, 550],
        [4050, 600],
        [4300, 250],
        [4500, 100, "gold"],
        [4700, 20],
        [4800, 500]
      ],
      checkpoints: [[1170, 80, 1], [2900, 330, 2], [4800, 80, 3]]
    },
    {
      id: "sewer-shortcut",
      name: "Kanal-K\xFCrzel",
      description: "K\xFCrzer, aber mit Sprungpolstern und zerbrechlichen Steinen.",
      missions: [
        { id: "sewer-collector", label: "Sammle alle 10 Fliegen", type: "flies", target: 10 },
        { id: "sewer-speed", label: "Schaffe das Level in 75 Sekunden", type: "time", target: 75 },
        { id: "sewer-score", label: "Erreiche 12.000 Punkte", type: "score", target: 12e3 }
      ],
      theme: {
        background: "sewerBackground",
        atlas: "sewerAtlas",
        platformCrop: [0, 560, 810, 310],
        toiletCrop: [800, 240, 454, 650]
      },
      width: 3600,
      spawn: { x: 80, y: 600 },
      platforms: [
        [380, 560],
        [650, 430, "bounce"],
        [930, 260],
        [1250, 430, "fragile"],
        [1550, 600],
        [1850, 420, "bounce"],
        [2200, 230],
        [2550, 420, "fragile"],
        [2900, 300, "moving-y", { range: 90, speed: 95 }],
        [3250, 160]
      ],
      blockades: [[1100, 560], [2350, 500], [3500, -10]],
      flies: [
        [450, 500],
        [700, 350],
        [980, 190, "gold"],
        [1300, 360],
        [1600, 530],
        [1900, 350, "time"],
        [2250, 160],
        [2600, 350],
        [2950, 230],
        [3300, 90, "gold"]
      ],
      checkpoints: [[1050, 490, 1], [2300, 430, 2], [3400, 90, 3]]
    },
    {
      id: "festival-flush",
      name: "Festival-Flucht",
      description: "Ein riskanter Expertenlauf mit wertvollen Fliegen.",
      missions: [
        { id: "festival-collector", label: "Sammle alle 11 Fliegen", type: "flies", target: 11 },
        { id: "festival-combo", label: "Erreiche eine \xD74-Combo", type: "combo", target: 4 },
        { id: "festival-score", label: "Erreiche 16.000 Punkte", type: "score", target: 16e3 }
      ],
      theme: {
        background: "festivalBackground",
        atlas: "festivalAtlas",
        platformCrop: [0, 510, 930, 390],
        toiletCrop: [900, 230, 354, 680]
      },
      width: 4200,
      spawn: { x: 100, y: 680 },
      platforms: [
        [420, 600, "fragile"],
        [720, 460, "moving-x", { range: 120, speed: 115 }],
        [1050, 300, "bounce"],
        [1400, 180],
        [1750, 420, "fragile"],
        [2100, 260],
        [2450, 520, "bounce"],
        [2800, 330, "moving-y", { range: 110, speed: 105 }],
        [3150, 180, "fragile"],
        [3500, 380],
        [3850, 140]
      ],
      blockades: [[1550, 500], [3e3, 420], [4100, -10]],
      flies: [
        [470, 530],
        [770, 390],
        [1100, 230, "gold"],
        [1450, 110, "gold"],
        [1800, 350],
        [2150, 190, "time"],
        [2500, 450],
        [2850, 260],
        [3200, 110, "gold"],
        [3550, 310],
        [3900, 70, "gold"]
      ],
      checkpoints: [[1500, 430, 1], [2950, 350, 2], [4e3, 70, 3]]
    },
    {
      id: "royal-flush",
      name: "Royal Flush",
      description: "Vertikaler Aufstieg mit der direkten Steuerung aus den normalen Levels.",
      missions: [
        { id: "royal-climber", label: "Erreiche das Ziel in 150 Sekunden", type: "time", target: 150 },
        { id: "royal-collector", label: "Sammle mindestens 12 Fliegen", type: "flies", target: 12 },
        { id: "royal-score", label: "Erreiche 15.000 Punkte", type: "score", target: 15e3 }
      ],
      theme: {
        background: "royalBackground",
        atlas: "royalAtlas",
        platformCrop: [0, 500, 840, 360],
        toiletCrop: [820, 160, 434, 750]
      },
      mode: "vertical",
      width: 1e3,
      height: 3200,
      spawn: { x: 100, y: 3100 },
      platforms: [
        [80, 3140],
        [360, 2980, "moving-x", { range: 150, speed: 110 }],
        [680, 2820],
        [300, 2640],
        [40, 2460],
        [430, 2290, "moving-y", { range: 90, speed: 90 }],
        [720, 2100],
        [360, 1900, "moving-x", { range: 170, speed: 115 }],
        [60, 1710],
        [500, 1510],
        [750, 1310],
        [380, 1110],
        [80, 900],
        [460, 690],
        [720, 470],
        [390, 250]
      ],
      blockades: [],
      flies: [
        [460, 2910],
        [780, 2750],
        [400, 2570, "gold"],
        [130, 2390],
        [530, 2220, "time"],
        [820, 2030],
        [460, 1830],
        [150, 1640, "gold"],
        [590, 1440],
        [840, 1240],
        [470, 1040],
        [170, 830],
        [550, 620],
        [810, 400, "gold"]
      ],
      checkpoints: [[790, 2040, 1], [120, 830, 2], [470, 180, 3]]
    }
  ]);
  var getLevelDefinition = (levelId) => {
    var _a;
    return (_a = LEVELS.find((level) => level.id === levelId)) != null ? _a : LEVELS[0];
  };

  // src/level.js
  var createLevel = (levelId) => {
    var _a, _b, _c;
    const definition = getLevelDefinition(levelId);
    return {
      id: definition.id,
      name: definition.name,
      width: definition.width,
      height: (_a = definition.height) != null ? _a : 800,
      mode: (_b = definition.mode) != null ? _b : "horizontal",
      theme: definition.theme,
      missions: definition.missions,
      player: new Player(definition.spawn, {
        worldWidth: definition.width,
        groundY: ((_c = definition.height) != null ? _c : 800) - 40
      }),
      platforms: definition.platforms.map(
        ([x, y, type = "normal", options = {}]) => new Platform(x, y, type, options)
      ),
      blockades: definition.blockades.map(([x, y]) => new Blockade(x, y)),
      flies: definition.flies.map(([x, y, type = "normal"]) => new Fly(x, y, type)),
      checkpoints: definition.checkpoints.map(([x, y, order]) => new CheckPoint(x, y, order))
    };
  };

  // src/score.js
  var SCORE_PER_FLY = 500;
  var COMPLETION_BONUS = 2e3;
  var ALL_FLIES_BONUS = 3e3;
  var MAX_TIME_BONUS = 6e3;
  var TIME_BONUS_PER_SECOND = 40;
  var COMBO_WINDOW = 4;
  var formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(1).padStart(4, "0")}`;
  };
  var calculateMedal = ({ elapsedSeconds, fliesCollected, totalFlies, falls }) => {
    if (fliesCollected === totalFlies && elapsedSeconds <= 75 && falls === 0) return "Gold";
    if (fliesCollected >= Math.ceil(totalFlies * 0.75) && elapsedSeconds <= 120) return "Silber";
    return "Bronze";
  };
  var calculateFinalScore = ({ elapsedSeconds, fliesCollected, totalFlies, falls }) => {
    const flyScore = fliesCollected * SCORE_PER_FLY;
    const timeBonus = Math.max(0, Math.round(MAX_TIME_BONUS - elapsedSeconds * TIME_BONUS_PER_SECOND));
    const collectionBonus = fliesCollected === totalFlies ? ALL_FLIES_BONUS : 0;
    const fallPenalty = falls * 250;
    return Math.max(0, flyScore + timeBonus + collectionBonus + COMPLETION_BONUS - fallPenalty);
  };
  var RunStats = class {
    constructor() {
      this.elapsedSeconds = 0;
      this.started = false;
      this.fliesCollected = 0;
      this.flyScore = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.comboRemaining = 0;
      this.falls = 0;
    }
    update(deltaTime, hasPlayerInput) {
      if (hasPlayerInput) this.started = true;
      if (!this.started) return;
      this.elapsedSeconds += deltaTime;
      this.comboRemaining = Math.max(0, this.comboRemaining - deltaTime);
      if (this.comboRemaining === 0) this.combo = 0;
    }
    collectFly(type = "normal") {
      this.fliesCollected += 1;
      this.combo = this.comboRemaining > 0 ? this.combo + 1 : 1;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.comboRemaining = COMBO_WINDOW;
      const typeMultiplier = type === "gold" ? 3 : 1;
      this.flyScore += SCORE_PER_FLY * Math.min(this.combo, 4) * typeMultiplier;
      if (type === "time") this.elapsedSeconds = Math.max(0, this.elapsedSeconds - 5);
    }
    finish(totalFlies) {
      const result = {
        elapsedSeconds: this.elapsedSeconds,
        fliesCollected: this.fliesCollected,
        totalFlies,
        falls: this.falls,
        bestCombo: this.bestCombo,
        flyScore: this.flyScore
      };
      return {
        ...result,
        medal: calculateMedal(result),
        score: calculateFinalScore(result) - result.fliesCollected * SCORE_PER_FLY + result.flyScore
      };
    }
  };

  // src/achievements.js
  var ACHIEVEMENTS = Object.freeze([
    { id: "first-flush", name: "Erste Sp\xFClung", description: "Schlie\xDFe dein erstes Level ab." },
    { id: "fly-hunter", name: "Fliegenj\xE4ger", description: "Sammle insgesamt 50 Fliegen." },
    { id: "combo-master", name: "Combo-Meister", description: "Erreiche eine \xD74-Combo." },
    { id: "golden-pile", name: "Goldst\xFCck", description: "Verdiene eine Goldmedaille." },
    { id: "speed-runner", name: "Ab durch die Sch\xFCssel", description: "Beende ein Level in h\xF6chstens 60 Sekunden." },
    { id: "sure-footed", name: "Trittsicher", description: "Beende ein Level ohne einen Sturz." }
  ]);
  var findNewAchievements = (progress, result) => {
    var _a;
    const unlocked = new Set((_a = progress.achievements) != null ? _a : []);
    const qualifies = {
      "first-flush": progress.totalRuns >= 1,
      "fly-hunter": progress.totalFlies >= 50,
      "combo-master": result.bestCombo >= 4,
      "golden-pile": result.medal === "Gold",
      "speed-runner": result.elapsedSeconds <= 60,
      "sure-footed": result.falls === 0
    };
    return ACHIEVEMENTS.filter(({ id }) => qualifies[id] && !unlocked.has(id));
  };

  // src/storage.js
  var STORAGE_KEY = "dung-dash-progress-v1";
  var emptyProgress = () => ({
    bestScore: 0,
    bestTime: null,
    totalRuns: 0,
    totalFlies: 0,
    medals: { Bronze: 0, Silber: 0, Gold: 0 },
    unlockedLevels: ["bathroom-run"],
    levelRecords: {},
    achievements: []
  });
  var ProgressStore = class {
    constructor(storage) {
      this.storage = storage;
    }
    load() {
      var _a, _b;
      try {
        const saved = JSON.parse((_b = (_a = this.storage) == null ? void 0 : _a.getItem(STORAGE_KEY)) != null ? _b : "null");
        return saved ? { ...emptyProgress(), ...saved } : emptyProgress();
      } catch (e) {
        return emptyProgress();
      }
    }
    record(result, levelId = "bathroom-run", nextLevelId = null, completedMissions = []) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
      const progress = this.load();
      const next = {
        ...progress,
        bestScore: Math.max(progress.bestScore, result.score),
        bestTime: progress.bestTime === null ? result.elapsedSeconds : Math.min(progress.bestTime, result.elapsedSeconds),
        totalRuns: progress.totalRuns + 1,
        totalFlies: progress.totalFlies + result.fliesCollected,
        medals: {
          ...progress.medals,
          [result.medal]: ((_a = progress.medals[result.medal]) != null ? _a : 0) + 1
        },
        unlockedLevels: [.../* @__PURE__ */ new Set([
          ...(_b = progress.unlockedLevels) != null ? _b : ["bathroom-run"],
          ...nextLevelId ? [nextLevelId] : []
        ])],
        levelRecords: {
          ...(_c = progress.levelRecords) != null ? _c : {},
          [levelId]: {
            bestScore: Math.max((_f = (_e = (_d = progress.levelRecords) == null ? void 0 : _d[levelId]) == null ? void 0 : _e.bestScore) != null ? _f : 0, result.score),
            bestTime: ((_h = (_g = progress.levelRecords) == null ? void 0 : _g[levelId]) == null ? void 0 : _h.bestTime) == null ? result.elapsedSeconds : Math.min(progress.levelRecords[levelId].bestTime, result.elapsedSeconds),
            medal: this.bestMedal((_j = (_i = progress.levelRecords) == null ? void 0 : _i[levelId]) == null ? void 0 : _j.medal, result.medal),
            missions: [.../* @__PURE__ */ new Set([
              ...(_m = (_l = (_k = progress.levelRecords) == null ? void 0 : _k[levelId]) == null ? void 0 : _l.missions) != null ? _m : [],
              ...completedMissions
            ])]
          }
        }
      };
      const newAchievements = findNewAchievements(next, result);
      next.achievements = [...(_n = progress.achievements) != null ? _n : [], ...newAchievements.map(({ id }) => id)];
      try {
        (_o = this.storage) == null ? void 0 : _o.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
      }
      return { ...next, newAchievements };
    }
    bestMedal(current, candidate) {
      var _a, _b;
      const rank = { Bronze: 1, Silber: 2, Gold: 3 };
      return ((_a = rank[candidate]) != null ? _a : 0) >= ((_b = rank[current]) != null ? _b : 0) ? candidate : current;
    }
  };

  // src/missions.js
  var evaluateMissions = (missions, result) => missions.map((mission) => ({
    ...mission,
    completed: mission.type === "time" ? result.elapsedSeconds <= mission.target : mission.type === "flies" ? result.fliesCollected >= mission.target : mission.type === "combo" ? result.bestCombo >= mission.target : mission.type === "score" ? result.score >= mission.target : false
  }));
  var completedMissionIds = (missions, result) => evaluateMissions(missions, result).filter(({ completed }) => completed).map(({ id }) => id);

  // src/physics.js
  var overlaps = (first, second) => first.position.x < second.position.x + second.width && first.position.x + first.width > second.position.x && first.position.y < second.position.y + second.height && first.position.y + first.height > second.position.y;
  var rangesOverlap = (firstStart, firstEnd, secondStart, secondEnd) => firstEnd > secondStart && firstStart < secondEnd;
  var findPlatformImpact = (player, platform) => {
    var _a;
    const previous = player.previousPosition;
    const current = player.position;
    const platformPrevious = (_a = platform.previousPosition) != null ? _a : platform.position;
    const platformDeltaX = platform.position.x - platformPrevious.x;
    const platformDeltaY = platform.position.y - platformPrevious.y;
    const deltaX = current.x - previous.x - platformDeltaX;
    const deltaY = current.y - previous.y - platformDeltaY;
    const left = platformPrevious.x;
    const right = left + platform.width;
    const top = platformPrevious.y;
    const bottom = top + platform.height;
    const impacts = [];
    if (deltaY > 0) {
      const time = (top - (previous.y + player.height)) / deltaY;
      const xAtImpact = previous.x + deltaX * time;
      if (time >= 0 && time <= 1 && rangesOverlap(xAtImpact, xAtImpact + player.width, left, right)) {
        impacts.push({ side: "top", time });
      }
    }
    if (platform.type !== "one-way" && deltaY < 0) {
      const time = (bottom - previous.y) / deltaY;
      const xAtImpact = previous.x + deltaX * time;
      if (time >= 0 && time <= 1 && rangesOverlap(xAtImpact, xAtImpact + player.width, left, right)) {
        impacts.push({ side: "bottom", time });
      }
    }
    if (platform.type !== "one-way" && deltaX > 0) {
      const time = (left - (previous.x + player.width)) / deltaX;
      const yAtImpact = previous.y + deltaY * time;
      if (time >= 0 && time <= 1 && rangesOverlap(yAtImpact, yAtImpact + player.height, top, bottom)) {
        impacts.push({ side: "left", time });
      }
    }
    if (platform.type !== "one-way" && deltaX < 0) {
      const time = (right - previous.x) / deltaX;
      const yAtImpact = previous.y + deltaY * time;
      if (time >= 0 && time <= 1 && rangesOverlap(yAtImpact, yAtImpact + player.height, top, bottom)) {
        impacts.push({ side: "right", time });
      }
    }
    return impacts.reduce(
      (earliest, impact) => earliest === null || impact.time < earliest.time ? impact : earliest,
      null
    );
  };
  var resolvePlatformCollisions = (player, platforms) => {
    player.supportPlatform = null;
    for (const platform of platforms) {
      if (!platform.active) continue;
      const impact = findPlatformImpact(player, platform);
      if (!impact) continue;
      if (impact.side === "top") {
        player.position.y = platform.position.y - player.height;
        if (platform.type === "bounce") {
          player.velocity.y = -1100;
          player.isGrounded = false;
        } else {
          player.velocity.y = 0;
          player.isGrounded = true;
          player.supportPlatform = platform;
        }
        if (platform.type === "fragile") platform.active = false;
      } else if (impact.side === "bottom") {
        player.position.y = platform.position.y + platform.height;
        player.velocity.y = 0;
      } else if (impact.side === "left") {
        player.position.x = platform.position.x - player.width;
        player.velocity.x = 0;
      } else if (impact.side === "right") {
        player.position.x = platform.position.x + platform.width;
        player.velocity.x = 0;
      }
    }
  };
  var resolveBlockadeCollisions = (player, blockades) => {
    for (const block of blockades) {
      if (!overlaps(player, block)) continue;
      const previousRight = player.previousPosition.x + player.width;
      const previousLeft = player.previousPosition.x;
      const previousBottom = player.previousPosition.y + player.height;
      const previousTop = player.previousPosition.y;
      if (previousBottom <= block.position.y) {
        player.position.y = block.position.y - player.height;
        player.velocity.y = 0;
        player.isGrounded = true;
      } else if (previousTop >= block.position.y + block.height) {
        player.position.y = block.position.y + block.height;
        player.velocity.y = Math.max(0, player.velocity.y);
      } else if (previousRight <= block.position.x) {
        player.position.x = block.position.x - player.width;
        player.velocity.x = 0;
      } else if (previousLeft >= block.position.x + block.width) {
        player.position.x = block.position.x + block.width;
        player.velocity.x = 0;
      }
    }
  };
  var findReachedCheckpoint = (player, checkpoints) => {
    const nextOrder = checkpoints.filter((checkpoint) => checkpoint.claimed).length + 1;
    return checkpoints.find(
      (checkpoint) => !checkpoint.claimed && checkpoint.order === nextOrder && overlaps(player, checkpoint)
    );
  };

  // src/game.js
  var Game = class {
    constructor(documentObject, windowObject) {
      this.document = documentObject;
      this.window = windowObject;
      this.canvas = documentObject.getElementById("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.startScreen = documentObject.querySelector(".start-screen");
      this.checkpointScreen = documentObject.querySelector(".checkpoint-screen");
      this.checkpointTitle = documentObject.getElementById("checkpoint-title");
      this.checkpointMessage = documentObject.getElementById("checkpoint-message");
      this.score = documentObject.querySelector(".score");
      this.startButton = documentObject.getElementById("start-btn");
      this.levelSelect = documentObject.getElementById("level-select");
      this.levelDescription = documentObject.getElementById("level-description");
      this.missionList = documentObject.getElementById("mission-list");
      this.missionStars = documentObject.getElementById("mission-stars");
      this.careerStats = documentObject.getElementById("career-stats");
      this.achievementList = documentObject.getElementById("achievement-list");
      this.restartButton = documentObject.getElementById("restart-btn");
      this.levelMenuButton = documentObject.getElementById("level-menu-btn");
      this.pauseButton = documentObject.getElementById("pause-btn");
      this.fliesCollectedElement = documentObject.getElementById("flies-collected");
      this.totalFliesElement = documentObject.getElementById("total-flies");
      this.timerElement = documentObject.getElementById("run-time");
      this.runScoreElement = documentObject.getElementById("run-score");
      this.comboElement = documentObject.getElementById("combo");
      this.input = new InputController();
      this.assets = loadSprites(windowObject.Image);
      this.state = GameState.READY;
      this.animationFrameId = null;
      this.messageTimeout = null;
      this.previousFrameTime = null;
      this.cameraX = 0;
      this.cameraY = 0;
      this.fliesCollected = 0;
      this.stats = new RunStats();
      let storage = null;
      try {
        storage = windowObject.localStorage;
      } catch (e) {
      }
      this.progressStore = new ProgressStore(storage);
      this.viewport = calculateViewport(windowObject.innerWidth, windowObject.innerHeight, windowObject.devicePixelRatio);
      this.selectedLevelId = LEVELS[0].id;
    }
    initialize() {
      this.input.bind(
        this.window,
        [...this.document.querySelectorAll("[data-control]")],
        { onPause: () => this.togglePause() }
      );
      this.startButton.addEventListener("click", () => this.start());
      this.levelSelect.addEventListener("change", () => {
        this.selectedLevelId = this.levelSelect.value;
        this.updateLevelDescription();
        this.renderMissions();
      });
      this.restartButton.addEventListener("click", () => this.reset());
      this.levelMenuButton.addEventListener("click", () => this.returnToLevelSelect());
      this.pauseButton.addEventListener("click", () => this.togglePause());
      this.window.addEventListener("resize", () => this.resize());
      this.resize();
      this.renderLevelOptions();
      this.renderProgress();
      this.renderMissions();
    }
    renderLevelOptions() {
      var _a;
      const progress = this.progressStore.load();
      this.levelSelect.replaceChildren();
      LEVELS.forEach((definition, index) => {
        var _a2, _b, _c;
        const option = this.document.createElement("option");
        const unlocked = progress.unlockedLevels.includes(definition.id);
        const record = (_a2 = progress.levelRecords) == null ? void 0 : _a2[definition.id];
        option.value = definition.id;
        option.disabled = !unlocked;
        const stars = (_c = (_b = record == null ? void 0 : record.missions) == null ? void 0 : _b.length) != null ? _c : 0;
        option.textContent = `${index + 1}. ${definition.name}${record ? ` \xB7 ${record.medal}` : ""}${stars ? ` \xB7 ${stars}/3 \u2605` : ""}${unlocked ? "" : " \u{1F512}"}`;
        this.levelSelect.append(option);
      });
      if (![...this.levelSelect.options].some((option) => option.value === this.selectedLevelId && !option.disabled)) {
        this.selectedLevelId = (_a = progress.unlockedLevels[0]) != null ? _a : LEVELS[0].id;
      }
      this.levelSelect.value = this.selectedLevelId;
      this.updateLevelDescription();
    }
    updateLevelDescription() {
      var _a, _b;
      const definition = (_a = LEVELS.find((level) => level.id === this.selectedLevelId)) != null ? _a : LEVELS[0];
      const record = (_b = this.progressStore.load().levelRecords) == null ? void 0 : _b[definition.id];
      this.levelDescription.textContent = record ? `${definition.description} Bestwert: ${record.bestScore} Punkte.` : definition.description;
    }
    renderMissions() {
      var _a, _b, _c, _d;
      const definition = (_a = LEVELS.find((level) => level.id === this.selectedLevelId)) != null ? _a : LEVELS[0];
      const completed = new Set((_d = (_c = (_b = this.progressStore.load().levelRecords) == null ? void 0 : _b[definition.id]) == null ? void 0 : _c.missions) != null ? _d : []);
      this.missionStars.textContent = `${completed.size}/${definition.missions.length} \u2605`;
      this.missionList.replaceChildren(...definition.missions.map((mission) => {
        const item = this.document.createElement("p");
        const isCompleted = completed.has(mission.id);
        item.className = `mission${isCompleted ? " completed" : ""}`;
        item.innerHTML = `<span aria-hidden="true">${isCompleted ? "\u2605" : "\u2606"}</span><span>${mission.label}</span>`;
        return item;
      }));
    }
    renderProgress() {
      var _a;
      const progress = this.progressStore.load();
      const stats = [
        ["L\xE4ufe", progress.totalRuns],
        ["Fliegen", progress.totalFlies],
        ["Highscore", progress.bestScore],
        ["Bestzeit", progress.bestTime === null ? "\u2013" : formatTime(progress.bestTime)]
      ];
      this.careerStats.replaceChildren(...stats.map(([label, value]) => {
        const item = this.document.createElement("p");
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        return item;
      }));
      const unlocked = new Set((_a = progress.achievements) != null ? _a : []);
      this.achievementList.replaceChildren(...ACHIEVEMENTS.map((achievement) => {
        const item = this.document.createElement("article");
        const isUnlocked = unlocked.has(achievement.id);
        item.className = `achievement${isUnlocked ? " unlocked" : ""}`;
        item.setAttribute("aria-label", `${achievement.name}: ${isUnlocked ? "freigeschaltet" : "gesperrt"}`);
        item.innerHTML = `<span aria-hidden="true">${isUnlocked ? "\u{1F3C6}" : "\u{1F512}"}</span><div><strong>${achievement.name}</strong><small>${achievement.description}</small></div>`;
        return item;
      }));
    }
    async start() {
      if (this.state !== GameState.READY && this.state !== GameState.ERROR) return;
      this.startButton.disabled = true;
      try {
        await this.assets.ready;
        this.startScreen.style.display = "none";
        this.score.style.display = "block";
        this.reset();
      } catch (error) {
        this.state = GameState.ERROR;
        this.startButton.disabled = false;
        this.showMessage("Fehler", error.message, false);
      }
    }
    reset() {
      if (this.animationFrameId !== null) this.window.cancelAnimationFrame(this.animationFrameId);
      if (this.messageTimeout !== null) this.window.clearTimeout(this.messageTimeout);
      this.level = createLevel(this.selectedLevelId);
      this.document.body.classList.add("game-running");
      this.input.reset();
      this.cameraX = 0;
      this.cameraY = Math.max(0, this.level.height - this.viewport.viewportHeight);
      this.fliesCollected = 0;
      this.stats = new RunStats();
      this.fliesCollectedElement.textContent = "0";
      this.totalFliesElement.textContent = String(this.level.flies.length);
      this.updateHud();
      this.checkpointScreen.style.display = "none";
      this.checkpointScreen.classList.remove("toast");
      this.restartButton.style.display = "none";
      this.levelMenuButton.style.display = "none";
      this.pauseButton.hidden = false;
      this.pauseButton.textContent = "Pause";
      this.pauseButton.setAttribute("aria-pressed", "false");
      this.previousFrameTime = null;
      this.state = GameState.PLAYING;
      this.animationFrameId = this.window.requestAnimationFrame((time) => this.animate(time));
    }
    resize() {
      var _a, _b, _c, _d;
      this.viewport = calculateViewport(
        this.window.innerWidth,
        this.window.innerHeight,
        this.window.devicePixelRatio
      );
      this.canvas.width = Math.round(this.window.innerWidth * this.viewport.devicePixelRatio);
      this.canvas.height = Math.round(this.window.innerHeight * this.viewport.devicePixelRatio);
      this.canvas.style.width = `${this.window.innerWidth}px`;
      this.canvas.style.height = `${this.window.innerHeight}px`;
      const levelWidth = (_b = (_a = this.level) == null ? void 0 : _a.width) != null ? _b : LEVELS[0].width;
      const levelHeight = (_d = (_c = this.level) == null ? void 0 : _c.height) != null ? _d : 800;
      this.cameraX = Math.min(this.cameraX, Math.max(0, levelWidth - this.viewport.viewportWidth));
      this.cameraY = Math.min(this.cameraY, Math.max(0, levelHeight - this.viewport.viewportHeight));
    }
    update(deltaTime) {
      const { player, platforms, blockades, flies, checkpoints } = this.level;
      this.stats.update(deltaTime, this.input.left || this.input.right || this.input.hasBufferedJump);
      platforms.forEach((platform) => platform.update(deltaTime));
      player.followSupportPlatform();
      player.update(deltaTime, this.input, this.state === GameState.PLAYING);
      resolvePlatformCollisions(player, platforms);
      resolveBlockadeCollisions(player, blockades);
      flies.forEach((fly) => {
        if (fly.collectIfTouching(player)) {
          this.fliesCollected += 1;
          this.stats.collectFly(fly.type);
          this.fliesCollectedElement.textContent = String(this.fliesCollected);
        }
      });
      const checkpoint = findReachedCheckpoint(player, checkpoints);
      if (checkpoint) {
        checkpoint.claimed = true;
        if (checkpoint === checkpoints.at(-1)) this.finish();
        else this.showMessage("Checkpoint", "Du hast eine Toilette erreicht!");
      }
      const targetX = player.position.x - this.viewport.viewportWidth * 0.4;
      this.cameraX = Math.max(0, Math.min(targetX, this.level.width - this.viewport.viewportWidth));
      const targetY = player.position.y - this.viewport.viewportHeight * 0.55;
      this.cameraY = Math.max(0, Math.min(targetY, this.level.height - this.viewport.viewportHeight));
      this.updateHud();
    }
    updateHud() {
      this.timerElement.textContent = formatTime(this.stats.elapsedSeconds);
      this.runScoreElement.textContent = String(this.stats.flyScore);
      this.comboElement.textContent = this.stats.combo > 1 ? `Combo \xD7${this.stats.combo}` : "";
    }
    finish() {
      var _a, _b;
      this.state = GameState.FINISHED;
      this.input.reset();
      const result = this.stats.finish(this.level.flies.length);
      const missionResults = evaluateMissions(this.level.missions, result);
      const missionsCompletedThisRun = completedMissionIds(this.level.missions, result);
      const levelIndex = LEVELS.findIndex((level) => level.id === this.level.id);
      const nextLevelId = (_b = (_a = LEVELS[levelIndex + 1]) == null ? void 0 : _a.id) != null ? _b : null;
      const progress = this.progressStore.record(result, this.level.id, nextLevelId, missionsCompletedThisRun);
      this.runScoreElement.textContent = String(result.score);
      this.showMessage(
        `${result.medal}-Medaille!`,
        `Zeit: ${formatTime(result.elapsedSeconds)} \xB7 Fliegen: ${result.fliesCollected}/${result.totalFlies} \xB7 Score: ${result.score} \xB7 Rekord: ${progress.bestScore}` + (progress.newAchievements.length ? ` \xB7 Neu: ${progress.newAchievements.map(({ name }) => name).join(", ")}` : "") + ` \xB7 Missionen: ${missionResults.filter(({ completed }) => completed).length}/${missionResults.length}`,
        false
      );
      this.restartButton.style.display = "inline-block";
      this.levelMenuButton.style.display = "inline-block";
      this.pauseButton.hidden = true;
      this.restartButton.focus();
      this.renderLevelOptions();
      this.renderProgress();
      this.renderMissions();
    }
    returnToLevelSelect() {
      if (this.animationFrameId !== null) {
        this.window.cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.messageTimeout !== null) {
        this.window.clearTimeout(this.messageTimeout);
        this.messageTimeout = null;
      }
      this.state = GameState.READY;
      this.input.reset();
      this.document.body.classList.remove("game-running");
      this.checkpointScreen.style.display = "none";
      this.score.style.display = "none";
      this.pauseButton.hidden = true;
      this.restartButton.style.display = "none";
      this.levelMenuButton.style.display = "none";
      this.startButton.disabled = false;
      this.startScreen.style.display = "block";
      this.renderLevelOptions();
      this.renderProgress();
      this.renderMissions();
      this.levelSelect.focus();
    }
    togglePause() {
      if (this.state === GameState.PLAYING) {
        this.state = GameState.PAUSED;
        this.input.reset();
        this.pauseButton.textContent = "Fortsetzen";
        this.pauseButton.setAttribute("aria-pressed", "true");
        this.showMessage("Pause", "Dr\xFCcke P, Escape oder Fortsetzen.", false);
      } else if (this.state === GameState.PAUSED) {
        this.state = GameState.PLAYING;
        this.previousFrameTime = null;
        this.pauseButton.textContent = "Pause";
        this.pauseButton.setAttribute("aria-pressed", "false");
        this.checkpointScreen.style.display = "none";
        this.pauseButton.focus();
      }
    }
    showMessage(title, message, autoHide = true) {
      if (this.messageTimeout !== null) this.window.clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
      this.checkpointTitle.textContent = title;
      this.checkpointMessage.textContent = message;
      this.checkpointScreen.classList.toggle("toast", autoHide);
      this.checkpointScreen.style.display = "block";
      if (autoHide) {
        this.messageTimeout = this.window.setTimeout(() => {
          this.checkpointScreen.style.display = "none";
          this.checkpointScreen.classList.remove("toast");
          this.messageTimeout = null;
        }, 2e3);
      }
    }
    drawGround() {
      const tileWidth = 200;
      const firstTileX = Math.floor(this.cameraX / tileWidth) * tileWidth;
      const lastVisibleX = this.cameraX + this.viewport.viewportWidth;
      for (let x = firstTileX; x < lastVisibleX + tileWidth; x += tileWidth) {
        const atlas = this.assets.sprites[this.level.theme.atlas];
        this.ctx.drawImage(
          atlas,
          ...this.level.theme.platformCrop,
          x - this.cameraX,
          this.level.height - GROUND_HEIGHT,
          tileWidth,
          GROUND_HEIGHT
        );
      }
    }
    drawBackground() {
      const background = this.assets.sprites[this.level.theme.background];
      const tileHeight = 800;
      const tileWidth = tileHeight * (background.width / background.height);
      const offsetX = this.cameraX * 0.12 % tileWidth;
      const offsetY = this.cameraY * 0.12 % tileHeight;
      for (let y = -offsetY; y < this.viewport.viewportHeight; y += tileHeight) {
        for (let x = -offsetX; x < this.viewport.viewportWidth; x += tileWidth) {
          this.ctx.drawImage(background, x, y, tileWidth, tileHeight);
        }
      }
      this.ctx.fillStyle = "rgba(20, 20, 24, 0.16)";
      this.ctx.fillRect(0, 0, this.viewport.viewportWidth, this.viewport.viewportHeight);
    }
    draw() {
      const { devicePixelRatio, renderScale } = this.viewport;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.setTransform(devicePixelRatio * renderScale, 0, 0, devicePixelRatio * renderScale, 0, 0);
      this.drawBackground();
      this.ctx.translate(0, -this.cameraY);
      this.drawGround();
      this.level.platforms.forEach(
        (item) => item.draw(this.ctx, this.cameraX, this.assets.sprites, this.level.theme)
      );
      this.level.blockades.forEach(
        (item) => item.draw(this.ctx, this.cameraX, this.assets.sprites, this.level.theme)
      );
      this.level.checkpoints.forEach(
        (item) => item.draw(this.ctx, this.cameraX, this.assets.sprites, this.level.theme)
      );
      this.level.flies.forEach((item) => item.draw(this.ctx, this.cameraX, this.assets.sprites));
      this.level.player.draw(this.ctx, this.cameraX, this.assets.sprites);
    }
    animate(timestamp) {
      if (this.previousFrameTime === null) this.previousFrameTime = timestamp;
      const deltaTime = Math.min((timestamp - this.previousFrameTime) / 1e3, MAX_FRAME_TIME);
      this.previousFrameTime = timestamp;
      if (this.state === GameState.PLAYING) this.update(deltaTime);
      this.draw();
      this.animationFrameId = this.window.requestAnimationFrame((time) => this.animate(time));
    }
  };

  // main.js
  var game = new Game(document, window);
  game.initialize();
})();
