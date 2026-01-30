import type { HistoryEntry } from '../shared/types';

interface ActivityLogProps {
  history: HistoryEntry[];
  compact?: boolean;
}

interface DailyActivity {
  date: string;
  label: string;
  dateKey: number;
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export default function ActivityLog({ history, compact = false }: ActivityLogProps) {
  if (history.length < 2) return null;

  // Helper to get start of day timestamp
  const toDateKey = (ts: number) => {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  const todayKey = toDateKey(Date.now());
  const yesterdayKey = todayKey - 24 * 60 * 60 * 1000;

  // Format date as MM/DD or relative label
  const formatDate = (ts: number, useLabel: boolean) => {
    if (useLabel) {
      if (ts === todayKey) return 'today';
      if (ts === yesterdayKey) return 'yday';
    }
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  // Bucket by date, taking latest value per day
  const byDate = new Map<number, HistoryEntry>();
  for (const entry of history) {
    const dateKey = toDateKey(entry.timestamp);
    const existing = byDate.get(dateKey);
    if (!existing || entry.timestamp > existing.timestamp) {
      byDate.set(dateKey, entry);
    }
  }

  // Sort dates descending (most recent first)
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => b - a);

  // Compute deltas (2 for compact, 5 for full)
  const maxDays = compact ? 2 : 5;
  const activities: DailyActivity[] = [];
  for (let i = 0; i < Math.min(maxDays, sortedDates.length - 1); i++) {
    const currentDate = sortedDates[i];
    const prevDate = sortedDates[i + 1];
    const current = byDate.get(currentDate)!;
    const prev = byDate.get(prevDate)!;

    const easyDelta = current.total_easy - prev.total_easy;
    const mediumDelta = current.total_medium - prev.total_medium;
    const hardDelta = current.total_hard - prev.total_hard;
    const totalDelta = easyDelta + mediumDelta + hardDelta;

    activities.push({
      date: formatDate(currentDate, false),
      label: formatDate(currentDate, true),
      dateKey: currentDate,
      easy: easyDelta,
      medium: mediumDelta,
      hard: hardDelta,
      total: totalDelta,
    });
  }

  if (activities.length === 0) return null;

  // Compute 1-week totals (last 7 days)
  const weekStats = (() => {
    let easy = 0, medium = 0, hard = 0;
    for (let i = 0; i < Math.min(7, sortedDates.length - 1); i++) {
      const currentDate = sortedDates[i];
      const prevDate = sortedDates[i + 1];
      const current = byDate.get(currentDate)!;
      const prev = byDate.get(prevDate)!;
      easy += current.total_easy - prev.total_easy;
      medium += current.total_medium - prev.total_medium;
      hard += current.total_hard - prev.total_hard;
    }
    return { easy, medium, hard, total: easy + medium + hard };
  })();

  // Compact: two lines - totals on top, E/M/H breakdowns below aligned
  if (compact) {
    const renderBreakdown = (e: number, m: number, h: number) => (
      <span className="text-neutral-600">
        [
        {e > 0 && <span className="text-green-400">E{e}</span>}
        {e > 0 && (m > 0 || h > 0) && ' '}
        {m > 0 && <span className="text-yellow-400">M{m}</span>}
        {m > 0 && h > 0 && ' '}
        {h > 0 && <span className="text-red-400">H{h}</span>}
        ]
      </span>
    );

    return (
      <div className="font-mono text-xs text-neutral-500">
        {/* Line 1: totals */}
        <div className="flex items-center">
          <span className="text-neutral-600 w-4">&gt;</span>
          {activities.map((day, i) => (
            <div key={day.dateKey} className="flex items-center w-24">
              <span>{day.label}</span>
              <span className="ml-1">{day.total > 0 ? <span className="text-green-500">+{day.total}</span> : <span className="text-neutral-700">—</span>}</span>
            </div>
          ))}
          <div className="flex items-center">
            <span>1w</span>
            <span className="ml-1">{weekStats.total > 0 ? <span className="text-green-500">+{weekStats.total}</span> : <span className="text-neutral-700">—</span>}</span>
          </div>
        </div>
        {/* Line 2: E/M/H breakdowns */}
        <div className="flex items-center">
          <span className="w-4"></span>
          {activities.map((day) => (
            <div key={day.dateKey} className="w-24">
              {day.total > 0 ? renderBreakdown(day.easy, day.medium, day.hard) : null}
            </div>
          ))}
          <div>
            {weekStats.total > 0 ? renderBreakdown(weekStats.easy, weekStats.medium, weekStats.hard) : null}
          </div>
        </div>
      </div>
    );
  }

  // Full: vertical list
  return (
    <div className="font-mono text-xs">
      <div className="text-neutral-500 mb-1 text-[10px] uppercase tracking-wider">Activity</div>
      <div className="space-y-0.5">
        {activities.map((day) => (
          <div key={day.dateKey} className="flex items-center gap-2">
            <span className="text-neutral-600">&gt;</span>
            <span className="text-neutral-500 w-10">{day.date}</span>
            {day.total > 0 ? (
              <>
                <span className="text-green-500 w-6 text-right">+{day.total}</span>
                <span className="text-neutral-600">
                  [
                  {day.easy > 0 && <span className="text-green-400">E{day.easy}</span>}
                  {day.easy > 0 && (day.medium > 0 || day.hard > 0) && ' '}
                  {day.medium > 0 && <span className="text-yellow-400">M{day.medium}</span>}
                  {day.medium > 0 && day.hard > 0 && ' '}
                  {day.hard > 0 && <span className="text-red-400">H{day.hard}</span>}
                  ]
                </span>
              </>
            ) : (
              <span className="text-neutral-700">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
