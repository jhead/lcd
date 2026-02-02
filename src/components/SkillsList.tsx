import type { SkillDataPoint } from '../hooks/useDashboardData';
import type { SkillsChartActiveData } from './SkillsChart';

interface SkillsListProps {
  skillData: SkillDataPoint[];
  activeData?: SkillsChartActiveData | null;
}

export default function SkillsList({ skillData, activeData }: SkillsListProps) {
  const displayData = activeData?.skills ?? skillData;

  if (displayData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
        no skill data
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
        {displayData.map((skill) => (
          <div key={skill.name} className="flex justify-between gap-1 min-w-0">
            <span className="text-neutral-300 truncate">{skill.name}</span>
            <span className="text-neutral-500 flex-shrink-0">{skill.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
