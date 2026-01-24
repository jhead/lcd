import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  Easy: number | null;
  Medium: number | null;
  Hard: number | null;
}

interface ProgressionChartProps {
  data: ChartDataPoint[];
}

export default function ProgressionChart({ data }: ProgressionChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
          <Area type="monotone" dataKey="Easy" stroke="#22c55e" strokeWidth={1.5} fill="url(#colorEasy)" isAnimationActive={false} connectNulls />
          <Area type="monotone" dataKey="Medium" stroke="#eab308" strokeWidth={1.5} fill="url(#colorMedium)" isAnimationActive={false} connectNulls />
          <Area type="monotone" dataKey="Hard" stroke="#ef4444" strokeWidth={1.5} fill="url(#colorHard)" isAnimationActive={false} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
