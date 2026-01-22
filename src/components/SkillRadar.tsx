import { Card, Title } from "@tremor/react";

interface SkillRadarProps {
  skills: Array<{
    name: string;
    value: number;
  }>;
}

export default function SkillRadar({ skills }: SkillRadarProps) {
  // This is a placeholder for a radar chart
  // You can implement a custom radar chart using Recharts or another library
  return (
    <Card className="bg-slate-800 border-slate-700">
      <Title className="text-white">Skill Radar</Title>
      <div className="mt-4 text-slate-400">
        <p>Radar chart visualization coming soon...</p>
        <ul className="mt-4 space-y-2">
          {skills.map((skill) => (
            <li key={skill.name} className="flex justify-between">
              <span>{skill.name}</span>
              <span>{skill.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
