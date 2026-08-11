const startBtn = document.getElementById("start-btn");
const startScreen = document.querySelector(".start-screen");
const checkpointScreen = document.querySelector(".checkpoint-screen");
const checkpointMessage = document.querySelector(".checkpoint-screen > p");
const fliesCollectedElement = document.getElementById("flies-collected");
const totalFliesElement = document.getElementById("total-flies");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const WORLD_HEIGHT = 800;
const LEVEL_WIDTH = 5000;
const GROUND_HEIGHT = 40;
const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
const GRAVITY = 1800;
const MOVE_SPEED = 300;
const JUMP_SPEED = 1150;
const MAX_FRAME_TIME = 0.05;

const sprites = {
  player: new Image(),
  playerLeft: new Image(),
  playerRight: new Image(),
  fly: new Image(),
  toilet: new Image(),
  platform: new Image(),
};

const spriteSources = {
  player: "./assets/sprites/player.png",
  playerLeft: "./assets/sprites/player-left.png",
  playerRight: "./assets/sprites/player-right.png",
  fly: "./assets/sprites/fly.png",
  toilet: "./assets/sprites/toilet.png",
  platform: "./assets/sprites/platform.png",
};

const spritesReady = Promise.all(
  Object.entries(spriteSources).map(([name, source]) =>
    new Promise((resolve, reject) => {
      sprites[name].addEventListener("load", resolve, { once: true });
      sprites[name].addEventListener(
        "error",
        () => reject(new Error(`Sprite konnte nicht geladen werden: ${source}`)),
        { once: true }
      );
      sprites[name].src = source;
    })
  )
);

let devicePixelRatioValue = 1;
let renderScale = 1;
let viewportWidth = innerWidth;
let viewportHeight = innerHeight;
let cameraX = 0;
let animationFrameId = null;
let previousFrameTime = null;
let gameFinished = false;
let fliesCollected = 0;

const input = {
  left: false,
  right: false,
  jumpQueued: false,
};

const resizeCanvas = () => {
  devicePixelRatioValue = Math.min(window.devicePixelRatio || 1, 2);
  renderScale = Math.min(1, innerHeight / WORLD_HEIGHT);
  viewportWidth = innerWidth / renderScale;
  viewportHeight = innerHeight / renderScale;

  canvas.width = Math.round(innerWidth * devicePixelRatioValue);
  canvas.height = Math.round(innerHeight * devicePixelRatioValue);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;

  cameraX = Math.min(cameraX, Math.max(0, LEVEL_WIDTH - viewportWidth));
};

class Player {
  constructor() {
    this.position = { x: 100, y: 400 };
    this.previousPosition = { ...this.position };
    this.velocity = { x: 0, y: 0 };
    this.width = 40;
    this.height = 40;
    this.isGrounded = false;
    this.lookDirection = "neutral";
  }

  draw() {
    const playerSprite =
      this.lookDirection === "left"
        ? sprites.playerLeft
        : this.lookDirection === "right"
          ? sprites.playerRight
          : sprites.player;

    ctx.drawImage(
      playerSprite,
      this.position.x - cameraX,
      this.position.y,
      this.width,
      this.height
    );
  }

  update(deltaTime) {
    this.previousPosition.x = this.position.x;
    this.previousPosition.y = this.position.y;

    const horizontalInput = Number(input.right) - Number(input.left);
    this.velocity.x = gameFinished ? 0 : horizontalInput * MOVE_SPEED;
    if (horizontalInput < 0) this.lookDirection = "left";
    if (horizontalInput > 0) this.lookDirection = "right";

    if (input.jumpQueued && this.isGrounded && !gameFinished) {
      this.velocity.y = -JUMP_SPEED;
      this.isGrounded = false;
    }
    input.jumpQueued = false;

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
}

class Platform {
  constructor(x, y) {
    this.position = { x, y };
    this.width = 200;
    this.height = 40;
  }

  draw() {
    ctx.drawImage(
      sprites.platform,
      this.position.x - cameraX,
      this.position.y,
      this.width,
      this.height
    );
  }
}

class Blockade {
  constructor(x, y) {
    this.position = { x, y };
    this.width = 40;
    this.height = 200;
  }

  draw() {
    ctx.save();
    ctx.translate(this.position.x - cameraX + this.width, this.position.y);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(sprites.platform, 0, 0, this.height, this.width);
    ctx.restore();
  }
}

class CheckPoint {
  constructor(x, y, order) {
    this.position = { x, y };
    this.width = 40;
    this.height = 70;
    this.order = order;
    this.claimed = false;
  }

  draw() {
    if (!this.claimed) {
      ctx.drawImage(
        sprites.toilet,
        this.position.x - cameraX,
        this.position.y,
        this.width,
        this.height
      );
    }
  }

  claim() {
    this.claimed = true;
  }
}

class Fly {
  constructor(x, y) {
    this.position = { x, y };
    this.bodySize = 10;
    this.collected = false;
  }

  draw() {
    if (!this.collected) {
      const spriteSize = this.bodySize * 4;
      ctx.drawImage(
        sprites.fly,
        this.position.x - cameraX - spriteSize / 2,
        this.position.y - spriteSize / 2,
        spriteSize,
        spriteSize
      );
    }
  }

  checkCollision(player) {
    if (this.collected) return false;

    const distX = player.position.x + player.width / 2 - this.position.x;
    const distY = player.position.y + player.height / 2 - this.position.y;
    if (Math.hypot(distX, distY) < player.width / 2 + this.bodySize) {
      this.collected = true;
      return true;
    }
    return false;
  }
}

const player = new Player();

const platforms = [
  [500, 450], [700, 400], [850, 350], [900, 350], [1050, 150],
  [2500, 450], [2900, 400], [3150, 350], [3900, 450], [4200, 400],
  [4400, 200], [4550, 200], [4700, 150],
].map(([x, y]) => new Platform(x, y));

const blockades = [
  [1210, -10], [2860, 240], [2860, 0], [4860, -10],
].map(([x, y]) => new Blockade(x, y));

const flies = [
  [550, 350], [700, 250], [1100, 450], [1450, 350], [1800, 250],
  [2000, 450], [2300, 350], [2500, 150], [2875, 220], [3000, 450],
  [3250, 250], [3400, 450], [3600, 250], [3780, 750], [3900, 550],
  [4050, 600], [4300, 250], [4500, 100], [4700, 20], [4800, 500],
].map(([x, y]) => new Fly(x, y));

const checkpoints = [
  [1170, 80, 1], [2900, 330, 2], [4800, 80, 3],
].map(([x, y, order]) => new CheckPoint(x, y, order));

totalFliesElement.textContent = flies.length;

const overlaps = (first, second) =>
  first.position.x < second.position.x + second.width &&
  first.position.x + first.width > second.position.x &&
  first.position.y < second.position.y + second.height &&
  first.position.y + first.height > second.position.y;

const resolvePlatformCollisions = () => {
  for (const platform of platforms) {
    const previousBottom = player.previousPosition.y + player.height;
    const currentBottom = player.position.y + player.height;
    const horizontallyOverlapping =
      player.position.x + player.width > platform.position.x &&
      player.position.x < platform.position.x + platform.width;

    if (
      player.velocity.y >= 0 &&
      previousBottom <= platform.position.y &&
      currentBottom >= platform.position.y &&
      horizontallyOverlapping
    ) {
      player.position.y = platform.position.y - player.height;
      player.velocity.y = 0;
      player.isGrounded = true;
    }
  }
};

const resolveBlockadeCollisions = () => {
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

const collectFlies = () => {
  for (const fly of flies) {
    if (fly.checkCollision(player)) {
      fliesCollected += 1;
      fliesCollectedElement.textContent = fliesCollected;
    }
  }
};

const checkCheckpoints = () => {
  checkpoints.forEach((checkpoint, index) => {
    const previousCheckpointClaimed = index === 0 || checkpoints[index - 1].claimed;
    if (
      !checkpoint.claimed &&
      previousCheckpointClaimed &&
      overlaps(player, checkpoint)
    ) {
      checkpoint.claim();

      if (index === checkpoints.length - 1) {
        gameFinished = true;
        input.left = false;
        input.right = false;
        showCheckpointScreen("Du hast die letzte Toilette erreicht!");
      } else {
        showCheckpointScreen("Du hast eine Toilette erreicht!");
      }
    }
  });
};

const updateCamera = () => {
  const targetX = player.position.x - viewportWidth * 0.4;
  cameraX = Math.max(0, Math.min(targetX, LEVEL_WIDTH - viewportWidth));
};

const update = (deltaTime) => {
  player.update(deltaTime);
  resolvePlatformCollisions();
  resolveBlockadeCollisions();
  collectFlies();
  checkCheckpoints();
  updateCamera();
};

const drawGround = () => {
  const tileWidth = 200;
  const firstTileX = Math.floor(cameraX / tileWidth) * tileWidth;
  const lastVisibleX = cameraX + viewportWidth;

  for (let x = firstTileX; x < lastVisibleX + tileWidth; x += tileWidth) {
    ctx.drawImage(
      sprites.platform,
      x - cameraX,
      GROUND_Y,
      tileWidth,
      GROUND_HEIGHT
    );
  }
};

const draw = () => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    devicePixelRatioValue * renderScale,
    0,
    0,
    devicePixelRatioValue * renderScale,
    0,
    0
  );

  drawGround();
  platforms.forEach((platform) => platform.draw());
  blockades.forEach((blockade) => blockade.draw());
  checkpoints.forEach((checkpoint) => checkpoint.draw());
  flies.forEach((fly) => fly.draw());
  player.draw();
};

const animate = (timestamp) => {
  if (previousFrameTime === null) previousFrameTime = timestamp;
  const deltaTime = Math.min((timestamp - previousFrameTime) / 1000, MAX_FRAME_TIME);
  previousFrameTime = timestamp;

  update(deltaTime);
  draw();
  animationFrameId = requestAnimationFrame(animate);
};

const startGame = async () => {
  if (animationFrameId !== null) return;

  startBtn.disabled = true;
  try {
    await spritesReady;
    startScreen.style.display = "none";
    previousFrameTime = null;
    animationFrameId = requestAnimationFrame(animate);
  } catch (error) {
    startBtn.disabled = false;
    checkpointScreen.style.display = "block";
    checkpointMessage.textContent = error.message;
  }
};

const showCheckpointScreen = (message) => {
  checkpointScreen.style.display = "block";
  checkpointMessage.textContent = message;
  if (!gameFinished) {
    setTimeout(() => {
      checkpointScreen.style.display = "none";
    }, 2000);
  }
};

const setMovementKey = (key, isPressed) => {
  if (key === "ArrowLeft") input.left = isPressed;
  if (key === "ArrowRight") input.right = isPressed;
};

startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) {
    event.preventDefault();
  }

  setMovementKey(event.key, true);
  if (
    !event.repeat &&
    (event.key === "ArrowUp" || event.key === " " || event.code === "Space")
  ) {
    input.jumpQueued = true;
  }
});

window.addEventListener("keyup", (event) => {
  setMovementKey(event.key, false);
});

window.addEventListener("blur", () => {
  input.left = false;
  input.right = false;
  input.jumpQueued = false;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
