import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Skill {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

interface SkillRadarProps {
  skills: {
    advanced?: Skill[];
    intermediate?: Skill[];
    fundamental?: Skill[];
  };
}

export default function SkillRadar({ skills }: SkillRadarProps) {
  const allSkills = [
    ...(skills.advanced || []),
    ...(skills.intermediate || []),
    ...(skills.fundamental || []),
  ];

  const topSkills = allSkills
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 8);

  if (topSkills.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-600">
        No skill data available
      </div>
    );
  }

  const maxValue = Math.max(...topSkills.map(s => s.problemsSolved));

  const data = topSkills.map(skill => ({
    skill: skill.tagName.length > 12
      ? skill.tagName.slice(0, 10) + '...'
      : skill.tagName,
    fullName: skill.tagName,
    value: skill.problemsSolved,
    normalized: (skill.problemsSolved / maxValue) * 100,
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#404040" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#737373', fontSize: 11 }}
            tickLine={false}
          />
          <Radar
            name="Problems Solved"
            dataKey="normalized"
            stroke="#737373"
            fill="#525252"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-lg">
                    <p className="text-sm text-white font-medium">{data.fullName}</p>
                    <p className="text-xs text-neutral-400">{data.value} problems</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
