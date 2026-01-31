/**
 * Convert a timestamp to midnight UTC for that calendar day.
 * Used for bucketing so server (UTC) and clients in any timezone see consistent daily boundaries.
 */
export const toDateKey = (ts: number): number => {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};
