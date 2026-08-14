import assert from "node:assert/strict";
import test from "node:test";

import { calculateViewport } from "../src/config.js";
import { GameState } from "../src/config.js";
import { Player } from "../src/entities.js";
import { InputController } from "../src/input.js";
import { createLevel } from "../src/level.js";
import { findReachedCheckpoint, resolvePlatformCollisions } from "../src/physics.js";
import { calculateFinalScore, calculateMedal, formatTime, RunStats } from "../src/score.js";
import { ProgressStore } from "../src/storage.js";
import { LEVELS } from "../src/levels.js";

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

test("the game exposes a dedicated paused state", () => {
  assert.equal(GameState.PAUSED, "paused");
});

test("P and Escape invoke the pause callback without repeating", () => {
  const listeners = new Map();
  const windowObject = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
  };
  const input = new InputController();
  let pauseCalls = 0;
  input.bind(windowObject, [], { onPause: () => pauseCalls += 1 });

  const event = (key, repeat = false) => ({
    code: key,
    key,
    preventDefault() {},
    repeat,
  });
  listeners.get("keydown")(event("p"));
  listeners.get("keydown")(event("Escape"));
  listeners.get("keydown")(event("p", true));
  assert.equal(pauseCalls, 2);
});

test("run timer starts with the first player input and pauses without updates", () => {
  const stats = new RunStats();
  stats.update(1, false);
  assert.equal(stats.elapsedSeconds, 0);
  stats.update(0.5, true);
  stats.update(0.5, false);
  assert.equal(stats.elapsedSeconds, 1);
  assert.equal(formatTime(stats.elapsedSeconds), "00:01.0");
});

test("collecting flies builds a time-limited combo", () => {
  const stats = new RunStats();
  stats.collectFly();
  stats.update(1, true);
  stats.collectFly();
  assert.equal(stats.combo, 2);
  assert.equal(stats.bestCombo, 2);
  assert.equal(stats.flyScore, 1500);
  stats.update(5, false);
  assert.equal(stats.combo, 0);
});

test("all flies and a fast clean run earn gold and a larger score", () => {
  const perfect = { elapsedSeconds: 60, fliesCollected: 20, totalFlies: 20, falls: 0 };
  const partial = { elapsedSeconds: 120, fliesCollected: 10, totalFlies: 20, falls: 1 };
  assert.equal(calculateMedal(perfect), "Gold");
  assert.ok(calculateFinalScore(perfect) > calculateFinalScore(partial));
});

test("progress store keeps personal records", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const store = new ProgressStore(storage);
  store.record({ score: 1000, elapsedSeconds: 90, fliesCollected: 10, medal: "Bronze" });
  const progress = store.record({ score: 1500, elapsedSeconds: 80, fliesCollected: 20, medal: "Gold" });
  assert.equal(progress.bestScore, 1500);
  assert.equal(progress.bestTime, 80);
  assert.equal(progress.totalRuns, 2);
  assert.equal(progress.totalFlies, 30);
});

test("level definitions create independent data-driven levels", () => {
  const first = createLevel(LEVELS[0].id);
  const second = createLevel(LEVELS[1].id);
  assert.equal(first.id, "bathroom-run");
  assert.equal(second.id, "sewer-shortcut");
  assert.notEqual(first.width, second.width);
  assert.equal(second.player.worldWidth, second.width);
  assert.ok(second.platforms.some((platform) => platform.type === "bounce"));
  assert.ok(second.platforms.some((platform) => platform.type === "fragile"));
});

test("special flies modify score and time", () => {
  const stats = new RunStats();
  stats.update(10, true);
  stats.collectFly("gold");
  assert.equal(stats.flyScore, 1500);
  stats.collectFly("time");
  assert.equal(stats.elapsedSeconds, 5);
});

test("finishing a level unlocks the next level and stores its record", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const store = new ProgressStore(storage);
  const progress = store.record(
    { score: 4000, elapsedSeconds: 70, fliesCollected: 20, medal: "Gold" },
    "bathroom-run",
    "sewer-shortcut"
  );
  assert.ok(progress.unlockedLevels.includes("sewer-shortcut"));
  assert.equal(progress.levelRecords["bathroom-run"].bestScore, 4000);
  assert.equal(progress.levelRecords["bathroom-run"].medal, "Gold");
});

test("bounce and fragile platforms expose their gameplay behavior", () => {
  const { player } = createLevel();
  const bounce = { position: { x: 100, y: 500 }, width: 200, height: 40, type: "bounce", active: true };
  player.position = { x: 120, y: 470 };
  player.previousPosition = { x: 120, y: 450 };
  player.velocity.y = 200;
  resolvePlatformCollisions(player, [bounce]);
  assert.ok(player.velocity.y < 0);

  const fragile = { ...bounce, type: "fragile", active: true };
  player.position = { x: 120, y: 470 };
  player.previousPosition = { x: 120, y: 450 };
  player.velocity.y = 200;
  resolvePlatformCollisions(player, [fragile]);
  assert.equal(fragile.active, false);
});

test("Royal Flush remains a tall vertical level", () => {
  const level = createLevel("royal-flush");
  assert.equal(level.mode, "vertical");
  assert.equal(level.height, 3200);
  assert.equal(level.player.groundY, 3160);
});

test("Royal Flush uses exactly the same direct jump and movement as normal levels", () => {
  const normalPlayer = createLevel("bathroom-run").player;
  const royalPlayer = createLevel("royal-flush").player;
  const normalInput = new InputController();
  const royalInput = new InputController();
  normalPlayer.isGrounded = true;
  royalPlayer.isGrounded = true;
  normalInput.right = true;
  royalInput.right = true;
  normalInput.queueJump();
  royalInput.queueJump();
  normalPlayer.update(1 / 60, normalInput);
  royalPlayer.update(1 / 60, royalInput);
  assert.equal(royalPlayer.velocity.x, normalPlayer.velocity.x);
  assert.equal(royalPlayer.velocity.y, normalPlayer.velocity.y);

  royalInput.right = false;
  royalPlayer.update(1 / 60, royalInput);
  assert.equal(royalPlayer.velocity.x, 0);
});
