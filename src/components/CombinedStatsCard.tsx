interface CombinedStatsCardProps {
  easy: number;
  medium: number;
  hard: number;
  beats?: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
}

const stats = [
  { key: 'easy', label: 'Easy', color: 'text-green-400', barColor: 'bg-green-500' },
  { key: 'medium', label: 'Medium', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
  { key: 'hard', label: 'Hard', color: 'text-red-400', barColor: 'bg-red-500' },
] as const;

export default function CombinedStatsCard({ easy, medium, hard, beats }: CombinedStatsCardProps) {
  const counts = { easy, medium, hard };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-4 h-full flex flex-col">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4">Problems Solved</h3>
      <div className="flex-1 flex flex-col justify-between">
        {stats.map(({ key, label, color, barColor }) => {
          const count = counts[key];
          const beatsValue = beats?.[key];

          return (
            <div key={key} className="py-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-neutral-400">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${color}`}>{count}</span>
                  {beatsValue !== undefined && (
                    <span className="text-xs text-neutral-500">
                      {beatsValue.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              {beatsValue !== undefined && (
                <div className="h-1.5 bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${beatsValue}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
