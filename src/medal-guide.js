export const buildMedalRequirements = (totalFlies) => [
  {
    medal: "Gold",
    icon: "🥇",
    requirement: `Alle ${totalFlies} Fliegen · höchstens 75 Sekunden · keine Treffer`,
  },
  {
    medal: "Silber",
    icon: "🥈",
    requirement: `Mindestens ${Math.ceil(totalFlies * 0.75)} Fliegen · höchstens 120 Sekunden`,
  },
  {
    medal: "Bronze",
    icon: "🥉",
    requirement: "Level erfolgreich abschließen",
  },
];
