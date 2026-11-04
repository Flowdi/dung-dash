export const chooseCampaignLevel = (levels, progress) => {
  const unlocked = new Set(progress.unlockedLevels ?? []);
  const available = levels.filter(({ id }) => unlocked.has(id));
  const unfinished = available.find(({ id }) => !progress.levelRecords?.[id]);
  if (unfinished) return { levelId: unfinished.id, reason: "unfinished" };
  const missingStars = available.find(({ id, missions }) =>
    new Set(progress.levelRecords?.[id]?.missions ?? []).size < missions.length
  );
  if (missingStars) return { levelId: missingStars.id, reason: "missions" };
  const missingFlies = available.find((level) =>
    (progress.levelRecords?.[level.id]?.bestFlies ?? 0) < (level.flies?.length ?? 0)
  );
  if (missingFlies) return { levelId: missingFlies.id, reason: "collection" };
  const missingGold = available.find(({ id }) => progress.levelRecords?.[id]?.medal !== "Gold");
  if (missingGold) return { levelId: missingGold.id, reason: "gold" };
  return { levelId: available.at(-1)?.id ?? levels[0]?.id ?? null, reason: "complete" };
};

export const campaignButtonLabel = (reason) => ({
  unfinished: "Kampagne fortsetzen",
  missions: "Offene Missionen spielen",
  collection: "Fehlende Fliegen sammeln",
  gold: "Nächste Goldmedaille holen",
  complete: "Lieblingslevel wiederholen",
}[reason] ?? "Kampagne spielen");
