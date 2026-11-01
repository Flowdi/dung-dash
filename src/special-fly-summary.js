export const buildSpecialFlySummary = (specialFlies = {}) => [
  ["Goldfliegen", Math.max(0, Number(specialFlies.gold) || 0)],
  ["Zeitfliegen", Math.max(0, Number(specialFlies.time) || 0)],
];
