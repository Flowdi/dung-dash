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
    platform: "./assets/sprites/platform.png"
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
    bind(windowObject, touchControls = []) {
      windowObject.addEventListener("keydown", (event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault();
        if (event.key === "ArrowLeft") this.left = true;
        if (event.key === "ArrowRight") this.right = true;
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
          event.preventDefault();
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
  var Player = class {
    constructor() {
      this.position = { x: 100, y: 400 };
      this.previousPosition = { ...this.position };
      this.velocity = { x: 0, y: 0 };
      this.width = 40;
      this.height = 40;
      this.isGrounded = false;
      this.coyoteTimeRemaining = 0;
      this.lookDirection = "neutral";
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
      this.position.x = Math.max(0, Math.min(this.position.x, LEVEL_WIDTH - this.width));
      this.isGrounded = false;
      const floorY = GROUND_Y - this.height;
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
    constructor(x, y) {
      this.position = { x, y };
      this.width = 200;
      this.height = 40;
    }
    draw(ctx, cameraX, sprites) {
      ctx.drawImage(sprites.platform, this.position.x - cameraX, this.position.y, this.width, this.height);
    }
  };
  var Blockade = class {
    constructor(x, y) {
      this.position = { x, y };
      this.width = 40;
      this.height = 200;
    }
    draw(ctx, cameraX, sprites) {
      ctx.save();
      ctx.translate(this.position.x - cameraX + this.width, this.position.y);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(sprites.platform, 0, 0, this.height, this.width);
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
    draw(ctx, cameraX, sprites) {
      if (!this.claimed) {
        ctx.drawImage(sprites.toilet, this.position.x - cameraX, this.position.y, this.width, this.height);
      }
    }
  };
  var Fly = class {
    constructor(x, y) {
      this.position = { x, y };
      this.bodySize = 10;
      this.collected = false;
    }
    draw(ctx, cameraX, sprites) {
      if (!this.collected) {
        const size = this.bodySize * 4;
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

  // src/level.js
  var platformPositions = [
    [500, 450],
    [700, 400],
    [850, 350],
    [900, 350],
    [1050, 150],
    [2500, 450],
    [2900, 400],
    [3150, 350],
    [3900, 450],
    [4200, 400],
    [4400, 200],
    [4550, 200],
    [4700, 150]
  ];
  var blockadePositions = [[1210, -10], [2860, 240], [2860, 0], [4860, -10]];
  var flyPositions = [
    [550, 350],
    [700, 250],
    [1100, 450],
    [1450, 350],
    [1800, 250],
    [2e3, 450],
    [2300, 350],
    [2500, 150],
    [2875, 220],
    [3e3, 450],
    [3250, 250],
    [3400, 450],
    [3600, 250],
    [3780, 750],
    [3900, 550],
    [4050, 600],
    [4300, 250],
    [4500, 100],
    [4700, 20],
    [4800, 500]
  ];
  var checkpointPositions = [[1170, 80, 1], [2900, 330, 2], [4800, 80, 3]];
  var createLevel = () => ({
    player: new Player(),
    platforms: platformPositions.map(([x, y]) => new Platform(x, y)),
    blockades: blockadePositions.map(([x, y]) => new Blockade(x, y)),
    flies: flyPositions.map(([x, y]) => new Fly(x, y)),
    checkpoints: checkpointPositions.map(([x, y, order]) => new CheckPoint(x, y, order))
  });

  // src/physics.js
  var overlaps = (first, second) => first.position.x < second.position.x + second.width && first.position.x + first.width > second.position.x && first.position.y < second.position.y + second.height && first.position.y + first.height > second.position.y;
  var resolvePlatformCollisions = (player, platforms) => {
    for (const platform of platforms) {
      const previousBottom = player.previousPosition.y + player.height;
      const currentBottom = player.position.y + player.height;
      const horizontallyOverlapping = player.position.x + player.width > platform.position.x && player.position.x < platform.position.x + platform.width;
      if (player.velocity.y >= 0 && previousBottom <= platform.position.y && currentBottom >= platform.position.y && horizontallyOverlapping) {
        player.position.y = platform.position.y - player.height;
        player.velocity.y = 0;
        player.isGrounded = true;
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
  var findReachedCheckpoint = (player, checkpoints) => checkpoints.find(
    (checkpoint, index) => !checkpoint.claimed && (index === 0 || checkpoints[index - 1].claimed) && overlaps(player, checkpoint)
  );

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
      this.restartButton = documentObject.getElementById("restart-btn");
      this.fliesCollectedElement = documentObject.getElementById("flies-collected");
      this.totalFliesElement = documentObject.getElementById("total-flies");
      this.input = new InputController();
      this.assets = loadSprites(windowObject.Image);
      this.state = GameState.READY;
      this.animationFrameId = null;
      this.messageTimeout = null;
      this.previousFrameTime = null;
      this.cameraX = 0;
      this.fliesCollected = 0;
      this.viewport = calculateViewport(windowObject.innerWidth, windowObject.innerHeight, windowObject.devicePixelRatio);
    }
    initialize() {
      this.input.bind(this.window, [...this.document.querySelectorAll("[data-control]")]);
      this.startButton.addEventListener("click", () => this.start());
      this.restartButton.addEventListener("click", () => this.reset());
      this.window.addEventListener("resize", () => this.resize());
      this.resize();
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
      this.level = createLevel();
      this.document.body.classList.add("game-running");
      this.input.reset();
      this.cameraX = 0;
      this.fliesCollected = 0;
      this.fliesCollectedElement.textContent = "0";
      this.totalFliesElement.textContent = String(this.level.flies.length);
      this.checkpointScreen.style.display = "none";
      this.restartButton.style.display = "none";
      this.previousFrameTime = null;
      this.state = GameState.PLAYING;
      this.animationFrameId = this.window.requestAnimationFrame((time) => this.animate(time));
    }
    resize() {
      this.viewport = calculateViewport(
        this.window.innerWidth,
        this.window.innerHeight,
        this.window.devicePixelRatio
      );
      this.canvas.width = Math.round(this.window.innerWidth * this.viewport.devicePixelRatio);
      this.canvas.height = Math.round(this.window.innerHeight * this.viewport.devicePixelRatio);
      this.canvas.style.width = `${this.window.innerWidth}px`;
      this.canvas.style.height = `${this.window.innerHeight}px`;
      this.cameraX = Math.min(this.cameraX, Math.max(0, LEVEL_WIDTH - this.viewport.viewportWidth));
    }
    update(deltaTime) {
      const { player, platforms, blockades, flies, checkpoints } = this.level;
      player.update(deltaTime, this.input, this.state === GameState.PLAYING);
      resolvePlatformCollisions(player, platforms);
      resolveBlockadeCollisions(player, blockades);
      flies.forEach((fly) => {
        if (fly.collectIfTouching(player)) {
          this.fliesCollected += 1;
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
      this.cameraX = Math.max(0, Math.min(targetX, LEVEL_WIDTH - this.viewport.viewportWidth));
    }
    finish() {
      this.state = GameState.FINISHED;
      this.input.reset();
      this.showMessage("Geschafft!", "Du hast die letzte Toilette erreicht!", false);
      this.restartButton.style.display = "inline-block";
    }
    showMessage(title, message, autoHide = true) {
      if (this.messageTimeout !== null) this.window.clearTimeout(this.messageTimeout);
      this.checkpointTitle.textContent = title;
      this.checkpointMessage.textContent = message;
      this.checkpointScreen.style.display = "block";
      if (autoHide) {
        this.messageTimeout = this.window.setTimeout(() => {
          this.checkpointScreen.style.display = "none";
        }, 2e3);
      }
    }
    drawGround() {
      const tileWidth = 200;
      const firstTileX = Math.floor(this.cameraX / tileWidth) * tileWidth;
      const lastVisibleX = this.cameraX + this.viewport.viewportWidth;
      for (let x = firstTileX; x < lastVisibleX + tileWidth; x += tileWidth) {
        this.ctx.drawImage(this.assets.sprites.platform, x - this.cameraX, GROUND_Y, tileWidth, GROUND_HEIGHT);
      }
    }
    draw() {
      const { devicePixelRatio, renderScale } = this.viewport;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.setTransform(devicePixelRatio * renderScale, 0, 0, devicePixelRatio * renderScale, 0, 0);
      this.drawGround();
      this.level.platforms.forEach((item) => item.draw(this.ctx, this.cameraX, this.assets.sprites));
      this.level.blockades.forEach((item) => item.draw(this.ctx, this.cameraX, this.assets.sprites));
      this.level.checkpoints.forEach((item) => item.draw(this.ctx, this.cameraX, this.assets.sprites));
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
