const BACKUP_FORMAT = "dung-dash-progress";
const BACKUP_VERSION = 1;

export const serializeProgressBackup = (progress) => JSON.stringify({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  progress,
}, null, 2);

export const parseProgressBackup = (text) => {
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error("Die Sicherung enthält kein gültiges JSON.");
  }
  if (backup?.format !== BACKUP_FORMAT || backup?.version !== BACKUP_VERSION ||
      !backup.progress || typeof backup.progress !== "object" || Array.isArray(backup.progress)) {
    throw new Error("Die Sicherung gehört nicht zu dieser Dung-Dash-Version.");
  }
  return backup.progress;
};
