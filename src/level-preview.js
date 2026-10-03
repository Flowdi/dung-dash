export const buildLevelPreview = (level) => [
  ["Route", level.mode === "vertical" ? "Vertikal" : "Horizontal"],
  ["Größe", `${level.width.toLocaleString("de-DE")} × ${(level.height ?? 800).toLocaleString("de-DE")}`],
  ["Fliegen", level.flies.length],
  ["Checkpoints", level.checkpoints.length],
  ["Gefahren", level.hazards?.length ?? 0],
];
