import assert from "node:assert/strict";
import test from "node:test";

import { calculateViewport } from "../src/config.js";
import { Player } from "../src/entities.js";
import { InputController } from "../src/input.js";
import { createLevel } from "../src/level.js";
import { findReachedCheckpoint, resolvePlatformCollisions } from "../src/physics.js";

test("a jump starts only while the player is grounded", () => {
  const player = new Player();
  const input = new InputController();
  player.velocity.y = 100;
  input.queueJump();
  player.update(1 / 60, input);
  assert.ok(player.velocity.y > 100);

  player.isGrounded = true;
  player.velocity.y = 0;
  input.queueJump();
  player.update(1 / 60, input);
  assert.ok(player.velocity.y < 0);
});

test("jump strength reaches the highest platform route", () => {
  const { player, platforms } = createLevel();
  const input = new InputController();
  const highestPlatform = platforms.reduce((highest, platform) =>
    platform.position.y < highest.position.y ? platform : highest
  );
  player.position.y = 720;
  player.isGrounded = true;
  input.queueJump();
  let highestPosition = player.position.y;
  for (let frame = 0; frame < 120; frame += 1) {
    player.update(1 / 120, input);
    highestPosition = Math.min(highestPosition, player.position.y);
    if (player.velocity.y >= 0) break;
  }
  assert.ok(highestPosition + player.height <= highestPlatform.position.y);
});

test("coyote time accepts a jump shortly after leaving a platform", () => {
  const player = new Player();
  const input = new InputController();
  player.isGrounded = true;
  player.update(1 / 60, input);
  player.isGrounded = false;
  input.queueJump();
  player.update(1 / 60, input);
  assert.ok(player.velocity.y < 0);
});

test("jump buffering triggers immediately after landing", () => {
  const player = new Player();
  const input = new InputController();
  input.queueJump();
  player.update(1 / 60, input);
  assert.ok(player.velocity.y >= 0);
  player.isGrounded = true;
  player.update(1 / 60, input);
  assert.ok(player.velocity.y < 0);
});

test("the player keeps the gaze direction of movement", () => {
  const player = new Player();
  const input = new InputController();
  input.right = true;
  player.update(1 / 60, input);
  assert.equal(player.lookDirection, "right");
  input.right = false;
  input.left = true;
  player.update(1 / 60, input);
  assert.equal(player.lookDirection, "left");
});

test("landing places the player exactly on a platform", () => {
  const { player, platforms } = createLevel();
  const platform = platforms[0];
  player.position.x = platform.position.x + 20;
  player.previousPosition = { x: player.position.x, y: 400 };
  player.position.y = 420;
  player.velocity.y = 200;
  resolvePlatformCollisions(player, platforms);
  assert.equal(player.position.y, platform.position.y - player.height);
  assert.equal(player.isGrounded, true);
});

test("small viewports preserve an 800-unit world height", () => {
  const viewport = calculateViewport(600, 400, 1);
  assert.equal(viewport.renderScale, 0.5);
  assert.equal(viewport.viewportHeight, 800);
});

test("checkpoints preserve their order", () => {
  const { player, checkpoints } = createLevel();
  player.position = { ...checkpoints[1].position };
  assert.equal(findReachedCheckpoint(player, checkpoints), undefined);
  checkpoints[0].claimed = true;
  assert.equal(findReachedCheckpoint(player, checkpoints), checkpoints[1]);
});

test("creating a new level resets all collectible state", () => {
  const firstLevel = createLevel();
  firstLevel.flies[0].collected = true;
  firstLevel.checkpoints[0].claimed = true;
  const restartedLevel = createLevel();
  assert.equal(restartedLevel.flies.every((fly) => !fly.collected), true);
  assert.equal(restartedLevel.checkpoints.every((checkpoint) => !checkpoint.claimed), true);
});
