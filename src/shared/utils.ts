import { REGRESSION_WINDOW_DAYS, MAX_PREDICTION_DAYS } from './constants';

/**
 * Convert a timestamp to midnight UTC for that calendar day.
 * Used for bucketing so server (UTC) and clients in any timezone see consistent daily boundaries.
 */
export function toDateKey(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Get date string from timestamp (e.g. "Jan 15") - uses UTC for consistency with toDateKey */
export function toDateStr(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Format timestamp for display (e.g. "Jan 15, 3:45 PM") */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format prediction date (short format like "Mar 15") */
export function formatPredictionDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Predict milestone date using linear regression on last N days */
export function predictMilestoneDate(
  dataPoints: Array<{ value: number }>,
  target: number
): Date | null {
  if (dataPoints.length < 3) return null;
  const recent = dataPoints.slice(-REGRESSION_WINDOW_DAYS);
  const n = recent.length;
  const current = recent[n - 1].value;

  if (current >= target) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recent[i].value;
    sumXY += i * recent[i].value;
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  if (slope <= 0) return null;

  const daysToGoal = (target - current) / slope;

  if (daysToGoal > MAX_PREDICTION_DAYS) return null;

  const predictionDate = new Date();
  predictionDate.setDate(predictionDate.getDate() + Math.ceil(daysToGoal));
  return predictionDate;
}
