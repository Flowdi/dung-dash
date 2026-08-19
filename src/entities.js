import {
  COYOTE_TIME,
  GRAVITY,
  GROUND_Y,
  JUMP_SPEED,
  LEVEL_WIDTH,
  MOVE_SPEED,
} from "./config.js";

const drawThemeSprite = (ctx, sprites, theme, cropName, fallbackName, x, y, width, height) => {
  const atlas = theme?.atlas ? sprites[theme.atlas] : null;
  const crop = theme?.[cropName];
  if (atlas && crop) {
    ctx.drawImage(atlas, ...crop, x, y, width, height);
  } else {
    ctx.drawImage(sprites[fallbackName], x, y, width, height);
  }
};

export class Player {
  constructor(spawn = { x: 100, y: 400 }, options = {}) {
    this.position = { ...spawn };
    this.previousPosition = { ...this.position };
    this.velocity = { x: 0, y: 0 };
    this.width = 40;
    this.height = 40;
    this.isGrounded = false;
    this.coyoteTimeRemaining = 0;
    this.lookDirection = "neutral";
    this.worldWidth = options.worldWidth ?? LEVEL_WIDTH;
    this.groundY = options.groundY ?? GROUND_Y;
    this.supportPlatform = null;
  }

  followSupportPlatform() {
    if (!this.supportPlatform?.active) return;
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
    const sprite =
      this.lookDirection === "left"
        ? sprites.playerLeft
        : this.lookDirection === "right"
          ? sprites.playerRight
          : sprites.player;
    ctx.drawImage(sprite, this.position.x - cameraX, this.position.y, this.width, this.height);
  }
}

export class Platform {
  constructor(x, y, type = "normal", options = {}) {
    this.position = { x, y };
    this.previousPosition = { ...this.position };
    this.origin = { ...this.position };
    this.width = 200;
    this.height = 40;
    this.type = type;
    this.active = true;
    this.range = options.range ?? 140;
    this.speed = options.speed ?? 110;
    this.phase = options.phase ?? 0;
    this.elapsed = 0;
    this.movementDelta = { x: 0, y: 0 };
    this.movementVelocity = { x: 0, y: 0 };
  }

  update(deltaTime) {
    this.previousPosition = { ...this.position };
    if (this.type !== "moving-x" && this.type !== "moving-y") {
      this.movementDelta = { x: 0, y: 0 };
      this.movementVelocity = { x: 0, y: 0 };
      return;
    }
    this.elapsed += deltaTime;
    const offset = Math.sin(this.phase + this.elapsed * this.speed / this.range) * this.range;
    if (this.type === "moving-x") this.position.x = this.origin.x + offset;
    if (this.type === "moving-y") this.position.y = this.origin.y + offset;
    this.movementDelta = {
      x: this.position.x - this.previousPosition.x,
      y: this.position.y - this.previousPosition.y,
    };
    this.movementVelocity = {
      x: this.movementDelta.x / deltaTime,
      y: this.movementDelta.y / deltaTime,
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
}

export class Blockade {
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
}

export class CheckPoint {
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
}

export class Fly {
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
}
