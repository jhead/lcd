### **1. Product Requirements Document (PRD)**

#### **1.1. Executive Summary**

A specialized, aesthetic dashboard that visualizes a user's LeetCode journey. Unlike the standard LeetCode profile, this app emphasizes **progression over time**, granular skill breakdowns, and a "dark-mode first" developer-centric design. It operates on a "snapshot" architecture, recording daily stats to visualize trends that LeetCode's native UI does not expose clearly.

#### **1.2. Core Features**

* **Historical Progression Graph:** A line/area chart showing the growth of "Problems Solved" (Easy/Medium/Hard) over weeks and months.
* **Skill Radar:** Visualization of strength across specific tags (e.g., DP, Arrays, Graphs) based on the `skillStats` query.
* **Submission Heatmap:** A GitHub-style contribution graph specifically for LeetCode submissions.
* **Efficiency Metrics:** calculated fields like "Acceptance Rate" (Ac/Total Submissions) and "Beats %" derived from session data.
* **Time Travel:** Date range pickers to filter statistics (e.g., "Last 30 Days," "Since Inception").

#### **1.3. UI/UX Design**

* **Theme:** "Midnight Developer" – Deep slate backgrounds (`#0f172a`), neon accents for difficulty (Green: Easy, Orange/Yellow: Medium, Red: Hard).
* **Layout:** Bento-grid dashboard layout (modular cards).
* **Interactivity:** Hover states on charts reveal exact counts; animations on load.
* **Library Choice:** **Tremor** (built on top of Recharts + Tailwind). It provides pre-styled, dashboard-grade components that look professional out of the box.

---

### **2. Technical Architecture**

#### **2.1. High-Level Architecture**

The system uses a **"Snapshot & Store"** pattern. Since the LeetCode API returns current totals, we must log these values daily to build a history.

**Flow:**

1. **Ingest (Cloudflare Worker):** A Cron trigger runs daily. It fetches data from LeetCode GraphQL API.
2. **Storage (Cloudflare D1):** The Worker pushes the JSON payload into a D1 (SQLite) database with a timestamp.
3. **Build (GitHub Actions):** The Worker triggers a repository dispatch event (or the Cron runs on GH Actions directly) to rebuild the Astro site.
4. **Render (Astro):** At build time, Astro fetches the full history from D1, pre-renders the HTML/JS.
5. **Serve (GitHub Pages):** The static site is hosted on GH Pages.

#### **2.2. Tech Stack**

* **Frontend:** Astro (SSG Mode) + React + Tailwind CSS.
* **Viz Library:** Tremor (React).
* **Backend/Cron:** Cloudflare Workers (Typescript).
* **Database:** Cloudflare D1 (SQLite) - *Chosen for low latency and zero-config integration with Workers.*
* **Hosting:** GitHub Pages.

---

### **3. Implementation Guide**

#### **Step 1: The Data Layer (Cloudflare Worker + D1)**

We need to persist the data to show "progression."

**Database Schema (SQL):**

```sql
CREATE TABLE snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  total_easy INTEGER,
  total_medium INTEGER,
  total_hard INTEGER,
  tags_json TEXT -- Store the elaborate skill stats as a JSON blob
);

```

**Worker Script (`src/index.ts`):**
This worker will execute the 3 queries provided in your sample, aggregate them, and insert a row into D1.

```typescript
// Skeleton logic for the Worker
export default {
  async scheduled(event, env, ctx) {
    const LEETCODE_API = 'https://leetcode.com/graphql/';
    
    // 1. Fetch Data (Run your 3 queries here)
    // Note: You must use the Cookie/CSRF headers provided in your sample
    const headers = {
        'content-type': 'application/json',
        'Cookie': env.LEETCODE_COOKIE, 
        'x-csrftoken': env.LEETCODE_CSRF,
        'User-Agent': '...' // Essential to mimic browser
    };

    // Helper to fetch
    const fetchGQL = async (query, variables) => { /* fetch logic */ };

    const [progress, session, skills] = await Promise.all([
      fetchGQL(queryProgress, { userSlug: "jhead" }),
      fetchGQL(querySession, { username: "jhead" }),
      fetchGQL(querySkills, { username: "jhead" })
    ]);

    // 2. Parse & Prepare
    const easyCount = progress.data.userProfileUserQuestionProgressV2.numAcceptedQuestions.find(q => q.difficulty === 'EASY').count;
    // ... extract other stats ...

    // 3. Save to D1
    await env.DB.prepare(
      `INSERT INTO snapshots (timestamp, total_easy, total_medium, total_hard, tags_json) VALUES (?, ?, ?, ?, ?)`
    ).bind(Date.now(), easyCount, mediumCount, hardCount, JSON.stringify(skills)).run();
    
    // 4. Trigger Rebuild (Optional: Call GitHub API to trigger Pages build)
    await triggerGitHubBuild(env.GH_TOKEN);
  }
};

```

#### **Step 2: The Frontend (Astro + React)**

**Project Structure:**

```text
/src
  /components
    Dashboard.tsx    <-- React (Tremor)
    SkillRadar.tsx   <-- React (Recharts)
  /layouts
    Layout.astro
  /pages
    index.astro      <-- Server-side data fetching happens here

```

**`src/pages/index.astro` (Data Injection):**
Astro runs at build time. It will connect to the D1 database (via Cloudflare binding or API) to get the history.

```astro
---
// Server Side Logic
import Layout from '../layouts/Layout.astro';
import Dashboard from '../components/Dashboard';

// In Astro, if you deploy to CF Pages, you can bind D1 directly. 
// For GH Pages, you need to expose your D1 data via a public API endpoint 
// OR fetch it during the build process if using an adapter.

// Mocking the fetch for the static build
const historyData = await fetch('https://your-worker.your-subdomain.workers.dev/api/history').then(r => r.json());
const currentStats = historyData[historyData.length - 1];
---

<Layout title="LeetCode Stats">
  <main class="bg-slate-900 min-h-screen p-8 text-white">
    <h1 class="text-3xl font-bold mb-8">Engineering Progression</h1>
    <Dashboard client:load history={historyData} current={currentStats} />
  </main>
</Layout>

```

#### **Step 3: Visualizations (React + Tremor)**

**`src/components/Dashboard.tsx`:**

```tsx
import { Card, AreaChart, Title, Text, Grid, Metric, Flex, ProgressBar } from "@tremor/react";

export default function Dashboard({ history, current }) {
  // Format history for the chart
  const chartData = history.map(entry => ({
    date: new Date(entry.timestamp).toLocaleDateString(),
    Easy: entry.total_easy,
    Medium: entry.total_medium,
    Hard: entry.total_hard
  }));

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <Grid numItems={1} numItemsSm={3} className="gap-6">
        <Card decoration="top" decorationColor="green">
          <Text>Easy Solved</Text>
          <Metric>{current.total_easy}</Metric>
        </Card>
        <Card decoration="top" decorationColor="yellow">
          <Text>Medium Solved</Text>
          <Metric>{current.total_medium}</Metric>
        </Card>
        <Card decoration="top" decorationColor="red">
          <Text>Hard Solved</Text>
          <Metric>{current.total_hard}</Metric>
        </Card>
      </Grid>

      {/* Main Progression Chart */}
      <Card>
        <Title>Progression Over Time</Title>
        <AreaChart
          className="h-72 mt-4"
          data={chartData}
          index="date"
          categories={["Easy", "Medium", "Hard"]}
          colors={["green", "yellow", "red"]}
          valueFormatter={(number) => Intl.NumberFormat("us").format(number).toString()}
        />
      </Card>
    </div>
  );
}

```

#### **Step 4: Deployment Workflow**

To publish to GitHub Pages using Astro, create a `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  repository_dispatch:
    types: [update_stats] # Triggered by your Cloudflare Worker

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install & Build
        run: |
          npm install
          npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist

```

### **4. Specific Data Handling (GraphQL)**

The queries you provided are perfect. Here is how to map the raw GraphQL response to the UI state:

1. **`userProfileUserQuestionProgressV2`**: Use this for the **Total Solved** KPI cards.
* *Mapping:* `numAcceptedQuestions` array maps directly to the Easy/Med/Hard cards.


2. **`skillStats`**: Use this for a **TreeMap** or **Bar List**.
* *Mapping:* Flatten `advanced`, `intermediate`, `fundamental` arrays.
* *Viz:* A Tremor `BarList` is perfect here. Sort by `problemsSolved` descending to show your strongest areas (e.g., Arrays: 14, Strings: 10).


3. **`userSessionBeatsPercentage`**: Use this for a **Benchmarks** section.
* *Viz:* A `Tracker` or `ProgressBar` showing how you compare to other users (e.g., "Beats 53% of users in Medium").
