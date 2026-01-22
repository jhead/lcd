import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface LSRSnapshot {
  id: number;
  timestamp: number;
  strong: number;
  learning: number;
  weak: number;
  leech: number;
  unknown: number;
  total: number;
}

interface MasteryChartProps {
  history: LSRSnapshot[];
}

// Mastery level colors
const COLORS = {
  strong: '#22c55e',    // green-500
  learning: '#3b82f6',  // blue-500
  weak: '#eab308',      // yellow-500
  leech: '#ef4444',     // red-500
};

export default function MasteryChart({ history }: MasteryChartProps) {
  // Sample data to ~30 points max to avoid overcrowding
  const sampleRate = Math.max(1, Math.floor(history.length / 30));
  const sampledHistory = history.filter((_, index) => index % sampleRate === 0 || index === history.length - 1);

  const chartData = sampledHistory.map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }),
    Strong: entry.strong,
    Learning: entry.learning,
    Weak: entry.weak,
    Leech: entry.leech,
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
          <Bar dataKey="Strong" stackId="mastery" fill={COLORS.strong} isAnimationActive={false} />
          <Bar dataKey="Learning" stackId="mastery" fill={COLORS.learning} isAnimationActive={false} />
          <Bar dataKey="Weak" stackId="mastery" fill={COLORS.weak} isAnimationActive={false} />
          <Bar dataKey="Leech" stackId="mastery" fill={COLORS.leech} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
