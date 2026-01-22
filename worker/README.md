# LCD Worker

Cloudflare Worker for collecting LeetCode statistics daily and storing them in D1.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create D1 database:
```bash
wrangler d1 create lcd-db
```

3. Update `wrangler.toml` with your database ID.

4. Initialize the database schema:
```bash
wrangler d1 execute lcd-db --file=./schema.sql
```

5. Set environment variables:
```bash
wrangler secret put LEETCODE_COOKIE
wrangler secret put LEETCODE_CSRF
wrangler secret put LEETCODE_USERNAME
wrangler secret put LEETCODE_USER_SLUG
# Optional: for triggering GitHub Actions
wrangler secret put GH_TOKEN
```

6. Deploy:
```bash
pnpm deploy
```

## Development

Run locally:
```bash
pnpm dev
```

## Environment Variables

- `LEETCODE_COOKIE`: Your LeetCode session cookie
- `LEETCODE_CSRF`: Your LeetCode CSRF token
- `LEETCODE_USERNAME`: Your LeetCode username
- `LEETCODE_USER_SLUG`: Your LeetCode user slug (usually same as username)
- `GH_TOKEN` (optional): GitHub token for triggering rebuilds
- `GH_REPO` (optional): GitHub repo in format "owner/repo"

## API Endpoints

- `GET /api/history`: Returns all snapshots as JSON
- `GET /health`: Health check endpoint
