import { useState, useCallback } from 'react';
import type { HistoryEntry, LSRSnapshot } from '../shared/types';
import type { DashboardData, ProgressionChartPoint, SkillDataPoint } from '../hooks/useDashboardData';
import CombinedStatsCard from './CombinedStatsCard';
import MasteryChart from './MasteryChart';
import MasteryStatsCard from './MasteryStatsCard';
import ProgressionChart from './ProgressionChart';
import SkillsChart, { type SkillsChartActiveData } from './SkillsChart';
import SkillsList from './SkillsList';

interface ChartSkeletonProps {
  className?: string;
}

function ChartSkeleton({ className = '' }: ChartSkeletonProps) {
  return (
    <div className={`h-full bg-neutral-800/30 animate-pulse flex items-center justify-center ${className}`}>
      <span className="text-neutral-600 text-xs">loading chart...</span>
    </div>
  );
}

interface DashboardDesktopProps {
  data: DashboardData;
  history: HistoryEntry[];
  lsrHistory: LSRSnapshot[];
  chartData: ProgressionChartPoint[];
  normalizedLsrHistory: LSRSnapshot[];
  skillData: SkillDataPoint[];
  mounted: boolean;
}

export default function DashboardDesktop({
  data,
  history,
  lsrHistory,
  chartData,
  normalizedLsrHistory,
  skillData,
  mounted,
}: DashboardDesktopProps) {
  const [skillsActiveData, setSkillsActiveData] = useState<SkillsChartActiveData | null>(null);
  const [skillsChartKey, setSkillsChartKey] = useState(0);

  const handleClearSelection = useCallback(() => {
    setSkillsChartKey(k => k + 1);
    setSkillsActiveData(null);
  }, []);

  return (
    <>
      <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">
        <CombinedStatsCard
          easy={data.current.total_easy}
          medium={data.current.total_medium}
          hard={data.current.total_hard}
        />
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex-shrink-0">Progression</h3>
          <div className="flex-1 min-h-0">
            {mounted ? <ProgressionChart data={chartData} /> : <ChartSkeleton />}
          </div>
        </div>
      </div>

      {lsrHistory.length > 0 && (
        <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-4 flex-shrink-0">Mastery</h3>
            <div className="flex-1 min-h-0 overflow-hidden">
              <MasteryStatsCard snapshot={lsrHistory[lsrHistory.length - 1]} />
            </div>
          </div>
          <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex-shrink-0">Mastery Over Time</h3>
            <div className="flex-1 min-h-0">
              {mounted ? <MasteryChart history={normalizedLsrHistory} /> : <ChartSkeleton />}
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:grid md:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Skills</h3>
            {skillsActiveData && (
              <div className="flex items-center gap-2">
                <span className="text-neutral-300 text-xs">{skillsActiveData.date}</span>
                {skillsActiveData.isSelected && (
                  <button
                    onClick={handleClearSelection}
                    className="text-neutral-500 hover:text-neutral-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <SkillsList
              skillData={skillData}
              activeData={skillsActiveData}
            />
          </div>
        </div>
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-4 flex flex-col min-h-0">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3 flex-shrink-0">Skills Over Time</h3>
          <div className="flex-1 min-h-0">
            {mounted ? (
              <SkillsChart
                key={skillsChartKey}
                history={history}
                onActiveChange={setSkillsActiveData}
              />
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
