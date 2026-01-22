// LeetCode GraphQL Queries
const queryProgress = `
  query userProfileUserQuestionProgressV2($userSlug: String!) {
    userProfileUserQuestionProgressV2(userSlug: $userSlug) {
      numAcceptedQuestions {
        difficulty
        count
      }
      userSessionBeatsPercentage {
        difficulty
        percentage
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

interface Env {
  DB: D1Database;
  LEETCODE_COOKIE: string;
  LEETCODE_CSRF: string;
  GH_TOKEN?: string;
  LEETCODE_USERNAME: string;
  LEETCODE_USER_SLUG: string;
}

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

async function triggerGitHubBuild(ghToken?: string, repo?: string): Promise<void> {
  if (!ghToken || !repo) {
    console.log('GitHub token or repo not configured, skipping build trigger');
    return;
  }

  try {
    const [owner, repoName] = repo.split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${ghToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'update_stats'
      })
    });

    if (!response.ok) {
      console.error(`Failed to trigger GitHub build: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error triggering GitHub build:', error);
  }
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:4321',
  'https://jhead.github.io'
];

function getCorsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Check if the origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }

  return headers;
}

async function collectData(env: Env): Promise<void> {
  try {
    // 1. Fetch Data (Run the 2 queries)
    console.log('Starting data fetch...');
    console.log('User slug:', env.LEETCODE_USER_SLUG);
    console.log('Username:', env.LEETCODE_USERNAME);
    
    // Fetch progress (includes beats percentage)
    const progress = await fetchGQL(queryProgress, { userSlug: env.LEETCODE_USER_SLUG }, env, 'progress');
    
    // Fetch skills (optional - may fail if query structure is wrong)
    let skills: any = { data: { matchedUser: { tagProblemCounts: {} } } };
    try {
      skills = await fetchGQL(querySkills, { username: env.LEETCODE_USERNAME }, env, 'skills');
    } catch (error: any) {
      console.warn('Skills query failed, continuing without skills data:', error.message);
    }

    // 2. Parse & Prepare
    const progressData = progress.data.userProfileUserQuestionProgressV2;
    const numAccepted = progressData.numAcceptedQuestions;
    const easyCount = numAccepted.find((q: any) => q.difficulty === 'EASY')?.count || 0;
    const mediumCount = numAccepted.find((q: any) => q.difficulty === 'MEDIUM')?.count || 0;
    const hardCount = numAccepted.find((q: any) => q.difficulty === 'HARD')?.count || 0;

    // Parse beats percentages from progress query
    const beatsData = progressData.userSessionBeatsPercentage || [];
    const beats: Record<string, number> = {};
    for (const item of beatsData) {
      beats[item.difficulty.toLowerCase()] = item.percentage;
    }

    // 3. Save to D1
    await env.DB.prepare(
      `INSERT INTO snapshots (timestamp, total_easy, total_medium, total_hard, tags_json, beats_json) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        Date.now(),
        easyCount,
        mediumCount,
        hardCount,
              JSON.stringify(skills.data.matchedUser?.tagProblemCounts || {}),
        JSON.stringify(beats)
      )
      .run();

    console.log(`Snapshot saved: Easy=${easyCount}, Medium=${mediumCount}, Hard=${hardCount}, Beats=${JSON.stringify(beats)}`);

    // 4. Trigger Rebuild (Optional)
    // Uncomment and configure if you want to trigger GitHub Actions rebuild
    // await triggerGitHubBuild(env.GH_TOKEN, env.GH_REPO);
  } catch (error) {
    console.error('Error in data collection:', error);
    throw error;
  }
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(collectData(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
      });
    }

    // API endpoint to fetch history
    if (url.pathname === '/api/history') {
      try {
        const result = await env.DB.prepare(
          `SELECT * FROM snapshots ORDER BY timestamp ASC`
        ).all();

        return new Response(JSON.stringify(result.results || []), {
          headers: getCorsHeaders(origin)
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500,
          headers: getCorsHeaders(origin)
        });
      }
    }

    // Manual trigger endpoint for testing
    if (url.pathname === '/api/trigger') {
      try {
        await collectData(env);
        return new Response(JSON.stringify({ status: 'success', message: 'Data collection completed' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        return new Response(JSON.stringify({ 
          status: 'error', 
          error: error.message,
          stack: error.stack 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
