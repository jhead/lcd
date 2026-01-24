import {
  BarChart,
  Bar,
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

const COLORS = {
  Easy: '#22c55e',   // green-500
  Medium: '#eab308', // yellow-500
  Hard: '#ef4444',   // red-500
};

export default function ProgressionChart({ data }: ProgressionChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
            itemSorter={(item) => {
              const order = { Easy: 0, Medium: 1, Hard: 2 };
              return order[item.dataKey as keyof typeof order] ?? 3;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '5px' }}
            formatter={(value) => <span style={{ color: '#737373', fontSize: 10 }}>{value}</span>}
          />
          <Bar dataKey="Easy" stackId="progress" fill={COLORS.Easy} isAnimationActive={false} />
          <Bar dataKey="Medium" stackId="progress" fill={COLORS.Medium} isAnimationActive={false} />
          <Bar dataKey="Hard" stackId="progress" fill={COLORS.Hard} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
