import {
  calculateViewport,
  GameState,
  GROUND_HEIGHT,
  GROUND_Y,
  LEVEL_WIDTH,
  MAX_FRAME_TIME,
} from "./config.js";
import { loadSprites } from "./assets.js";
import { InputController } from "./input.js";
import { createLevel } from "./level.js";
import {
  findReachedCheckpoint,
  resolveBlockadeCollisions,
  resolvePlatformCollisions,
} from "./physics.js";

export class Game {
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
      }, 2000);
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
    const deltaTime = Math.min((timestamp - this.previousFrameTime) / 1000, MAX_FRAME_TIME);
    this.previousFrameTime = timestamp;
    if (this.state === GameState.PLAYING) this.update(deltaTime);
    this.draw();
    this.animationFrameId = this.window.requestAnimationFrame((time) => this.animate(time));
  }
}
