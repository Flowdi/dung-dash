import { formatTime } from "./score.js";

export const createRunSummary = (levelName, result, missionResults = []) => {
  const completedMissions = missionResults.filter(({ completed }) => completed).length;
  return [
    `Dung Dash – ${levelName}`,
    `${result.medal}-Medaille · ${result.score} Punkte`,
    `Zeit ${formatTime(result.elapsedSeconds)} · Fliegen ${result.fliesCollected}/${result.totalFlies} · Treffer ${result.falls}`,
    `Missionen ${completedMissions}/${missionResults.length}`,
  ].join("\n");
};

export const copyText = async (text, navigatorObject, documentObject) => {
  if (navigatorObject?.clipboard?.writeText) {
    await navigatorObject.clipboard.writeText(text);
    return true;
  }
  if (!documentObject?.execCommand) return false;
  const input = documentObject.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  documentObject.body.append(input);
  input.select();
  const copied = documentObject.execCommand("copy");
  input.remove();
  return copied;
};
