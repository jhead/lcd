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

const querySession = `
  query userSessionBeatsPercentage($username: String!) {
    userSessionBeatsPercentage(username: $username) {
      difficulty
      percentage
    }
  }
`;

const querySkills = `
  query skillStats($username: String!) {
    skillStats(username: $username) {
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
  env: Env
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

  const response = await fetch(LEETCODE_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`LeetCode API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.errors) {
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

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          // 1. Fetch Data (Run the 3 queries)
          const [progress, session, skills] = await Promise.all([
            fetchGQL(queryProgress, { userSlug: env.LEETCODE_USER_SLUG }, env),
            fetchGQL(querySession, { username: env.LEETCODE_USERNAME }, env),
            fetchGQL(querySkills, { username: env.LEETCODE_USERNAME }, env)
          ]);

          // 2. Parse & Prepare
          const numAccepted = progress.data.userProfileUserQuestionProgressV2.numAcceptedQuestions;
          const easyCount = numAccepted.find((q: any) => q.difficulty === 'EASY')?.count || 0;
          const mediumCount = numAccepted.find((q: any) => q.difficulty === 'MEDIUM')?.count || 0;
          const hardCount = numAccepted.find((q: any) => q.difficulty === 'HARD')?.count || 0;

          // 3. Save to D1
          await env.DB.prepare(
            `INSERT INTO snapshots (timestamp, total_easy, total_medium, total_hard, tags_json) VALUES (?, ?, ?, ?, ?)`
          )
            .bind(
              Date.now(),
              easyCount,
              mediumCount,
              hardCount,
              JSON.stringify(skills.data.skillStats || {})
            )
            .run();

          console.log(`Snapshot saved: Easy=${easyCount}, Medium=${mediumCount}, Hard=${hardCount}`);

          // 4. Trigger Rebuild (Optional)
          // Uncomment and configure if you want to trigger GitHub Actions rebuild
          // await triggerGitHubBuild(env.GH_TOKEN, env.GH_REPO);
        } catch (error) {
          console.error('Error in scheduled task:', error);
          throw error;
        }
      })()
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API endpoint to fetch history
    if (url.pathname === '/api/history') {
      try {
        const result = await env.DB.prepare(
          `SELECT * FROM snapshots ORDER BY timestamp ASC`
        ).all();

        return new Response(JSON.stringify(result.results || []), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
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
