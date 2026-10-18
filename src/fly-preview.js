export const buildFlyBreakdown = (flies = []) => {
  const counts = { normal: 0, gold: 0, time: 0 };
  flies.forEach((fly) => {
    const type = fly[2] ?? "normal";
    if (type in counts) counts[type] += 1;
  });
  return [
    { type: "normal", label: "Normal", effect: "500 Punkte", count: counts.normal },
    { type: "gold", label: "Gold", effect: "dreifacher Wert", count: counts.gold },
    { type: "time", label: "Zeit", effect: "−5 Sekunden", count: counts.time },
  ];
};
