import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HistoryEntry } from '../shared/types';

interface SkillsChartProps {
  history: HistoryEntry[];
}

// Color palette for skills (distinct, readable on dark bg)
const SKILL_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#ef4444', // red
  '#a855f7', // purple
  '#06b6d4', // cyan
];

interface SkillDataPoint {
  tagName: string;
  problemsSolved: number;
}

export default function SkillsChart({ history }: SkillsChartProps) {
  // Parse tags from each history entry
  const parsedHistory = history.map(entry => {
    let skills: SkillDataPoint[] = [];
    try {
      const tags = JSON.parse(entry.tags_json || '{}');
      skills = [
        ...(tags.advanced || []),
        ...(tags.intermediate || []),
        ...(tags.fundamental || []),
      ].map((s: any) => ({
        tagName: s.tagName || 'Unknown',
        problemsSolved: s.problemsSolved || 0,
      }));
    } catch {}
    return { timestamp: entry.timestamp, skills };
  });

  // Find top 6 skills by latest values
  const latestSkills = parsedHistory[parsedHistory.length - 1]?.skills || [];
  const topSkillNames = latestSkills
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 6)
    .map(s => s.tagName);

  // Build chart data
  const chartData = parsedHistory.map(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const dataPoint: Record<string, string | number | null> = { date };

    for (const skillName of topSkillNames) {
      const skill = entry.skills.find(s => s.tagName === skillName);
      dataPoint[skillName] = skill?.problemsSolved ?? null;
    }

    return dataPoint;
  });

  if (topSkillNames.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-neutral-500 text-sm">no skill data</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            {topSkillNames.map((name, i) => (
              <linearGradient key={name} id={`colorSkill${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SKILL_COLORS[i]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={SKILL_COLORS[i]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 10 }}
            width={30}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 0 }}
            labelStyle={{ color: '#e5e5e5', fontSize: 11 }}
            itemStyle={{ color: '#a3a3a3', fontSize: 11 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '5px' }}
            formatter={(value) => <span style={{ color: '#737373', fontSize: 10 }}>{value}</span>}
          />
          {topSkillNames.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={SKILL_COLORS[i]}
              strokeWidth={1.5}
              fill={`url(#colorSkill${i})`}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
