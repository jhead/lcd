/**
 * Convert a timestamp to the start-of-day timestamp in local timezone.
 * Used for bucketing data points by calendar day.
 */
export const toDateKey = (ts: number): number => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
