import { useState, useEffect } from 'react';
import { TOP150_TOTALS, type HistoryEntry, type LSRSnapshot } from '../shared/types';
import {
  MAX_SKILLS_DISPLAYED,
  MAX_PREDICTION_DAYS,
  REGRESSION_WINDOW_DAYS,
  API_URL,
} from '../shared/constants';
import { toDateKey } from '../shared/utils';
import TotalsPieChart from './TotalsPieChart';
import CombinedStatsCard from './CombinedStatsCard';
import MasteryChart from './MasteryChart';
import MasteryStatsCard from './MasteryStatsCard';
import ProgressionChart from './ProgressionChart';
import SkillsChart from './SkillsChart';
import ProgressRing from './ProgressRing';
import ActivityLog from './ActivityLog';
import CommentBox from './CommentBox';

interface DashboardProps {
  initialHistory?: HistoryEntry[];
  initialLsrHistory?: LSRSnapshot[];
}

export default function Dashboard({ initialHistory, initialLsrHistory }: DashboardProps) {
  // Check if SSR data was provided (even if empty array)
  const hasSSRData = initialHistory !== undefined ||
    (typeof window !== 'undefined' && window.__INITIAL_DATA__ !== undefined);

  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(
    () => initialHistory ?? (typeof window !== 'undefined' ? window.__INITIAL_DATA__?.history : undefined) ?? []
  );
  const [lsrHistory, setLsrHistory] = useState<LSRSnapshot[]>(
    () => initialLsrHistory ?? (typeof window !== 'undefined' ? window.__INITIAL_DATA__?.lsrHistory : undefined) ?? []
  );
  // If SSR data was provided, we're not loading (data came from server)
  const [loading, setLoading] = useState(!hasSSRData);
  const [error, setError] = useState<string | null>(null);

  // Mark as mounted for client-only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only fetch if SSR data was NOT provided (client-only fallback)
  useEffect(() => {
    if (hasSSRData || history.length > 0) return;

    async function fetchData() {
      try {
        const response = await fetch(`${API_URL}/api/history`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data);
        } else {
          throw new Error('No data available');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [hasSSRData, history.length]);

  // Only fetch LSR if SSR data was NOT provided (client-only fallback)
  useEffect(() => {
    if (hasSSRData || lsrHistory.length > 0) return;

    async function fetchLsrData() {
      try {
        const response = await fetch(`${API_URL}/api/lsr/history`);
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setLsrHistory(data);
        }
      } catch {
        // Fail silently - LSR data is optional
      }
    }
    fetchLsrData();
  }, [hasSSRData, lsrHistory.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500 text-sm">loading...</div>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500 text-sm">{error || 'no data'}</div>
      </div>
    );
  }

  const current = history[history.length - 1];

  // Helper to get date string from timestamp
  const toDateStr = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });


  // Bucket LC history by date, taking latest value per day
  const lcByDate = new Map<number, HistoryEntry>();
  for (const entry of history) {
    const dateKey = toDateKey(entry.timestamp);
    const existing = lcByDate.get(dateKey);
    if (!existing || entry.timestamp > existing.timestamp) {
      lcByDate.set(dateKey, entry);
    }
  }

  // Bucket LSR history by date, taking latest value per day
  const lsrByDate = new Map<number, LSRSnapshot>();
  for (const entry of lsrHistory) {
    const dateKey = toDateKey(entry.timestamp);
    const existing = lsrByDate.get(dateKey);
    if (!existing || entry.timestamp > existing.timestamp) {
      lsrByDate.set(dateKey, entry);
    }
  }

  // Compute unified date range
  const allTimestamps = [...history.map(e => e.timestamp), ...lsrHistory.map(e => e.timestamp)];
  const minTs = Math.min(...allTimestamps);
  const maxTs = Math.max(...allTimestamps);
  const startDate = toDateKey(minTs);
  const endDate = toDateKey(maxTs);

  // Generate all dates in range
  const allDates: number[] = [];
  for (let d = startDate; d <= endDate; d += 24 * 60 * 60 * 1000) {
    allDates.push(d);
  }

  // Build chart data with nulls for missing dates (connectNulls will interpolate)
  const chartData = allDates.map(dateKey => {
    const lcEntry = lcByDate.get(dateKey);
    return {
      date: toDateStr(dateKey),
      Easy: lcEntry?.total_easy ?? null,
      Medium: lcEntry?.total_medium ?? null,
      Hard: lcEntry?.total_hard ?? null,
    };
  });

  // Build normalized LSR history, carrying forward last known value for missing dates
  const normalizedLsrHistory: LSRSnapshot[] = (() => {
    let lastKnown: LSRSnapshot | null = null;
    return allDates.map(dateKey => {
      const lsrEntry = lsrByDate.get(dateKey);
      if (lsrEntry) {
        lastKnown = lsrEntry;
        return lsrEntry;
      }
      // Carry forward last known value, or use zeros if no data yet
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
  })();

  let skillData: Array<{ name: string; value: number }> = [];
  try {
    const skills = JSON.parse(current.tags_json || '{}');
    const allSkills = [
      ...(skills.advanced || []),
      ...(skills.intermediate || []),
      ...(skills.fundamental || []),
    ];
    skillData = allSkills
      .map((skill: any) => ({
        name: skill.tagName || 'Unknown',
        value: skill.problemsSolved || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_SKILLS_DISPLAYED);
  } catch (e) {}

  const maxSkillValue = skillData.length > 0 ? Math.max(...skillData.map(s => s.value)) : 1;

  // Format timestamp for display
  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Format prediction date (short format like "Mar 15")
  const formatPredictionDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Predict milestone date using linear regression on last 14 days
  function predictMilestoneDate(
    dataPoints: Array<{ value: number }>,
    target: number
  ): Date | null {
    if (dataPoints.length < 3) return null;
    const recent = dataPoints.slice(-REGRESSION_WINDOW_DAYS);
    const n = recent.length;
    const current = recent[n - 1].value;

    // Already reached target
    if (current >= target) return null;

    // Linear regression: calculate slope
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recent[i].value;
      sumXY += i * recent[i].value;
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // No progress or negative progress
    if (slope <= 0) return null;

    const daysToGoal = (target - current) / slope;

    // More than 2 years out
    if (daysToGoal > MAX_PREDICTION_DAYS) return null;

    const predictionDate = new Date();
    predictionDate.setDate(predictionDate.getDate() + Math.ceil(daysToGoal));
    return predictionDate;
  }

  const lcLastUpdated = history.length > 0 ? formatTimestamp(history[history.length - 1].timestamp) : null;
  const lsrLastUpdated = lsrHistory.length > 0 ? formatTimestamp(lsrHistory[lsrHistory.length - 1].timestamp) : null;

  // Chart skeleton for SSR
  const ChartSkeleton = () => (
    <div className="h-full bg-neutral-800/30 animate-pulse flex items-center justify-center">
      <span className="text-neutral-600 text-xs">loading chart...</span>
    </div>
  );

  // Compute milestone predictions
  const lc150Prediction = (() => {
    const points = Array.from(lcByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => ({ value: e.total_easy + e.total_medium + e.total_hard }));
    return predictMilestoneDate(points, TOP150_TOTALS.easy + TOP150_TOTALS.medium + TOP150_TOTALS.hard);
  })();

  const masteryPrediction = (() => {
    if (lsrHistory.length === 0) return null;
    const latest = lsrHistory[lsrHistory.length - 1];
    // Use reviewed total (excludes unknown) as the target
    const reviewedTotal = latest.strong + latest.learning + latest.weak + latest.leech;
    if (reviewedTotal === 0) return null;
    const points = Array.from(lsrByDate.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => ({ value: e.strong }));
    return predictMilestoneDate(points, reviewedTotal);
  })();

  // Compute progress percentages
  const top150Total = TOP150_TOTALS.easy + TOP150_TOTALS.medium + TOP150_TOTALS.hard;
  const lcProgress = Math.min(100, ((current.total_easy + current.total_medium + current.total_hard) / top150Total) * 100);
  const masteryProgress = (() => {
    if (lsrHistory.length === 0) return 0;
    const latest = lsrHistory[lsrHistory.length - 1];
    const reviewedTotal = latest.strong + latest.learning + latest.weak + latest.leech;
    if (reviewedTotal === 0) return 0;
    return Math.min(100, (latest.strong / reviewedTotal) * 100);
  })();

  return (
    <div className="h-full flex flex-col gap-2 md:gap-4">
      {/* Header: Title + Activity Log + Pie + Timestamps */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <div>
            <h1 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">leetcode</h1>
            <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
              {lcLastUpdated && <div>lc: {lcLastUpdated}</div>}
              {lsrLastUpdated && <div>lsr: {lsrLastUpdated}</div>}
              {lc150Prediction && (
                <div className="text-neutral-600">150 by: {formatPredictionDate(lc150Prediction)}</div>
              )}
              {masteryPrediction && (
                <div className="text-neutral-600">mastery by: {formatPredictionDate(masteryPrediction)}</div>
              )}
            </div>
          </div>
          <div className="hidden md:block border-l border-neutral-800 pl-4">
            <ActivityLog history={history} />
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ProgressRing percent={lcProgress} />
          {mounted ? (
            <TotalsPieChart
              easy={current.total_easy}
              medium={current.total_medium}
              hard={current.total_hard}
            />
          ) : (
            <div className="w-20 h-20 md:w-32 md:h-32 bg-neutral-800/30 animate-pulse" />
          )}
        </div>
      </div>


      {/* Mobile Activity Log */}
      <div className="md:hidden border-t border-neutral-800 pt-2">
        <ActivityLog history={history} compact />
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      {/* Above the fold: Stats + Charts (fills viewport) */}
      <div className="flex flex-col gap-2 md:hidden" style={{ height: 'calc(100dvh - 10rem)' }}>
        {/* Row 1: Problems Solved + Mastery stats (2 cols) */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <CombinedStatsCard
            easy={current.total_easy}
            medium={current.total_medium}
            hard={current.total_hard}
          />
          {lsrHistory.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 p-2 flex flex-col min-h-0">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2 flex-shrink-0">Mastery</h3>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MasteryStatsCard snapshot={lsrHistory[lsrHistory.length - 1]} />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Progression chart */}
        <div className="bg-neutral-900 border border-neutral-800 p-2 flex flex-col min-h-0 flex-1">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1 flex-shrink-0">Progression</h3>
          <div className="flex-1 min-h-0">
            {mounted ? <ProgressionChart data={chartData} /> : <ChartSkeleton />}
          </div>
        </div>

        {/* Row 3: Mastery Over Time chart */}
        {lsrHistory.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 p-2 flex flex-col min-h-0 flex-1">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1 flex-shrink-0">Mastery Over Time</h3>
            <div className="flex-1 min-h-0">
              {mounted ? <MasteryChart history={normalizedLsrHistory} /> : <ChartSkeleton />}
            </div>
          </div>
        )}
      </div>

      {/* Below the fold: Skills (scrollable) */}
      <div className="flex flex-col gap-2 mt-2 md:hidden">
        {/* Skills stats (full width) */}
        <div className="bg-neutral-900 border border-neutral-800 p-2">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Skills</h3>
          {skillData.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {skillData.map((skill) => (
                <div key={skill.name} className="py-0.5">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-neutral-300 truncate pr-1">{skill.name}</span>
                    <span className="text-neutral-400 flex-shrink-0">{skill.value}</span>
                  </div>
                  <div className="h-1 bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-neutral-500" style={{ width: `${(skill.value / maxSkillValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-xs">no data</p>
          )}
        </div>

        {/* Skills Over Time chart */}
        <div className="bg-neutral-900 border border-neutral-800 p-2">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">Skills Over Time</h3>
          <div className="h-48">
            {mounted ? <SkillsChart history={history} /> : <ChartSkeleton />}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      {/* Row 1: Problems Solved + Progression Over Time */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">
        <CombinedStatsCard
          easy={current.total_easy}
          medium={current.total_medium}
          hard={current.total_hard}
        />
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex-shrink-0">Progression</h3>
          <div className="flex-1 min-h-0">
            {mounted ? <ProgressionChart data={chartData} /> : <ChartSkeleton />}
          </div>
        </div>
      </div>

      {/* Row 2: Mastery + Mastery Over Time */}
      {lsrHistory.length > 0 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4 flex-shrink-0">Mastery</h3>
            <div className="flex-1 min-h-0 overflow-hidden">
              <MasteryStatsCard snapshot={lsrHistory[lsrHistory.length - 1]} />
            </div>
          </div>
          <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex-shrink-0">Mastery Over Time</h3>
            <div className="flex-1 min-h-0">
              {mounted ? <MasteryChart history={normalizedLsrHistory} /> : <ChartSkeleton />}
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Skills + Skills Over Time */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4 flex-shrink-0">Skills</h3>
          {skillData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
              {skillData.map((skill) => (
                <div key={skill.name} className="py-0.5">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-300 truncate pr-2">{skill.name}</span>
                    <span className="text-neutral-400 flex-shrink-0">{skill.value}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-neutral-500" style={{ width: `${(skill.value / maxSkillValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm flex-1">no data</p>
          )}
        </div>
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex-shrink-0">Skills Over Time</h3>
          <div className="flex-1 min-h-0">
            {mounted ? <SkillsChart history={history} /> : <ChartSkeleton />}
          </div>
        </div>
      </div>

      {/* Comment Box */}
      {mounted && <CommentBox />}
    </div>
  );
}
