import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("index loads the classic bundle for direct file usage", async () => {
  const [html, bundle] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../game.bundle.js", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<script defer src="\.\/game\.bundle\.js"><\/script>/);
  assert.doesNotMatch(html, /<script[^>]+type="module"/);
  assert.doesNotMatch(bundle, /^\s*(?:import|export)\s/m);
  assert.match(html, /aria-label="Spielfeld von Dung Dash"/);
  assert.match(html, /id="pause-btn"/);
  assert.match(html, /id="level-select"/);
  assert.doesNotMatch(html, /id="jump-charge"/);
  assert.match(html, /id="level-menu-btn"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
});

test("all generated level theme assets are present", async () => {
  const names = ["bathroom", "sewer", "festival", "royal"];
  await Promise.all(names.flatMap((name) => [
    access(new URL(`../assets/themes/${name}-background.png`, import.meta.url)),
    access(new URL(`../assets/themes/${name}-atlas.png`, import.meta.url)),
  ]));
});

test("HUD and transient checkpoint messages use separate screen corners", async () => {
  const [gameSource, styles] = await Promise.all([
    readFile(new URL("../src/game.js", import.meta.url), "utf8"),
    readFile(new URL("../styles.css", import.meta.url), "utf8"),
  ]);
  assert.match(gameSource, /classList\.toggle\("toast", autoHide\)/);
  assert.match(styles, /\.score\s*\{[\s\S]*?left:\s*max\(12px/);
  assert.match(styles, /\.checkpoint-screen\.toast\s*\{[\s\S]*?right:\s*max\(12px/);
});

test("start screen exposes career stats and achievements", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="career-stats"/);
  assert.match(html, /id="achievement-list"/);
});

test("start screen exposes persistent level missions", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="mission-stars"/);
  assert.match(html, /id="mission-list"/);
});
