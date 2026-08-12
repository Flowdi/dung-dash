import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const files = [
  "main.js",
  "build.mjs",
  "game.bundle.js",
  ...readdirSync("src").filter((file) => file.endsWith(".js")).map((file) => join("src", file)),
  ...readdirSync("tests").filter((file) => file.endsWith(".js")).map((file) => join("tests", file)),
];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
