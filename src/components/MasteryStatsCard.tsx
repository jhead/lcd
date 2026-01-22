import type { LSRSnapshot } from './MasteryChart';

interface MasteryStatsCardProps {
  snapshot: LSRSnapshot;
}

// Mastery level colors and labels
const MASTERY_LEVELS = [
  { key: 'strong', label: 'Strong', color: 'bg-green-500', textColor: 'text-green-400' },
  { key: 'learning', label: 'Learning', color: 'bg-blue-500', textColor: 'text-blue-400' },
  { key: 'weak', label: 'Weak', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { key: 'leech', label: 'Leech', color: 'bg-red-500', textColor: 'text-red-400' },
  { key: 'unknown', label: 'Unknown', color: 'bg-neutral-600', textColor: 'text-neutral-400' },
] as const;

export default function MasteryStatsCard({ snapshot }: MasteryStatsCardProps) {
  const total = snapshot.total || 1; // Avoid division by zero

  return (
    <div className="space-y-4">
      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-2xl font-bold text-green-400">{snapshot.strong}</div>
          <div className="text-xs text-neutral-500">Strong</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{snapshot.learning}</div>
          <div className="text-xs text-neutral-500">Learning</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">{snapshot.weak}</div>
          <div className="text-xs text-neutral-500">Weak</div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        {MASTERY_LEVELS.map(level => {
          const count = snapshot[level.key as keyof LSRSnapshot] as number;
          const percentage = (count / total) * 100;

          return (
            <div key={level.key}>
              <div className="flex justify-between text-sm mb-1">
                <span className={`${level.textColor}`}>{level.label}</span>
                <span className="text-neutral-500">{count} ({percentage.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${level.color} rounded-full`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Total Problems</span>
          <span className="text-neutral-300 font-medium">{snapshot.total}</span>
        </div>
      </div>
    </div>
  );
}
