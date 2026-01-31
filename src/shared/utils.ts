/**
 * Convert a timestamp to the start-of-day UTC timestamp.
 * Used for bucketing data points by calendar day (consistent across server/client/timezones).
 */
export const toDateKey = (ts: number): number => {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};
