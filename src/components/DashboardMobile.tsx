import type { HistoryEntry, LSRSnapshot } from '../shared/types';
import type { DashboardData, ProgressionChartPoint, SkillDataPoint } from '../hooks/useDashboardData';
import CombinedStatsCard from './CombinedStatsCard';
import MasteryChart from './MasteryChart';
import MasteryStatsCard from './MasteryStatsCard';
import ProgressionChart from './ProgressionChart';
import SkillsChart from './SkillsChart';

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

interface DashboardMobileProps {
  data: DashboardData;
  history: HistoryEntry[];
  lsrHistory: LSRSnapshot[];
  chartData: ProgressionChartPoint[];
  normalizedLsrHistory: LSRSnapshot[];
  skillData: SkillDataPoint[];
  maxSkillValue: number;
  mounted: boolean;
}

export default function DashboardMobile({
  data,
  history,
  lsrHistory,
  chartData,
  normalizedLsrHistory,
  skillData,
  maxSkillValue,
  mounted,
}: DashboardMobileProps) {
  return (
    <>
      <div className="flex flex-col gap-2 md:hidden" style={{ height: 'calc(100dvh - 10rem)' }}>
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <CombinedStatsCard
            easy={data.current.total_easy}
            medium={data.current.total_medium}
            hard={data.current.total_hard}
          />
          {lsrHistory.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 p-2 flex flex-col min-h-0">
              <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2 flex-shrink-0">Mastery</h3>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MasteryStatsCard snapshot={lsrHistory[lsrHistory.length - 1]} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-2 flex flex-col min-h-0 flex-1">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1 flex-shrink-0">Progression</h3>
          <div className="flex-1 min-h-0">
            {mounted ? <ProgressionChart data={chartData} /> : <ChartSkeleton />}
          </div>
        </div>

        {lsrHistory.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 p-2 flex flex-col min-h-0 flex-1">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1 flex-shrink-0">Mastery Over Time</h3>
            <div className="flex-1 min-h-0">
              {mounted ? <MasteryChart history={normalizedLsrHistory} /> : <ChartSkeleton />}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2 md:hidden">
        <div className="bg-neutral-900 border border-neutral-800 p-2">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">Skills</h3>
          {skillData.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {skillData.map((skill) => (
                <div key={skill.name} className="py-0.5">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-neutral-300 truncate pr-1">{skill.name}</span>
                    <span className="text-neutral-400 flex-shrink-0">{skill.value}</span>
                  </div>
                  <div className="h-1 bg-neutral-800 overflow-hidden">
                    <div className="h-full bg-neutral-500" style={{ width: `${(skill.value / maxSkillValue) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-xs">no data</p>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-2">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">Skills Over Time</h3>
          <div className="h-48">
            {mounted ? <SkillsChart history={history} /> : <ChartSkeleton className="h-48" />}
          </div>
        </div>
      </div>
    </>
  );
}
