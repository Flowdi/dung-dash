const SCORE_PER_FLY = 500;
const COMPLETION_BONUS = 2000;
const ALL_FLIES_BONUS = 3000;
const MAX_TIME_BONUS = 6000;
const TIME_BONUS_PER_SECOND = 40;
const COMBO_WINDOW = 4;

export const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(1).padStart(4, "0")}`;
};

export const calculateMedal = ({ elapsedSeconds, fliesCollected, totalFlies, falls }) => {
  if (fliesCollected === totalFlies && elapsedSeconds <= 75 && falls === 0) return "Gold";
  if (fliesCollected >= Math.ceil(totalFlies * 0.75) && elapsedSeconds <= 120) return "Silber";
  return "Bronze";
};

export const calculateFinalScore = ({ elapsedSeconds, fliesCollected, totalFlies, falls }) => {
  const flyScore = fliesCollected * SCORE_PER_FLY;
  const timeBonus = Math.max(0, Math.round(MAX_TIME_BONUS - elapsedSeconds * TIME_BONUS_PER_SECOND));
  const collectionBonus = fliesCollected === totalFlies ? ALL_FLIES_BONUS : 0;
  const fallPenalty = falls * 250;
  return Math.max(0, flyScore + timeBonus + collectionBonus + COMPLETION_BONUS - fallPenalty);
};

export class RunStats {
  constructor() {
    this.elapsedSeconds = 0;
    this.started = false;
    this.fliesCollected = 0;
    this.flyScore = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboRemaining = 0;
    this.falls = 0;
  }

  update(deltaTime, hasPlayerInput) {
    if (hasPlayerInput) this.started = true;
    if (!this.started) return;
    this.elapsedSeconds += deltaTime;
    this.comboRemaining = Math.max(0, this.comboRemaining - deltaTime);
    if (this.comboRemaining === 0) this.combo = 0;
  }

  collectFly(type = "normal") {
    this.fliesCollected += 1;
    this.combo = this.comboRemaining > 0 ? this.combo + 1 : 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboRemaining = COMBO_WINDOW;
    const typeMultiplier = type === "gold" ? 3 : 1;
    this.flyScore += SCORE_PER_FLY * Math.min(this.combo, 4) * typeMultiplier;
    if (type === "time") this.elapsedSeconds = Math.max(0, this.elapsedSeconds - 5);
  }

  finish(totalFlies) {
    const result = {
      elapsedSeconds: this.elapsedSeconds,
      fliesCollected: this.fliesCollected,
      totalFlies,
      falls: this.falls,
      bestCombo: this.bestCombo,
      flyScore: this.flyScore,
    };
    return {
      ...result,
      medal: calculateMedal(result),
      score: calculateFinalScore(result) - result.fliesCollected * SCORE_PER_FLY + result.flyScore,
    };
  }
}
