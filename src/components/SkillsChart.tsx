import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { HistoryEntry } from '../shared/types';
import type { SkillDataPoint } from '../hooks/useDashboardData';

export interface SkillsChartActiveData {
  date: string;
  skills: SkillDataPoint[];
  isSelected: boolean;
}

interface SkillsChartProps {
  history: HistoryEntry[];
  onActiveChange?: (data: SkillsChartActiveData | null) => void;
}

function getSkillColor(index: number, total: number): string {
  const hue = (index * 360) / total;
  return `hsla(${hue}, 60%, 50%, 1)`;
}

interface ParsedSkillDataPoint {
  tagName: string;
  problemsSolved: number;
}

export default function SkillsChart({ history, onActiveChange }: SkillsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const parsedHistory = history.map(entry => {
    let skills: ParsedSkillDataPoint[] = [];
    try {
      const tags = JSON.parse(entry.tags_json || '{}');
      skills = [
        ...(tags.advanced || []),
        ...(tags.intermediate || []),
        ...(tags.fundamental || []),
      ].map((s: any) => ({
        tagName: s.tagName || 'Unknown',
        problemsSolved: s.problemsSolved || 0,
      }));
    } catch {}
    return { timestamp: entry.timestamp, skills };
  });

  const latestSkills = parsedHistory[parsedHistory.length - 1]?.skills || [];
  const allSkillNames = latestSkills
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .map(s => s.tagName);

  const chartData = parsedHistory.map(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const dataPoint: Record<string, string | number> = { date };

    for (const skillName of allSkillNames) {
      const skill = entry.skills.find(s => s.tagName === skillName);
      dataPoint[skillName] = skill?.problemsSolved ?? 0;
    }

    return dataPoint;
  });

  const displayIndex = hoverIndex ?? selectedIndex ?? null;
  const isSelected = selectedIndex !== null;

  useEffect(() => {
    if (displayIndex === null) {
      onActiveChange?.(null);
    } else {
      const activeData = chartData[displayIndex];
      const skills = allSkillNames
        .map(name => ({
          name,
          value: activeData[name] as number,
        }))
        .sort((a, b) => b.value - a.value);
      onActiveChange?.({
        date: activeData.date as string,
        skills,
        isSelected,
      });
    }
  }, [displayIndex, isSelected]);

  if (allSkillNames.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-neutral-500 text-sm">no skill data</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          onMouseMove={(state) => {
            if (state?.activeTooltipIndex !== undefined) {
              setHoverIndex(state.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
          onClick={(state) => {
            if (state?.activeTooltipIndex !== undefined) {
              const idx = state.activeTooltipIndex;
              setSelectedIndex(prev => prev === idx ? null : idx);
            }
          }}
        >
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#737373', fontSize: 10 }}
            width={30}
          />
          <Tooltip content={() => null} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
          {allSkillNames.map((name, i) => (
            <Bar
              key={name}
              dataKey={name}
              stackId="skills"
              fill={getSkillColor(i, allSkillNames.length)}
              isAnimationActive={false}
              background={(props: { index: number; x: number; y: number; width: number; height: number }) => {
                if (selectedIndex === props.index) {
                  return (
                    <rect
                      x={props.x}
                      y={0}
                      width={props.width}
                      height="100%"
                      fill="rgba(255,255,255,0.1)"
                    />
                  );
                }
                return null;
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
