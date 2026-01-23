import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import TotalsPieChart from "./TotalsPieChart";
import CombinedStatsCard from "./CombinedStatsCard";
import MasteryChart, { type LSRSnapshot } from "./MasteryChart";
import MasteryStatsCard from "./MasteryStatsCard";

interface HistoryEntry {
  timestamp: number;
  total_easy: number;
  total_medium: number;
  total_hard: number;
  tags_json: string;
  beats_json?: string;
}

interface Beats {
  easy?: number;
  medium?: number;
  hard?: number;
}

const API_URL = 'https://lcd.jxh.io';

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lsrHistory, setLsrHistory] = useState<LSRSnapshot[]>([]);

  useEffect(() => {
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
  }, []);

  // Fetch LSR mastery data (non-blocking, fail silently)
  useEffect(() => {
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
  }, []);

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

  // Helper to get start of day timestamp
  const toDateKey = (ts: number) => {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

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

  // Build chart data with zeros for missing dates
  const chartData = allDates.map(dateKey => {
    const lcEntry = lcByDate.get(dateKey);
    return {
      date: toDateStr(dateKey),
      Easy: lcEntry?.total_easy ?? 0,
      Medium: lcEntry?.total_medium ?? 0,
      Hard: lcEntry?.total_hard ?? 0,
    };
  });

  // Build normalized LSR history with zeros for missing dates
  const normalizedLsrHistory: LSRSnapshot[] = allDates.map(dateKey => {
    const lsrEntry = lsrByDate.get(dateKey);
    return lsrEntry ?? {
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
      .slice(0, 8);
  } catch (e) {}

  let beats: Beats = {};
  try {
    beats = JSON.parse(current.beats_json || '{}');
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

  const lcLastUpdated = history.length > 0 ? formatTimestamp(history[history.length - 1].timestamp) : null;
  const lsrLastUpdated = lsrHistory.length > 0 ? formatTimestamp(lsrHistory[lsrHistory.length - 1].timestamp) : null;

  return (
    <div className="space-y-4">
      {/* Header: Title + Pie + Timestamps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">leetcode</h1>
            <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
              {lcLastUpdated && <div>lc: {lcLastUpdated}</div>}
              {lsrLastUpdated && <div>lsr: {lsrLastUpdated}</div>}
            </div>
          </div>
        </div>
        <TotalsPieChart
          easy={current.total_easy}
          medium={current.total_medium}
          hard={current.total_hard}
        />
      </div>

      {/* Row 1: Problems Solved + Current Mastery + Top Skills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CombinedStatsCard
          easy={current.total_easy}
          medium={current.total_medium}
          hard={current.total_hard}
          beats={beats}
        />

        {lsrHistory.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 p-4 h-full flex flex-col">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">Current Mastery</h3>
            <div className="flex-1">
              <MasteryStatsCard snapshot={lsrHistory[lsrHistory.length - 1]} />
            </div>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 p-4 h-full flex flex-col">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">Top Skills</h3>
          {skillData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
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
      </div>

      {/* Row 2: Progression Over Time */}
      <div className="bg-neutral-900 border border-neutral-800 p-4">
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Progression</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEasy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 10 }} width={30} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 0 }}
                labelStyle={{ color: '#e5e5e5', fontSize: 11 }}
                itemStyle={{ color: '#a3a3a3', fontSize: 11 }}
              />
              <Legend wrapperStyle={{ paddingTop: '5px' }} formatter={(value) => <span style={{ color: '#737373', fontSize: 10 }}>{value}</span>} />
              <Area type="monotone" dataKey="Easy" stroke="#22c55e" strokeWidth={1.5} fill="url(#colorEasy)" isAnimationActive={false} />
              <Area type="monotone" dataKey="Medium" stroke="#eab308" strokeWidth={1.5} fill="url(#colorMedium)" isAnimationActive={false} />
              <Area type="monotone" dataKey="Hard" stroke="#ef4444" strokeWidth={1.5} fill="url(#colorHard)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Mastery Over Time */}
      {lsrHistory.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 p-4">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">Mastery Over Time</h3>
          <MasteryChart history={normalizedLsrHistory} />
        </div>
      )}
    </div>
  );
}
