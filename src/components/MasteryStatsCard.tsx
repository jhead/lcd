import type { LSRSnapshot } from '../shared/types';

interface MasteryStatsCardProps {
  snapshot: LSRSnapshot;
}

// Mastery level colors and labels - monochrome slate palette
const MASTERY_LEVELS = [
  { key: 'strong', label: 'Strong', color: 'bg-slate-300', textColor: 'text-slate-300' },
  { key: 'learning', label: 'Learning', color: 'bg-slate-400', textColor: 'text-slate-400' },
  { key: 'weak', label: 'Weak', color: 'bg-slate-500', textColor: 'text-slate-500' },
  { key: 'leech', label: 'Leech', color: 'bg-slate-600', textColor: 'text-slate-600' },
] as const;

export default function MasteryStatsCard({ snapshot }: MasteryStatsCardProps) {
  // Total of reviewed problems (excluding unknown)
  const reviewedTotal = snapshot.strong + snapshot.learning + snapshot.weak + snapshot.leech;
  const total = reviewedTotal || 1; // Avoid division by zero

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Progress bars */}
      <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
        {MASTERY_LEVELS.map(level => {
          const count = snapshot[level.key as keyof LSRSnapshot] as number;
          const percentage = (count / total) * 100;

          return (
            <div key={level.key} className="py-0.5 md:py-1">
              <div className="flex justify-between text-xs md:text-sm mb-0.5 md:mb-1.5">
                <span className={`${level.textColor}`}>{level.label}</span>
                <span className="text-neutral-400">{count} ({percentage.toFixed(0)}%)</span>
              </div>
              <div className="h-1 md:h-1.5 bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full ${level.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-2 md:pt-3 mt-1 md:mt-2 border-t border-neutral-800 flex-shrink-0">
        <div className="flex justify-between text-xs md:text-sm">
          <span className="text-neutral-400">Reviewed</span>
          <span className="text-neutral-300">{reviewedTotal}</span>
        </div>
      </div>
    </div>
  );
}
