import {
  COYOTE_TIME,
  GRAVITY,
  GROUND_Y,
  JUMP_SPEED,
  LEVEL_WIDTH,
  MOVE_SPEED,
} from "./config.js";

export class Player {
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
  constructor(x, y) {
    this.position = { x, y };
    this.width = 200;
    this.height = 40;
  }

  draw(ctx, cameraX, sprites) {
    ctx.drawImage(sprites.platform, this.position.x - cameraX, this.position.y, this.width, this.height);
  }
}

export class Blockade {
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
}

export class CheckPoint {
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
}

export class Fly {
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
}
