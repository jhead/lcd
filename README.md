# LeetCode Dashboard (LCD)

A specialized, aesthetic dashboard that visualizes your LeetCode journey with progression over time, granular skill breakdowns, and a "dark-mode first" developer-centric design.

## Tech Stack

- **Frontend:** Astro (SSG) + React + Tailwind CSS
- **Visualization:** Tremor (React)
- **Backend/Cron:** Cloudflare Workers (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Hosting:** GitHub Pages

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
│   ├── components/     # React components (Dashboard, SkillRadar, etc.)
│   ├── layouts/        # Astro layouts
│   └── pages/          # Astro pages
├── worker/             # Cloudflare Worker for data collection
└── .github/workflows/  # GitHub Actions for deployment
```

## Setup

See `SETUP.md` for detailed setup instructions.

Quick start:
1. Install dependencies: `pnpm install`
2. Set up Cloudflare Worker (see `worker/README.md`)
3. Configure environment variables
4. Deploy to GitHub Pages

See `PLAN.md` for the original implementation plan and architecture.
