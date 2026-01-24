# LeetCode Dashboard (LCD)

A specialized, aesthetic dashboard that visualizes your LeetCode journey with progression over time, granular skill breakdowns, and a "dark-mode first" developer-centric design.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Visualization:** Recharts
- **Backend/Cron:** Cloudflare Workers (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Hosting:** Cloudflare Workers

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
/
├── src/
│   ├── client/         # React client application
│   ├── components/     # React components (Dashboard, SkillRadar, etc.)
│   ├── server/         # Cloudflare Worker server code
│   └── shared/         # Shared types and utilities
├── build.ts            # Build script
└── wrangler.toml       # Cloudflare Worker configuration
```

## Setup

See `SETUP.md` for detailed setup instructions.

Quick start:
1. Install dependencies: `pnpm install`
2. Set up Cloudflare Worker (see `SETUP.md`)
3. Configure environment variables
4. Deploy to Cloudflare Workers

See `PLAN.md` for the original implementation plan and architecture.
