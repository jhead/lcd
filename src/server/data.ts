import type { Env, HistoryEntry, LSRSnapshot } from '../shared/types';

// LeetCode GraphQL Queries
const queryProgress = `
  query userProfileUserQuestionProgressV2($userSlug: String!) {
    userProfileUserQuestionProgressV2(userSlug: $userSlug) {
      numAcceptedQuestions {
        difficulty
        count
      }
    }
  }
`;

const querySkills = `
  query skillStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
  }
`;

async function fetchGQL(
  query: string,
  variables: Record<string, string>,
  env: Env,
  queryName?: string
): Promise<any> {
  const LEETCODE_API = 'https://leetcode.com/graphql/';

  const headers = {
    'content-type': 'application/json',
    'Cookie': env.LEETCODE_COOKIE,
    'x-csrftoken': env.LEETCODE_CSRF,
    'Referer': 'https://leetcode.com',
    'Origin': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const requestBody = { query, variables };
  console.log(`[${queryName || 'GQL'}] Making request with variables:`, JSON.stringify(variables));

  const response = await fetch(LEETCODE_API, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${queryName || 'GQL'}] Error response (${response.status}):`, errorText);
    throw new Error(`LeetCode API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 500)}`);
  }

  const data = await response.json() as { data?: any; errors?: any[] };
  if (data.errors) {
    console.error(`[${queryName || 'GQL'}] GraphQL errors:`, JSON.stringify(data.errors));
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data;
}

export async function getHistory(db: D1Database): Promise<HistoryEntry[]> {
  // Deduplicate to one row per day (latest snapshot per day)
  // This reduces payload size while preserving tags_json for skills-over-time charting
  const result = await db.prepare(`
    SELECT id, timestamp, total_easy, total_medium, total_hard, tags_json
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY DATE(timestamp/1000, 'unixepoch')
          ORDER BY timestamp DESC
        ) as rn
      FROM snapshots
    ) WHERE rn = 1
    ORDER BY timestamp ASC
  `).all();
  return (result.results || []) as HistoryEntry[];
}

export async function getLsrHistory(db: D1Database): Promise<LSRSnapshot[]> {
  const result = await db.prepare(
    `SELECT * FROM lsr_snapshots ORDER BY timestamp ASC`
  ).all();
  return (result.results || []) as LSRSnapshot[];
}

export async function collectData(env: Env): Promise<void> {
  try {
    console.log('Starting data fetch...');
    console.log('User slug:', env.LEETCODE_USER_SLUG);
    console.log('Username:', env.LEETCODE_USERNAME);

    // Fetch progress
    const progress = await fetchGQL(queryProgress, { userSlug: env.LEETCODE_USER_SLUG }, env, 'progress');

    // Fetch skills (optional - may fail if query structure is wrong)
    let skills: any = { data: { matchedUser: { tagProblemCounts: {} } } };
    try {
      skills = await fetchGQL(querySkills, { username: env.LEETCODE_USERNAME }, env, 'skills');
    } catch (error: any) {
      console.warn('Skills query failed, continuing without skills data:', error.message);
    }

    // Parse progress
    const progressData = progress.data.userProfileUserQuestionProgressV2;
    const numAccepted = progressData.numAcceptedQuestions;
    const easyCount = numAccepted.find((q: any) => q.difficulty === 'EASY')?.count || 0;
    const mediumCount = numAccepted.find((q: any) => q.difficulty === 'MEDIUM')?.count || 0;
    const hardCount = numAccepted.find((q: any) => q.difficulty === 'HARD')?.count || 0;

    // Save to D1
    await env.DB.prepare(
      `INSERT INTO snapshots (timestamp, total_easy, total_medium, total_hard, tags_json) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        Date.now(),
        easyCount,
        mediumCount,
        hardCount,
        JSON.stringify(skills.data.matchedUser?.tagProblemCounts || {})
      )
      .run();

    console.log(`Snapshot saved: Easy=${easyCount}, Medium=${mediumCount}, Hard=${hardCount}`);
  } catch (error) {
    console.error('Error in data collection:', error);
    throw error;
  }
}

export async function saveLsrSnapshot(
  db: D1Database,
  snapshot: {
    timestamp: number;
    counts: {
      strong: number;
      learning: number;
      weak: number;
      leech: number;
      unknown: number;
      total: number;
    };
  }
): Promise<void> {
  await db.prepare(
    `INSERT INTO lsr_snapshots (timestamp, strong, learning, weak, leech, unknown, total) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      snapshot.timestamp,
      snapshot.counts.strong,
      snapshot.counts.learning,
      snapshot.counts.weak,
      snapshot.counts.leech,
      snapshot.counts.unknown,
      snapshot.counts.total
    )
    .run();

  console.log(`LSR snapshot saved: Strong=${snapshot.counts.strong}, Learning=${snapshot.counts.learning}, Weak=${snapshot.counts.weak}, Leech=${snapshot.counts.leech}, Unknown=${snapshot.counts.unknown}, Total=${snapshot.counts.total}`);
}
