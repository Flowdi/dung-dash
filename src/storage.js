import { findNewAchievements } from "./achievements.js";
import { LEVELS } from "./levels.js";

const STORAGE_KEY = "dung-dash-progress-v1";

const emptyProgress = () => ({
  bestScore: 0,
  bestTime: null,
  totalRuns: 0,
  totalFlies: 0,
  medals: { Bronze: 0, Silber: 0, Gold: 0 },
  unlockedLevels: ["bathroom-run"],
  levelRecords: {},
  achievements: [],
});

const LEVEL_ORDER = LEVELS.map(({ id }) => id);

const migrateUnlockedLevels = (progress) => {
  const unlocked = new Set(progress.unlockedLevels ?? [LEVEL_ORDER[0]]);
  LEVEL_ORDER.slice(0, -1).forEach((levelId, index) => {
    if (progress.levelRecords?.[levelId]) unlocked.add(LEVEL_ORDER[index + 1]);
  });
  return [...unlocked];
};

export const countCompletedMissions = (progress) => Object.values(progress.levelRecords ?? {})
  .reduce((total, record) => total + new Set(record.missions ?? []).size, 0);

export class ProgressStore {
  constructor(storage) {
    this.storage = storage;
  }

  load() {
    try {
      const saved = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? "null");
      const progress = saved ? { ...emptyProgress(), ...saved } : emptyProgress();
      return { ...progress, unlockedLevels: migrateUnlockedLevels(progress) };
    } catch {
      return emptyProgress();
    }
  }

  clear() {
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Auch ohne verfügbaren Speicher kann mit einem leeren Fortschritt weitergespielt werden.
    }
    return emptyProgress();
  }

  record(result, levelId = "bathroom-run", nextLevelId = null, completedMissions = []) {
    const progress = this.load();
    const previousLevelRecord = progress.levelRecords?.[levelId];
    const isNewBestTime = previousLevelRecord?.bestTime == null || result.elapsedSeconds < previousLevelRecord.bestTime;
    const next = {
      ...progress,
      bestScore: Math.max(progress.bestScore, result.score),
      bestTime: progress.bestTime === null ? result.elapsedSeconds : Math.min(progress.bestTime, result.elapsedSeconds),
      totalRuns: progress.totalRuns + 1,
      totalFlies: progress.totalFlies + result.fliesCollected,
      medals: {
        ...progress.medals,
        [result.medal]: (progress.medals[result.medal] ?? 0) + 1,
      },
      unlockedLevels: [...new Set([
        ...(progress.unlockedLevels ?? ["bathroom-run"]),
        ...(nextLevelId ? [nextLevelId] : []),
      ])],
      levelRecords: {
        ...(progress.levelRecords ?? {}),
        [levelId]: {
          bestScore: Math.max(progress.levelRecords?.[levelId]?.bestScore ?? 0, result.score),
          bestTime: progress.levelRecords?.[levelId]?.bestTime == null
            ? result.elapsedSeconds
            : Math.min(progress.levelRecords[levelId].bestTime, result.elapsedSeconds),
          bestSplits: isNewBestTime
            ? (result.checkpointSplits ?? []).map((split) => ({ ...split }))
            : (previousLevelRecord.bestSplits ?? []),
          medal: this.bestMedal(progress.levelRecords?.[levelId]?.medal, result.medal),
          missions: [...new Set([
            ...(progress.levelRecords?.[levelId]?.missions ?? []),
            ...completedMissions,
          ])],
        },
      },
    };
    const newAchievements = findNewAchievements(next, result);
    next.achievements = [...(progress.achievements ?? []), ...newAchievements.map(({ id }) => id)];
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Das Spiel bleibt auch bei deaktiviertem oder vollem Speicher spielbar.
    }
    return { ...next, newAchievements };
  }

  bestMedal(current, candidate) {
    const rank = { Bronze: 1, Silber: 2, Gold: 3 };
    return (rank[candidate] ?? 0) >= (rank[current] ?? 0) ? candidate : current;
  }
}
