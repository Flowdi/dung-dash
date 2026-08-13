import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.match(html, /id="jump-charge"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
});
