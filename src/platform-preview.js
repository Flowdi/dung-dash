const GROUPS = {
  normal: { label: "Fest", effect: "solide" },
  bounce: { label: "Sprung", effect: "katapultiert" },
  fragile: { label: "Brüchig", effect: "kehrt zurück" },
  moving: { label: "Beweglich", effect: "fährt eine Route" },
  timed: { label: "Zeit", effect: "verschwindet" },
  conveyor: { label: "Förderband", effect: "schiebt seitlich" },
};

const groupType = (type = "normal") => {
  if (type.startsWith("moving-")) return "moving";
  if (type.startsWith("conveyor-")) return "conveyor";
  return type in GROUPS ? type : "normal";
};

export const buildPlatformBreakdown = (platforms = []) => {
  const counts = Object.fromEntries(Object.keys(GROUPS).map((type) => [type, 0]));
  platforms.forEach((platform) => counts[groupType(platform[2])] += 1);
  return Object.entries(GROUPS)
    .filter(([type]) => counts[type] > 0)
    .map(([type, details]) => ({ type, count: counts[type], ...details }));
};
