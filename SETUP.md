# Setup Guide

This guide will help you set up the LeetCode Dashboard project.

## Prerequisites

- Node.js 22+ (with Corepack enabled)
- pnpm (via Corepack)
- Cloudflare account (for Workers and D1)
- GitHub account (for Pages hosting)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Set Up Cloudflare Worker

1. **Create a D1 database:**
   ```bash
   wrangler d1 create lcd-db
   ```
   Copy the database ID from the output.

2. **Update `wrangler.toml`:**
   - Replace `your-database-id-here` with your actual database ID
   - Update the route pattern if you have a custom domain

3. **Initialize the database schema:**
   ```bash
   wrangler d1 execute lcd-db --file=./schema.sql
   ```

4. **Set environment variables:**
   ```bash
   wrangler secret put LEETCODE_COOKIE
   wrangler secret put LEETCODE_CSRF
   wrangler secret put LEETCODE_USERNAME
   wrangler secret put LEETCODE_USER_SLUG
   ```
   
   To get your LeetCode credentials:
   - Open LeetCode in your browser
   - Open Developer Tools → Application → Cookies
   - Copy the `csrftoken` value for `LEETCODE_CSRF`
   - Copy the entire cookie string for `LEETCODE_COOKIE`
   - Your username and user slug are usually the same

5. **Deploy the worker:**
   ```bash
   pnpm deploy
   ```
   
   Note the Worker URL from the output (e.g., `https://lcd-worker.your-subdomain.workers.dev`)

## Step 3: Configure Frontend

The frontend is built with Vite and React. The build process bundles both client and server code into a single Cloudflare Worker.

No additional frontend configuration is needed beyond the Worker setup in Step 2.

## Step 4: Test Locally

```bash
# Start the dev server
pnpm dev

# Build for production
pnpm build

# Preview the production build
pnpm preview
```

## Step 5: Deploy to Cloudflare Workers

1. **Build the project:**
   ```bash
   pnpm build
   ```

2. **Deploy the Worker:**
   ```bash
   pnpm deploy
   ```
   Or use:
   ```bash
   wrangler deploy
   ```

3. **The Worker will automatically collect data:**
   - The cron job runs every 5 minutes (configured in `wrangler.toml`)
   - Data is stored in D1 and served via the Worker's SSR route

## Troubleshooting

### Worker API not accessible
- Check that the Worker is deployed and accessible
- Verify CORS settings if accessing from a different domain
- Check Worker logs: `wrangler tail`

### Build fails
- Ensure all environment variables are set
- Check that the Worker API URL is correct
- Verify the database schema is initialized

### No data showing
- Check that the Worker cron job has run at least once
- Verify the LeetCode credentials are correct
- Check Worker logs for errors

## Next Steps

- Customize the dashboard components
- Add more visualizations (heatmap, radar chart, etc.)
- Set up custom domain
- Add authentication if needed
