const DATE_PARTS = new Intl.DateTimeFormat("en-CA", {
  year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Berlin",
});

export const playDateKey = (timestamp) => {
  const parts = Object.fromEntries(DATE_PARTS.formatToParts(new Date(timestamp))
    .filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const updatePlayActivity = (totalDays, lastDate, timestamp) => {
  const currentDate = playDateKey(timestamp);
  return {
    totalDays: Math.max(0, Number(totalDays) || 0) + (currentDate === lastDate ? 0 : 1),
    lastDate: currentDate,
  };
};

export const formatActivityDate = (dateKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey ?? "");
  return match ? `${match[3]}.${match[2]}.${match[1]}` : "–";
};

const dayNumber = (dateKey) => Date.parse(`${dateKey}T00:00:00Z`) / 86400000;

export const updateActivityStreak = (current, best, lastDate, currentDate) => {
  const safeCurrent = Math.max(0, Number(current) || 0);
  const difference = lastDate ? dayNumber(currentDate) - dayNumber(lastDate) : null;
  const nextCurrent = difference === 0 ? safeCurrent : difference === 1 ? safeCurrent + 1 : 1;
  return { current: nextCurrent, best: Math.max(Math.max(0, Number(best) || 0), nextCurrent) };
};
