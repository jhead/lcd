import { useMemo } from 'react';

interface HistoryEntry {
  timestamp: number;
  total_easy: number;
  total_medium: number;
  total_hard: number;
}

interface ProgressHeatmapProps {
  history: HistoryEntry[];
}

function getColorClass(count: number): string {
  if (count === 0) return 'bg-neutral-800';
  if (count <= 1) return 'bg-green-900';
  if (count <= 3) return 'bg-green-700';
  if (count <= 5) return 'bg-green-500';
  return 'bg-green-400';
}

export default function ProgressHeatmap({ history }: ProgressHeatmapProps) {
  const dailyProgress = useMemo(() => {
    const dailyMap = new Map<string, number>();
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevTotal = prev.total_easy + prev.total_medium + prev.total_hard;
      const currTotal = curr.total_easy + curr.total_medium + curr.total_hard;
      const delta = currTotal - prevTotal;

      if (delta > 0) {
        const dateKey = new Date(curr.timestamp).toISOString().split('T')[0];
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + delta);
      }
    }
    return dailyMap;
  }, [history]);

  const weeks = useMemo(() => {
    const result: Array<Array<{ date: string; count: number }>> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364 - startDate.getDay());

    let currentWeek: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < 364 + today.getDay(); i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const count = dailyProgress.get(dateKey) || 0;
      currentWeek.push({ date: dateKey, count });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, [dailyProgress]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  const monthLabels = useMemo(() => {
    const labels: Array<{ text: string; weekIndex: number }> = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = new Date(week[0].date);
      const month = firstDay.getMonth();

      if (month !== lastMonth) {
        labels.push({
          text: firstDay.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] pr-2 pt-4 flex-shrink-0">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-[10px] text-[10px] text-neutral-600 flex items-center justify-end w-7">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div>
          {/* Month labels */}
          <div className="flex h-4 mb-1">
            {weeks.map((_, weekIndex) => {
              const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);
              return (
                <div key={weekIndex} className="w-[10px] mx-[1px] text-[10px] text-neutral-600 flex-shrink-0">
                  {monthLabel?.text || ''}
                </div>
              );
            })}
          </div>

          {/* Heatmap */}
          <div className="flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={`w-[10px] h-[10px] rounded-sm ${getColorClass(day.count)} hover:ring-1 hover:ring-neutral-500`}
                    title={`${day.date}: ${day.count} problems`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-neutral-600">Less</span>
        <div className="flex gap-[2px]">
          <div className="w-[10px] h-[10px] rounded-sm bg-neutral-800" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-900" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-700" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-400" />
        </div>
        <span className="text-[10px] text-neutral-600">More</span>
      </div>
    </div>
  );
}
