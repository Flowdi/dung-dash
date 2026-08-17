import {
  calculateViewport,
  GameState,
  GROUND_HEIGHT,
  MAX_FRAME_TIME,
} from "./config.js";
import { loadSprites } from "./assets.js";
import { InputController } from "./input.js";
import { createLevel } from "./level.js";
import { formatTime, RunStats } from "./score.js";
import { ProgressStore } from "./storage.js";
import { LEVELS } from "./levels.js";
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
    this.levelSelect = documentObject.getElementById("level-select");
    this.levelDescription = documentObject.getElementById("level-description");
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
    } catch {
      // file:// und strenge Privatsphärenmodi können den Zugriff vollständig sperren.
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
    });
    this.restartButton.addEventListener("click", () => this.reset());
    this.levelMenuButton.addEventListener("click", () => this.returnToLevelSelect());
    this.pauseButton.addEventListener("click", () => this.togglePause());
    this.window.addEventListener("resize", () => this.resize());
    this.resize();
    this.renderLevelOptions();
  }

  renderLevelOptions() {
    const progress = this.progressStore.load();
    this.levelSelect.replaceChildren();
    LEVELS.forEach((definition, index) => {
      const option = this.document.createElement("option");
      const unlocked = progress.unlockedLevels.includes(definition.id);
      const record = progress.levelRecords?.[definition.id];
      option.value = definition.id;
      option.disabled = !unlocked;
      option.textContent = `${index + 1}. ${definition.name}${record ? ` · ${record.medal}` : ""}${unlocked ? "" : " 🔒"}`;
      this.levelSelect.append(option);
    });
    if (![...this.levelSelect.options].some((option) => option.value === this.selectedLevelId && !option.disabled)) {
      this.selectedLevelId = progress.unlockedLevels[0] ?? LEVELS[0].id;
    }
    this.levelSelect.value = this.selectedLevelId;
    this.updateLevelDescription();
  }

  updateLevelDescription() {
    const definition = LEVELS.find((level) => level.id === this.selectedLevelId) ?? LEVELS[0];
    const record = this.progressStore.load().levelRecords?.[definition.id];
    this.levelDescription.textContent = record
      ? `${definition.description} Bestwert: ${record.bestScore} Punkte.`
      : definition.description;
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
    this.viewport = calculateViewport(
      this.window.innerWidth,
      this.window.innerHeight,
      this.window.devicePixelRatio
    );
    this.canvas.width = Math.round(this.window.innerWidth * this.viewport.devicePixelRatio);
    this.canvas.height = Math.round(this.window.innerHeight * this.viewport.devicePixelRatio);
    this.canvas.style.width = `${this.window.innerWidth}px`;
    this.canvas.style.height = `${this.window.innerHeight}px`;
    const levelWidth = this.level?.width ?? LEVELS[0].width;
    const levelHeight = this.level?.height ?? 800;
    this.cameraX = Math.min(this.cameraX, Math.max(0, levelWidth - this.viewport.viewportWidth));
    this.cameraY = Math.min(this.cameraY, Math.max(0, levelHeight - this.viewport.viewportHeight));
  }

  update(deltaTime) {
    const { player, platforms, blockades, flies, checkpoints } = this.level;
    this.stats.update(deltaTime, this.input.left || this.input.right || this.input.hasBufferedJump);
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
    this.comboElement.textContent = this.stats.combo > 1 ? `Combo ×${this.stats.combo}` : "";
  }

  finish() {
    this.state = GameState.FINISHED;
    this.input.reset();
    const result = this.stats.finish(this.level.flies.length);
    const levelIndex = LEVELS.findIndex((level) => level.id === this.level.id);
    const nextLevelId = LEVELS[levelIndex + 1]?.id ?? null;
    const progress = this.progressStore.record(result, this.level.id, nextLevelId);
    this.runScoreElement.textContent = String(result.score);
    this.showMessage(
      `${result.medal}-Medaille!`,
      `Zeit: ${formatTime(result.elapsedSeconds)} · Fliegen: ${result.fliesCollected}/${result.totalFlies} · ` +
        `Score: ${result.score} · Rekord: ${progress.bestScore}`,
      false
    );
    this.restartButton.style.display = "inline-block";
    this.levelMenuButton.style.display = "inline-block";
    this.pauseButton.hidden = true;
    this.restartButton.focus();
    this.renderLevelOptions();
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
    this.levelSelect.focus();
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.input.reset();
      this.pauseButton.textContent = "Fortsetzen";
      this.pauseButton.setAttribute("aria-pressed", "true");
      this.showMessage("Pause", "Drücke P, Escape oder Fortsetzen.", false);
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
      }, 2000);
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
    const offsetX = (this.cameraX * 0.12) % tileWidth;
    const offsetY = (this.cameraY * 0.12) % tileHeight;
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
    this.level.platforms.forEach((item) =>
      item.draw(this.ctx, this.cameraX, this.assets.sprites, this.level.theme)
    );
    this.level.blockades.forEach((item) =>
      item.draw(this.ctx, this.cameraX, this.assets.sprites, this.level.theme)
    );
    this.level.checkpoints.forEach((item) =>
      item.draw(this.ctx, this.cameraX, this.assets.sprites, this.level.theme)
    );
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
