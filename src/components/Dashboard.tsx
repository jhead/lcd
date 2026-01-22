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
import SkillRadar from "./SkillRadar";
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
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">{error || 'No data available'}</div>
      </div>
    );
  }

  const current = history[history.length - 1];

  const chartData = history.map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    Easy: entry.total_easy,
    Medium: entry.total_medium,
    Hard: entry.total_hard,
  }));

  let skills: { advanced?: any[]; intermediate?: any[]; fundamental?: any[] } = {};
  let skillData: Array<{ name: string; value: number }> = [];
  try {
    skills = JSON.parse(current.tags_json || '{}');
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
      .slice(0, 10);
  } catch (e) {}

  let beats: Beats = {};
  try {
    beats = JSON.parse(current.beats_json || '{}');
  } catch (e) {}

  const maxSkillValue = skillData.length > 0 ? Math.max(...skillData.map(s => s.value)) : 1;

  return (
    <div className="space-y-5">
      {/* Row 1: Total Stats (Pie) + Combined Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Total Progress</h3>
          <TotalsPieChart
            easy={current.total_easy}
            medium={current.total_medium}
            hard={current.total_hard}
          />
        </div>

        <CombinedStatsCard
          easy={current.total_easy}
          medium={current.total_medium}
          hard={current.total_hard}
          beats={beats}
        />
      </div>

      {/* Row 2: Progression Chart */}
      <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5">
        <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Progression Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#525252', fontSize: 11 }} width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '6px' }}
                labelStyle={{ color: '#d4d4d4' }}
                itemStyle={{ color: '#a3a3a3' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span style={{ color: '#737373' }}>{value}</span>} />
              <Area type="monotone" dataKey="Easy" stroke="#22c55e" strokeWidth={2} fill="url(#colorEasy)" />
              <Area type="monotone" dataKey="Medium" stroke="#eab308" strokeWidth={2} fill="url(#colorMedium)" />
              <Area type="monotone" dataKey="Hard" stroke="#ef4444" strokeWidth={2} fill="url(#colorHard)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: LSR Mastery (only shown when data available) */}
      {lsrHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-lg bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Mastery Over Time</h3>
            <MasteryChart history={lsrHistory} />
          </div>

          <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5">
            <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Current Mastery</h3>
            <MasteryStatsCard snapshot={lsrHistory[lsrHistory.length - 1]} />
          </div>
        </div>
      )}

      {/* Row 4: Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-lg bg-neutral-900 border border-neutral-800 p-5">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Skills</h3>
          <div className="h-80">
            <SkillRadar skills={skills} />
          </div>
        </div>

        <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Top Skills</h3>
          {skillData.length > 0 ? (
            <div className="space-y-3">
              {skillData.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-300 truncate pr-2">{skill.name}</span>
                    <span className="text-neutral-500 flex-shrink-0">{skill.value}</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-500 rounded-full" style={{ width: `${(skill.value / maxSkillValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600 text-sm">No skill data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
