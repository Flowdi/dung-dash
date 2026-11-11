export const buildRecordBadges = (flags = {}) => [
  ...(flags.score ? ["Score-PB"] : []),
  ...(flags.time ? ["Zeit-PB"] : []),
];
