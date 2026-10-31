export const buildPauseHelp = ({ hasCheckpoint = false } = {}) => [
  "P/Escape fortsetzen",
  "R Level neu starten",
  ...(hasCheckpoint ? ["C zum Checkpoint"] : []),
  "F Vollbild",
  "H Fokusmodus",
].join(" · ");
