const LABELS = ["Einfach", "Normal", "Anspruchsvoll", "Schwer", "Extrem"];

export const formatDifficulty = (difficulty) =>
  `${LABELS[difficulty - 1] ?? LABELS[0]} ${"●".repeat(difficulty)}${"○".repeat(5 - difficulty)}`;
