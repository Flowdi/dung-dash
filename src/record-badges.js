export const buildRecordBadges = (flags = {}) => [
  ...(flags.score ? ["Score-PB"] : []),
  ...(flags.time ? ["Zeit-PB"] : []),
];

export const buildDailyRecordBadges = (flags = {}) => [
  ...(flags.score ? ["Tages-Score-PB"] : []),
  ...(flags.time ? ["Tages-Zeit-PB"] : []),
];
