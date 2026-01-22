# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeetCode Dashboard (LCD) - A visualization dashboard for LeetCode progress tracking. Uses a "snapshot & store" architecture: Cloudflare Worker fetches data from LeetCode's GraphQL API on a schedule, stores it in D1, and the frontend builds statically from that data.

## Commands

```bash
# Install dependencies (monorepo - both root and worker)
pnpm install

# Frontend development
pnpm dev          # Start Astro dev server
pnpm build        # Production build (outputs to dist/)
pnpm preview      # Preview production build

# Worker development
pnpm worker:dev   # Start local Worker with Wrangler
pnpm worker:deploy # Deploy Worker to Cloudflare

# Worker management (from worker/ directory)
wrangler d1 execute lcd-db --file=./schema.sql  # Initialize/reset DB schema
wrangler secret put LEETCODE_COOKIE              # Set secrets
wrangler tail                                     # View live Worker logs
```

## Architecture

**Monorepo structure** (pnpm workspaces):
- Root: Astro frontend (React + Tailwind + Tremor)
- `worker/`: Cloudflare Worker (TypeScript)

**Data flow:**
1. Worker runs on cron (`*/5 * * * *`) - fetches LeetCode GraphQL API
2. Stores snapshots in D1 (SQLite) with timestamp
3. GitHub Actions builds frontend on push or repository_dispatch
4. Astro fetches from Worker API at build time (`/api/history`)
5. Static site deployed to GitHub Pages

**Key endpoints (Worker):**
- `GET /api/history` - Returns all snapshots as JSON
- `GET /health` - Health check

## Tech Stack

- **Frontend:** Astro 4.x (SSG) + React 18 + Tailwind + Tremor
- **Backend:** Cloudflare Workers + D1 (SQLite)
- **Hosting:** GitHub Pages (frontend), Cloudflare (Worker)
- **Package Manager:** pnpm with workspaces

## Key Files

- `src/pages/index.astro` - Main page, fetches data at build time
- `src/components/Dashboard.tsx` - Main visualization component (Tremor charts)
- `worker/src/index.ts` - Worker entry point (cron handler + HTTP API)
- `worker/schema.sql` - D1 database schema
- `worker/wrangler.toml` - Cloudflare Worker config (bindings, cron, routes)
- `astro.config.mjs` - Site/base URL for GitHub Pages deployment

## Environment Variables

**Frontend (.env):**
- `PUBLIC_WORKER_API_URL` - Worker API base URL

**Worker (Cloudflare secrets):**
- `LEETCODE_COOKIE` - Session cookie from browser
- `LEETCODE_CSRF` - CSRF token from browser cookies
- `LEETCODE_USERNAME` / `LEETCODE_USER_SLUG` - LeetCode user identifiers
- `GH_TOKEN` / `GH_REPO` (optional) - For triggering GitHub rebuilds

## Database Schema

Single `snapshots` table with difficulty counts and skills JSON:
```sql
CREATE TABLE snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  total_easy INTEGER NOT NULL DEFAULT 0,
  total_medium INTEGER NOT NULL DEFAULT 0,
  total_hard INTEGER NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '{}'
);
```

## Styling

Dark theme ("Midnight Developer") with Tailwind. Difficulty colors:
- Easy: `text-green-400`
- Medium: `text-yellow-400`
- Hard: `text-red-400`
- Background: `bg-slate-950` (#0f172a)
