export const buildRunImprovementTips = (result) => {
  const tips = [];
  const missingFlies = Math.max(0, result.totalFlies - result.fliesCollected);
  if (missingFlies > 0) tips.push(`Noch ${missingFlies} Fliege${missingFlies === 1 ? "" : "n"} sammeln.`);
  if (result.falls > 0) tips.push("Ohne Treffer bleibt die Goldmedaille erreichbar.");
  if (result.bestCombo < 4) tips.push("Fliegen schneller nacheinander sammeln, um ×4 zu erreichen.");
  if (result.elapsedSeconds > 75) tips.push("Unter 75 Sekunden bleiben, um die Goldzeit zu erfüllen.");
  return tips.length ? tips.slice(0, 3) : ["Perfekter Lauf – jetzt zählt nur noch ein neuer persönlicher Rekord!"];
};
