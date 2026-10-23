import { COMBO_WINDOW } from "./score.js";

export const calculateComboProgress = (remaining) => ({
  active: remaining > 0,
  percent: Math.round(Math.max(0, Math.min(1, remaining / COMBO_WINDOW)) * 100),
});
