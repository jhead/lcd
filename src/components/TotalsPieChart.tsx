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
    <div className="relative w-32 h-32 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
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
                  <div className="bg-neutral-900 border border-neutral-800 px-2 py-1">
                    <p className="text-xs" style={{ color: data.color }}>
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
        <span className="text-2xl font-bold text-white">{total}</span>
      </div>
    </div>
  );
}
