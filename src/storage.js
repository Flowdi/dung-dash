const STORAGE_KEY = "dung-dash-progress-v1";

const emptyProgress = () => ({
  bestScore: 0,
  bestTime: null,
  totalRuns: 0,
  totalFlies: 0,
  medals: { Bronze: 0, Silber: 0, Gold: 0 },
});

export class ProgressStore {
  constructor(storage) {
    this.storage = storage;
  }

  load() {
    try {
      const saved = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? "null");
      return saved ? { ...emptyProgress(), ...saved } : emptyProgress();
    } catch {
      return emptyProgress();
    }
  }

  record(result) {
    const progress = this.load();
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
    };
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Das Spiel bleibt auch bei deaktiviertem oder vollem Speicher spielbar.
    }
    return next;
  }
}
