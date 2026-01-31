import { useState, useEffect } from 'react';
import type { HistoryEntry, LSRSnapshot } from '../shared/types';
import { API_URL } from '../shared/constants';
import { formatTimestamp, formatPredictionDate } from '../shared/utils';
import { useDashboardData } from '../hooks/useDashboardData';
import TotalsPieChart from './TotalsPieChart';
import ProgressRing from './ProgressRing';
import ActivityLog from './ActivityLog';
import CommentBox from './CommentBox';
import DashboardMobile from './DashboardMobile';
import DashboardDesktop from './DashboardDesktop';

interface DashboardProps {
  initialHistory?: HistoryEntry[];
  initialLsrHistory?: LSRSnapshot[];
}

export default function Dashboard({ initialHistory, initialLsrHistory }: DashboardProps) {
  const hasSSRData =
    initialHistory !== undefined ||
    (typeof window !== 'undefined' && window.__INITIAL_DATA__ !== undefined);

  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(
    () =>
      initialHistory ??
      (typeof window !== 'undefined' ? window.__INITIAL_DATA__?.history : undefined) ??
      []
  );
  const [lsrHistory, setLsrHistory] = useState<LSRSnapshot[]>(
    () =>
      initialLsrHistory ??
      (typeof window !== 'undefined' ? window.__INITIAL_DATA__?.lsrHistory : undefined) ??
      []
  );
  const [loading, setLoading] = useState(!hasSSRData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const dashboardData = useDashboardData(history, lsrHistory);

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

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500 text-sm">no data</div>
      </div>
    );
  }

  const { current, chartData, normalizedLsrHistory, skillData, maxSkillValue, lc150Prediction, masteryPrediction, lcProgress } =
    dashboardData;

  const lcLastUpdated = history.length > 0 ? formatTimestamp(history[history.length - 1].timestamp) : null;
  const lsrLastUpdated = lsrHistory.length > 0 ? formatTimestamp(lsrHistory[lsrHistory.length - 1].timestamp) : null;

  return (
    <div className="h-full flex flex-col gap-2 md:gap-4">
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

      <div className="md:hidden border-t border-neutral-800 pt-2">
        <ActivityLog history={history} compact />
      </div>

      <DashboardMobile
        data={dashboardData}
        history={history}
        lsrHistory={lsrHistory}
        chartData={chartData}
        normalizedLsrHistory={normalizedLsrHistory}
        skillData={skillData}
        maxSkillValue={maxSkillValue}
        mounted={mounted}
      />

      <DashboardDesktop
        data={dashboardData}
        history={history}
        lsrHistory={lsrHistory}
        chartData={chartData}
        normalizedLsrHistory={normalizedLsrHistory}
        skillData={skillData}
        maxSkillValue={maxSkillValue}
        mounted={mounted}
      />

      {mounted && <CommentBox />}
    </div>
  );
}
