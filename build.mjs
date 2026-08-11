import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const projectRoot = dirname(fileURLToPath(import.meta.url));

await build({
  absWorkingDir: projectRoot,
  bundle: true,
  entryPoints: [join(projectRoot, "main.js")],
  format: "iife",
  outfile: join(projectRoot, "game.bundle.js"),
  target: "es2018",
});
