# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeetCode Dashboard (LCD) - A visualization dashboard for LeetCode progress tracking. Uses a "snapshot & store" architecture: Cloudflare Worker fetches data from LeetCode's GraphQL API on a schedule, stores it in D1, and the frontend builds statically from that data.

## Commands

```bash
# Install dependencies (monorepo - both root and worker)
pnpm install

# Frontend development
pnpm dev          # Start Vite dev server
pnpm build        # Production build (outputs to dist/)
pnpm preview      # Preview production build (wrangler dev)

# Worker development
pnpm dev:worker   # Start local Worker with Wrangler
pnpm deploy       # Deploy Worker to Cloudflare

# Worker management (from worker/ directory)
wrangler d1 execute lcd-db --file=./schema.sql  # Initialize/reset DB schema
wrangler secret put LEETCODE_COOKIE              # Set secrets
wrangler tail                                     # View live Worker logs
```

## Architecture

**Project structure:**
- Root: React frontend (Vite + Tailwind + Recharts)
- Server: Cloudflare Worker (TypeScript) with SSR

**Data flow:**
1. Worker runs on cron (`*/5 * * * *`) - fetches LeetCode GraphQL API
2. Stores snapshots in D1 (SQLite) with timestamp
3. Worker serves SSR HTML with embedded data at request time
4. React app hydrates on the client
5. Worker serves both API and frontend

**Key endpoints (Worker):**
- `GET /api/history` - Returns all snapshots as JSON
- `GET /health` - Health check

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind + Recharts
- **Backend:** Cloudflare Workers + D1 (SQLite) with SSR
- **Hosting:** Cloudflare Workers
- **Package Manager:** pnpm

## Key Files

- `src/client/App.tsx` - Main React application
- `src/components/Dashboard.tsx` - Main visualization component (Recharts)
- `src/server/index.ts` - Worker entry point (cron handler + HTTP API + SSR)
- `src/server/render.tsx` - SSR HTML rendering
- `src/server/data.ts` - Data fetching from D1
- `schema.sql` - D1 database schema
- `wrangler.toml` - Cloudflare Worker config (bindings, cron, routes)
- `build.ts` - Build script (Vite + esbuild)

## Environment Variables

**Frontend (.env):**
- `PUBLIC_WORKER_API_URL` - Worker API base URL

**Worker (Cloudflare secrets):**
- `LEETCODE_COOKIE` - Session cookie from browser
- `LEETCODE_CSRF` - CSRF token from browser cookies
- `LEETCODE_USERNAME` / `LEETCODE_USER_SLUG` - LeetCode user identifiers
- `GH_TOKEN` / `GH_REPO` (optional) - For triggering GitHub rebuilds
- `TRIGGER_API_KEY` (optional) - API key for `/api/trigger` manual data collection

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
