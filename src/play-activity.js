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
