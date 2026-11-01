export const isPerfectRun = (result) =>
  result.totalFlies > 0 && result.fliesCollected === result.totalFlies && result.falls === 0;
