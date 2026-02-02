import { useMemo } from 'react';
import { TOP150_TOTALS, type HistoryEntry, type LSRSnapshot } from '../shared/types';
import { toDateKey, toDateStr, predictMilestoneDate } from '../shared/utils';

export interface ProgressionChartPoint {
  date: string;
  Easy: number | null;
  Medium: number | null;
  Hard: number | null;
}

export interface SkillDataPoint {
  name: string;
  value: number;
}

export interface DashboardData {
  current: HistoryEntry;
  chartData: ProgressionChartPoint[];
  normalizedLsrHistory: LSRSnapshot[];
  skillData: SkillDataPoint[];
  lc150Prediction: Date | null;
  masteryPrediction: Date | null;
  lcProgress: number;
  masteryProgress: number;
}

export function useDashboardData(
  history: HistoryEntry[],
  lsrHistory: LSRSnapshot[]
): DashboardData | null {
  return useMemo(() => {
    if (history.length === 0) return null;

    const current = history[history.length - 1];

    const lcByDate = new Map<number, HistoryEntry>();
    for (const entry of history) {
      const dateKey = toDateKey(entry.timestamp);
      const existing = lcByDate.get(dateKey);
      if (!existing || entry.timestamp > existing.timestamp) {
        lcByDate.set(dateKey, entry);
      }
    }

    const lsrByDate = new Map<number, LSRSnapshot>();
    for (const entry of lsrHistory) {
      const dateKey = toDateKey(entry.timestamp);
      const existing = lsrByDate.get(dateKey);
      if (!existing || entry.timestamp > existing.timestamp) {
        lsrByDate.set(dateKey, entry);
      }
    }

    const allTimestamps = [...history.map(e => e.timestamp), ...lsrHistory.map(e => e.timestamp)];
    const minTs = Math.min(...allTimestamps);
    const maxTs = Math.max(...allTimestamps);
    const startDate = toDateKey(minTs);
    const endDate = toDateKey(maxTs);

    const allDates: number[] = [];
    for (let d = startDate; d <= endDate; d += 24 * 60 * 60 * 1000) {
      allDates.push(d);
    }

    const chartData: ProgressionChartPoint[] = allDates.map(dateKey => {
      const lcEntry = lcByDate.get(dateKey);
      return {
        date: toDateStr(dateKey),
        Easy: lcEntry?.total_easy ?? null,
        Medium: lcEntry?.total_medium ?? null,
        Hard: lcEntry?.total_hard ?? null,
      };
    });

    let lastKnown: LSRSnapshot | null = null;
    const normalizedLsrHistory: LSRSnapshot[] = allDates.map(dateKey => {
      const lsrEntry = lsrByDate.get(dateKey);
      if (lsrEntry) {
        lastKnown = lsrEntry;
        return lsrEntry;
      }
      return lastKnown ?? {
        id: 0,
        timestamp: dateKey,
        strong: 0,
        learning: 0,
        weak: 0,
        leech: 0,
        unknown: 0,
        total: 0,
      };
    });

    let skillData: SkillDataPoint[] = [];
    try {
      const skills = JSON.parse(current.tags_json || '{}');
      const allSkills = [
        ...(skills.advanced || []),
        ...(skills.intermediate || []),
        ...(skills.fundamental || []),
      ];
      skillData = allSkills
        .map((skill: { tagName?: string; problemsSolved?: number }) => ({
          name: skill.tagName || 'Unknown',
          value: skill.problemsSolved || 0,
        }))
        .sort((a, b) => b.value - a.value);
    } catch {
      // Ignore parse errors
    }

    const top150Total = TOP150_TOTALS.easy + TOP150_TOTALS.medium + TOP150_TOTALS.hard;
    const lc150Prediction = (() => {
      const points = Array.from(lcByDate.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(e => ({ value: e.total_easy + e.total_medium + e.total_hard }));
      return predictMilestoneDate(points, top150Total);
    })();

    const masteryPrediction = (() => {
      if (lsrHistory.length === 0) return null;
      const latest = lsrHistory[lsrHistory.length - 1];
      const reviewedTotal = latest.strong + latest.learning + latest.weak + latest.leech;
      if (reviewedTotal === 0) return null;
      const points = Array.from(lsrByDate.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(e => ({ value: e.strong }));
      return predictMilestoneDate(points, reviewedTotal);
    })();

    const lcProgress = Math.min(
      100,
      ((current.total_easy + current.total_medium + current.total_hard) / top150Total) * 100
    );

    const masteryProgress = (() => {
      if (lsrHistory.length === 0) return 0;
      const latest = lsrHistory[lsrHistory.length - 1];
      const reviewedTotal = latest.strong + latest.learning + latest.weak + latest.leech;
      if (reviewedTotal === 0) return 0;
      return Math.min(100, (latest.strong / reviewedTotal) * 100);
    })();

    return {
      current,
      chartData,
      normalizedLsrHistory,
      skillData,
      lc150Prediction,
      masteryPrediction,
      lcProgress,
      masteryProgress,
    };
  }, [history, lsrHistory]);
}
