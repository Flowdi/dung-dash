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
  assert.match(html, /id="current-missions"/);
  assert.match(html, /id="reset-run-btn"/);
  assert.match(html, /id="level-select"/);
  assert.match(html, /id="random-level-btn"/);
  assert.match(html, /class="control-guide"/);
  assert.match(html, /<kbd>Leertaste<\/kbd>/);
  assert.doesNotMatch(html, /id="jump-charge"/);
  assert.match(html, /id="level-menu-btn"/);
  assert.match(html, /id="next-level-btn"/);
  assert.match(html, /id="result-breakdown"/);
  assert.match(html, /id="result-splits"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
});

test("all generated level theme assets are present", async () => {
  const names = ["bathroom", "sewer", "festival", "royal", "porcelain", "pipe"];
  await Promise.all(names.flatMap((name) => [
    access(new URL(`../assets/themes/${name}-background.png`, import.meta.url)),
    access(new URL(`../assets/themes/${name}-atlas.png`, import.meta.url)),
  ]));
});

test("generated hazard atlas is present and loaded", async () => {
  const [assetSource] = await Promise.all([
    readFile(new URL("../src/assets.js", import.meta.url), "utf8"),
    access(new URL("../assets/sprites/hazards-atlas.png", import.meta.url)),
  ]);
  assert.match(assetSource, /hazardsAtlas/);
});

test("backgrounds render as one cover image instead of repeated tiles", async () => {
  const gameSource = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
  assert.match(gameSource, /calculateCoverRect/);
  assert.doesNotMatch(gameSource, /for \(let y = -offsetY/);
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

test("system accessibility preferences disable incidental motion", async () => {
  const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
});

test("start screen exposes career stats and achievements", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="career-stats"/);
  assert.match(html, /id="medal-summary"/);
  assert.match(html, /id="achievement-list"/);
  assert.match(html, /id="reset-progress-btn"/);
  assert.match(html, /id="progress-reset-status"/);
});

test("start screen exposes persistent level missions", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="mission-stars"/);
  assert.match(html, /id="mission-list"/);
});

test("level options and results surface personal records", async () => {
  const gameSource = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
  assert.match(gameSource, /formatTime\(record\.bestTime\)/);
  assert.match(gameSource, /Neuer Level-Highscore!/);
  assert.match(gameSource, /Neue Level-Bestzeit!/);
});

test("pause mode exposes restart and level-selection actions", async () => {
  const gameSource = await readFile(new URL("../src/game.js", import.meta.url), "utf8");
  assert.match(gameSource, /GameState\.PAUSED[\s\S]*?restartButton\.style\.display = "inline-block"/);
  assert.match(gameSource, /GameState\.PAUSED[\s\S]*?levelMenuButton\.style\.display = "inline-block"/);
});
