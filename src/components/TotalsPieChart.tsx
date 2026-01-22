import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface TotalsPieChartProps {
  easy: number;
  medium: number;
  hard: number;
}

const COLORS = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
};

export default function TotalsPieChart({ easy, medium, hard }: TotalsPieChartProps) {
  const total = easy + medium + hard;
  const data = [
    { name: 'Easy', value: easy, color: COLORS.easy },
    { name: 'Medium', value: medium, color: COLORS.medium },
    { name: 'Hard', value: hard, color: COLORS.hard },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg">
                      <p className="text-sm" style={{ color: data.color }}>
                        {data.name}: {data.value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs text-neutral-500">Total</span>
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-neutral-500">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
