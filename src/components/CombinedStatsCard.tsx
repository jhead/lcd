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
    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-5">
      <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Problems Solved</h3>
      <div className="space-y-4">
        {stats.map(({ key, label, color, barColor }) => {
          const count = counts[key];
          const beatsValue = beats?.[key];

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-neutral-500">{label}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${color}`}>{count}</span>
                  {beatsValue !== undefined && (
                    <span className="text-xs text-neutral-600">
                      beats {beatsValue.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {beatsValue !== undefined && (
                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full`}
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
