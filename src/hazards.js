const HAZARD_CROPS = {
  brush: [0, 0, 627, 1254],
  water: [627, 0, 627, 1254],
};

export class Hazard {
  constructor(x, y, type, options = {}) {
    this.position = { x, y };
    this.type = type;
    this.width = options.width ?? (type === "brush" ? 80 : 70);
    this.height = options.height ?? (type === "brush" ? 110 : 130);
    this.phase = options.phase ?? 0;
    this.elapsed = 0;
    this.activeDuration = options.activeDuration ?? 1.5;
    this.inactiveDuration = options.inactiveDuration ?? 1.1;
    this.active = true;
    this.hitCooldown = 0;
  }

  update(deltaTime) {
    this.elapsed += deltaTime;
    this.hitCooldown = Math.max(0, this.hitCooldown - deltaTime);
    if (this.type === "water") {
      const cycle = this.activeDuration + this.inactiveDuration;
      this.active = (this.elapsed + this.phase) % cycle < this.activeDuration;
    }
  }

  touches(player) {
    return this.active && this.hitCooldown === 0 &&
      player.position.x < this.position.x + this.width &&
      player.position.x + player.width > this.position.x &&
      player.position.y < this.position.y + this.height &&
      player.position.y + player.height > this.position.y;
  }

  applyTo(player) {
    this.hitCooldown = 0.65;
    if (this.type !== "water") return "respawn";
    const playerCenter = player.position.x + player.width / 2;
    const hazardCenter = this.position.x + this.width / 2;
    const direction = playerCenter < hazardCenter ? -1 : 1;
    player.position.x += direction * 35;
    player.velocity.x = direction * 650;
    player.velocity.y = -620;
    player.isGrounded = false;
    player.supportPlatform = null;
    return "push";
  }

  draw(ctx, cameraX, sprites) {
    if (this.type === "water" && !this.active) return;
    const atlas = sprites.hazardsAtlas;
    const crop = HAZARD_CROPS[this.type];
    if (this.type === "brush") {
      ctx.save();
      ctx.translate(this.position.x - cameraX + this.width / 2, this.position.y + this.height / 2);
      ctx.rotate(this.elapsed * 3.2);
      ctx.drawImage(atlas, ...crop, -this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
      return;
    }
    ctx.drawImage(
      atlas,
      ...crop,
      this.position.x - cameraX,
      this.position.y,
      this.width,
      this.height
    );
  }
}

export const respawnAtCheckpoint = (player, position, stats, input) => {
  player.position = { ...position };
  player.previousPosition = { ...position };
  player.velocity = { x: 0, y: 0 };
  player.supportPlatform = null;
  player.isGrounded = false;
  stats.registerFall();
  input.reset();
};
