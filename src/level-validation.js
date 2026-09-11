const PLATFORM_TYPES = new Set([
  undefined, "normal", "bounce", "fragile", "moving-x", "moving-y",
  "timed", "conveyor-left", "conveyor-right", "one-way",
]);

export const validateLevelDefinitions = (levels) => {
  const ids = new Set();
  levels.forEach((level) => {
    if (!level.id || ids.has(level.id)) throw new Error(`Ungültige oder doppelte Level-ID: ${level.id}`);
    ids.add(level.id);
    if (!(level.width > 0) || !((level.height ?? 800) > 0)) {
      throw new Error(`Ungültige Levelgröße: ${level.id}`);
    }
    if (!level.theme?.background || !level.theme?.atlas) {
      throw new Error(`Unvollständiges Levelthema: ${level.id}`);
    }
    if (!Array.isArray(level.missions) || level.missions.length !== 3) {
      throw new Error(`Jedes Level benötigt drei Missionen: ${level.id}`);
    }
    if (level.platforms.some((platform) => !PLATFORM_TYPES.has(platform[2]))) {
      throw new Error(`Unbekannter Plattformtyp: ${level.id}`);
    }
    const checkpointOrders = level.checkpoints.map((checkpoint) => checkpoint[2]);
    if (checkpointOrders.some((order, index) => order !== index + 1)) {
      throw new Error(`Checkpoint-Reihenfolge ist ungültig: ${level.id}`);
    }
  });
  return levels;
};
