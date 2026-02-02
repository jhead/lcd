import type { SkillDataPoint } from '../hooks/useDashboardData';
import type { SkillsChartActiveData } from './SkillsChart';

interface SkillsTreemapProps {
  skillData: SkillDataPoint[];
  activeData?: SkillsChartActiveData | null;
}

export default function SkillsTreemap({ skillData, activeData }: SkillsTreemapProps) {
  const displayData = activeData?.skills ?? skillData;

  if (displayData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
        no skill data
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs overflow-y-auto">
        {displayData.map((skill) => (
          <span key={skill.name} className="text-neutral-400">
            <span className="text-neutral-300">{skill.name}</span>
            <span className="text-neutral-500 ml-1">{skill.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
