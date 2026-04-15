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
  // For recent days: return all raw snapshots (no dedup) so the client can
  // bucket accurately by local timezone. Any fixed UTC offset used for
  // server-side dedup would misalign with the client's local day boundary.
  // For older history: one snapshot per UTC day is fine for chart display.
  // tags_json is stripped from recent rows (large per row) and injected back
  // only on the last entry, which is what useDashboardData uses for skills.
  const cutoffMs = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const [olderResult, recentResult, latestRow] = await Promise.all([
    db.prepare(`
      SELECT id, timestamp, total_easy, total_medium, total_hard, tags_json
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY DATE(timestamp/1000, 'unixepoch')
            ORDER BY timestamp DESC
          ) as rn
        FROM snapshots
        WHERE timestamp <= ?
      ) WHERE rn = 1
      ORDER BY timestamp ASC
    `).bind(cutoffMs).all(),

    db.prepare(`
      SELECT id, timestamp, total_easy, total_medium, total_hard, '{}' as tags_json
      FROM snapshots
      WHERE timestamp > ?
      ORDER BY timestamp ASC
    `).bind(cutoffMs).all(),

    db.prepare(`SELECT tags_json FROM snapshots ORDER BY timestamp DESC LIMIT 1`).first(),
  ]);

  const results = [
    ...(olderResult.results || []),
    ...(recentResult.results || []),
  ] as HistoryEntry[];

  // Restore real tags_json on the last entry for skills display
  if (results.length > 0 && latestRow) {
    results[results.length - 1] = {
      ...results[results.length - 1],
      tags_json: (latestRow as any).tags_json,
    };
  }

  return results;
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

export interface Comment {
  id: number;
  timestamp: number;
  name: string;
  message: string;
}

export async function getComments(db: D1Database): Promise<Comment[]> {
  const result = await db.prepare(
    `SELECT * FROM comments ORDER BY timestamp DESC`
  ).all();
  return (result.results || []) as Comment[];
}

export async function saveComment(
  db: D1Database,
  comment: { name: string; message: string }
): Promise<void> {
  await db.prepare(
    `INSERT INTO comments (timestamp, name, message) VALUES (?, ?, ?)`
  )
    .bind(Date.now(), comment.name, comment.message)
    .run();

  console.log(`Comment saved from: ${comment.name}`);
}
