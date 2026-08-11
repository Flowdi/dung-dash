const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const createGame = () => {
  const elements = new Map();
  const getElement = (key) => {
    if (!elements.has(key)) {
      elements.set(key, {
        addEventListener(type, listener) {
          this.listeners ||= {};
          this.listeners[type] = listener;
        },
        disabled: false,
        style: {},
        textContent: "",
      });
    }
    return elements.get(key);
  };

  const context = {
    console,
    devicePixelRatio: 1,
    document: {
      getElementById: getElement,
      querySelector: getElement,
    },
    Image: class {
      addEventListener(type, listener) {
        this.listeners ||= {};
        this.listeners[type] = listener;
      }

      set src(value) {
        this.source = value;
        this.listeners.load();
      }
    },
    innerHeight: 800,
    innerWidth: 1200,
    requestAnimationFrame: () => 1,
    setTimeout,
  };

  context.window = {
    addEventListener() {},
    devicePixelRatio: 1,
  };

  getElement("canvas").getContext = () => ({
    clearRect() {},
    drawImage() {},
    restore() {},
    rotate() {},
    save() {},
    setTransform() {},
    translate() {},
  });

  vm.createContext(context);
  const scriptPath = path.join(__dirname, "..", "script.js");
  const source = fs.readFileSync(scriptPath, "utf8");
  vm.runInContext(
    `${source}\nglobalThis.gameTestApi = { input, player, platforms, checkpoints, resizeCanvas, resolvePlatformCollisions, checkCheckpoints, getRenderScale: () => renderScale, getViewportHeight: () => viewportHeight };`,
    context
  );

  return { context, elements, game: context.gameTestApi };
};

test("a jump starts only while the player is grounded", () => {
  const { game } = createGame();

  game.player.isGrounded = false;
  game.player.velocity.y = 100;
  game.input.jumpQueued = true;
  game.player.update(1 / 60);
  assert.ok(game.player.velocity.y > 100);

  game.player.isGrounded = true;
  game.player.position.y = 700;
  game.player.velocity.y = 0;
  game.input.jumpQueued = true;
  game.player.update(1 / 60);
  assert.ok(game.player.velocity.y < 0);
});

test("landing places the player exactly on top of a platform", () => {
  const { game } = createGame();
  const platform = game.platforms[0];

  game.player.position.x = platform.position.x + 20;
  game.player.previousPosition = { x: game.player.position.x, y: 400 };
  game.player.position.y = 420;
  game.player.velocity.y = 200;
  game.resolvePlatformCollisions();

  assert.equal(game.player.position.y, platform.position.y - game.player.height);
  assert.equal(game.player.velocity.y, 0);
  assert.equal(game.player.isGrounded, true);
});

test("small viewports scale the world to a stable 800-unit height", () => {
  const { context, game } = createGame();
  context.innerHeight = 400;
  context.innerWidth = 600;
  game.resizeCanvas();

  assert.equal(game.getRenderScale(), 0.5);
  assert.equal(game.getViewportHeight(), 800);
});

test("checkpoints use rectangle collision and preserve their order", () => {
  const { game } = createGame();
  const secondCheckpoint = game.checkpoints[1];

  game.player.position = {
    x: secondCheckpoint.position.x,
    y: secondCheckpoint.position.y,
  };
  game.checkCheckpoints();
  assert.equal(secondCheckpoint.claimed, false);

  game.checkpoints[0].claimed = true;
  game.checkCheckpoints();
  assert.equal(secondCheckpoint.claimed, true);
});
