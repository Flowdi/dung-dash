const RUN_DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export const formatRunDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : RUN_DATE_FORMAT.format(date);
};
