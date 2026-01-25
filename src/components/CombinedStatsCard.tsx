import { TOP150_TOTALS } from '../shared/types';

interface CombinedStatsCardProps {
  easy: number;
  medium: number;
  hard: number;
}

const stats = [
  { key: 'easy', label: 'Easy', color: 'text-green-400', barColor: 'bg-green-500' },
  { key: 'medium', label: 'Medium', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
  { key: 'hard', label: 'Hard', color: 'text-red-400', barColor: 'bg-red-500' },
] as const;

export default function CombinedStatsCard({ easy, medium, hard }: CombinedStatsCardProps) {
  const counts = { easy, medium, hard };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-2 md:p-4 h-full flex flex-col min-h-0">
      <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2 md:mb-4 flex-shrink-0">Solved</h3>
      <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
        {stats.map(({ key, label, color, barColor }) => {
          const solved = counts[key];
          const total = TOP150_TOTALS[key];
          const percentage = Math.min(100, (solved / total) * 100);

          return (
            <div key={key} className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-xs md:text-sm text-neutral-400">{label}</span>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className={`text-base md:text-xl font-bold ${color}`}>{solved}</span>
                  <span className="text-xs text-neutral-500">
                    /{total}
                  </span>
                </div>
              </div>
              <div className="h-2 md:h-2.5 bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
