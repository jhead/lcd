import { Card, AreaChart, Title, Text, Grid, Metric, BarList } from "@tremor/react";

interface HistoryEntry {
  timestamp: number;
  total_easy: number;
  total_medium: number;
  total_hard: number;
  tags_json: string;
}

interface DashboardProps {
  history: HistoryEntry[];
  current: HistoryEntry;
}

export default function Dashboard({ history, current }: DashboardProps) {
  // Format history for the chart
  const chartData = history.map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString(),
    Easy: entry.total_easy,
    Medium: entry.total_medium,
    Hard: entry.total_hard
  }));

  // Parse skill stats from tags_json
  let skillData: Array<{ name: string; value: number }> = [];
  try {
    const tags = JSON.parse(current.tags_json || '{}');
    // Flatten advanced, intermediate, fundamental arrays
    const allSkills = [
      ...(tags.advanced || []),
      ...(tags.intermediate || []),
      ...(tags.fundamental || [])
    ];
    skillData = allSkills
      .map((skill: any) => ({
        name: skill.tagName || 'Unknown',
        value: skill.problemsSolved || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  } catch (e) {
    // If parsing fails, use empty array
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <Grid numItems={1} numItemsSm={3} className="gap-6">
        <Card decoration="top" decorationColor="green" className="bg-slate-800 border-slate-700">
          <Text className="text-slate-300">Easy Solved</Text>
          <Metric className="text-green-400">{current.total_easy}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow" className="bg-slate-800 border-slate-700">
          <Text className="text-slate-300">Medium Solved</Text>
          <Metric className="text-yellow-400">{current.total_medium}</Metric>
        </Card>
        <Card decoration="top" decorationColor="red" className="bg-slate-800 border-slate-700">
          <Text className="text-slate-300">Hard Solved</Text>
          <Metric className="text-red-400">{current.total_hard}</Metric>
        </Card>
      </Grid>

      {/* Main Progression Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <Title className="text-white">Progression Over Time</Title>
        <AreaChart
          className="h-72 mt-4"
          data={chartData}
          index="date"
          categories={["Easy", "Medium", "Hard"]}
          colors={["green", "yellow", "red"]}
          valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
        />
      </Card>

      {/* Skill Breakdown */}
      {skillData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <Title className="text-white">Top Skills</Title>
          <div className="mt-4">
            <BarList
              data={skillData}
              valueFormatter={(number) => `${number} problems`}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
