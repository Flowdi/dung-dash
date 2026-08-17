import assert from "node:assert/strict";
import test from "node:test";

import { calculateViewport } from "../src/config.js";
import { GameState } from "../src/config.js";
import { CheckPoint, Platform, Player } from "../src/entities.js";
import { InputController } from "../src/input.js";
import { createLevel } from "../src/level.js";
import { findReachedCheckpoint, resolvePlatformCollisions } from "../src/physics.js";
import { calculateFinalScore, calculateMedal, formatTime, RunStats } from "../src/score.js";
import { ProgressStore } from "../src/storage.js";
import { LEVELS } from "../src/levels.js";
import { findNewAchievements } from "../src/achievements.js";
import { completedMissionIds, evaluateMissions } from "../src/missions.js";

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

test("solid platforms block fast jumps from below", () => {
  const { player } = createLevel();
  const platform = { position: { x: 500, y: 300 }, width: 200, height: 40, type: "normal", active: true };
  player.previousPosition = { x: 540, y: 370 };
  player.position = { x: 540, y: 250 };
  player.velocity.y = -1600;
  resolvePlatformCollisions(player, [platform]);
  assert.equal(player.position.y, 340);
  assert.equal(player.velocity.y, 0);
});

test("solid platforms block movement from the left and right", () => {
  const { player } = createLevel();
  const platform = { position: { x: 500, y: 450 }, width: 200, height: 40, type: "normal", active: true };

  player.previousPosition = { x: 440, y: 450 };
  player.position = { x: 510, y: 450 };
  player.velocity.x = 300;
  resolvePlatformCollisions(player, [platform]);
  assert.equal(player.position.x, 460);
  assert.equal(player.velocity.x, 0);

  player.previousPosition = { x: 720, y: 450 };
  player.position = { x: 650, y: 450 };
  player.velocity.x = -300;
  resolvePlatformCollisions(player, [platform]);
  assert.equal(player.position.x, 700);
  assert.equal(player.velocity.x, 0);
});

test("only explicitly declared one-way platforms allow jumping through", () => {
  const { player } = createLevel();
  const oneWay = { position: { x: 500, y: 300 }, width: 200, height: 40, type: "one-way", active: true };
  player.previousPosition = { x: 540, y: 370 };
  player.position = { x: 540, y: 250 };
  player.velocity.y = -1600;
  resolvePlatformCollisions(player, [oneWay]);
  assert.equal(player.position.y, 250);
  assert.equal(player.velocity.y, -1600);
  assert.equal(LEVELS.every((level) => level.platforms.every((platform) => platform[2] !== "one-way")), true);
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

test("achievements unlock from run and career progress", () => {
  const achievements = findNewAchievements(
    { totalRuns: 1, totalFlies: 50, achievements: [] },
    { bestCombo: 4, medal: "Gold", elapsedSeconds: 55, falls: 0 }
  );
  assert.deepEqual(
    achievements.map(({ id }) => id),
    ["first-flush", "fly-hunter", "combo-master", "golden-pile", "speed-runner", "sure-footed"]
  );
});

test("progress store persists achievements only once", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const store = new ProgressStore(storage);
  const result = { score: 5000, elapsedSeconds: 55, fliesCollected: 20, medal: "Gold", bestCombo: 4, falls: 0 };
  const first = store.record(result);
  const second = store.record(result);
  assert.ok(first.newAchievements.length > 0);
  assert.equal(second.newAchievements.length, 0);
  assert.deepEqual(second.achievements, first.achievements);
});

test("level missions evaluate time, collection, combo and score goals", () => {
  const missions = [
    { id: "fast", type: "time", target: 60 },
    { id: "flies", type: "flies", target: 10 },
    { id: "combo", type: "combo", target: 4 },
    { id: "score", type: "score", target: 12000 },
  ];
  const result = { elapsedSeconds: 59, fliesCollected: 9, bestCombo: 4, score: 12500 };
  assert.deepEqual(completedMissionIds(missions, result), ["fast", "combo", "score"]);
  assert.equal(evaluateMissions(missions, result)[1].completed, false);
});

test("completed level missions accumulate without duplicates", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const store = new ProgressStore(storage);
  const result = { score: 5000, elapsedSeconds: 80, fliesCollected: 10, medal: "Silber", bestCombo: 2, falls: 0 };
  store.record(result, "bathroom-run", null, ["collector"]);
  const progress = store.record(result, "bathroom-run", null, ["collector", "speed"]);
  assert.deepEqual(progress.levelRecords["bathroom-run"].missions, ["collector", "speed"]);
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

test("every level has its own complete visual theme", () => {
  const backgrounds = new Set(LEVELS.map((level) => level.theme.background));
  const atlases = new Set(LEVELS.map((level) => level.theme.atlas));
  assert.equal(backgrounds.size, LEVELS.length);
  assert.equal(atlases.size, LEVELS.length);
  LEVELS.forEach((level) => {
    assert.equal(level.theme.platformCrop.length, 4);
    assert.equal(level.theme.toiletCrop.length, 4);
    assert.ok(level.theme.platformCrop.every(Number.isFinite));
    assert.ok(level.theme.toiletCrop.every(Number.isFinite));
  });
});

test("every level defines three unique missions", () => {
  LEVELS.forEach((level) => {
    assert.equal(level.missions.length, 3);
    assert.equal(new Set(level.missions.map(({ id }) => id)).size, 3);
  });
});

test("platforms and toilets render from the selected theme atlas", () => {
  const theme = LEVELS[1].theme;
  const atlas = { id: "sewer-atlas" };
  const sprites = { [theme.atlas]: atlas, platform: {}, toilet: {} };
  const calls = [];
  const ctx = { drawImage: (...args) => calls.push(args) };

  new Platform(100, 200).draw(ctx, 10, sprites, theme);
  new CheckPoint(300, 400, 1).draw(ctx, 10, sprites, theme);

  assert.deepEqual(calls[0], [atlas, ...theme.platformCrop, 90, 200, 200, 40]);
  assert.deepEqual(calls[1], [atlas, ...theme.toiletCrop, 290, 400, 40, 70]);
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
