import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { escapeToBuffer } from 'hono/utils/html';
import type { Env } from '../shared/types';
import { getHistory, getLsrHistory, collectData, saveLsrSnapshot, getComments, saveComment } from './data';
import { renderPage } from './render';

type Bindings = Env;

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware for API routes
const ALLOWED_ORIGINS = [
  'http://localhost:4321',
  'http://localhost:5173',
  'https://jhead.github.io'
];

app.use('/api/*', cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-Key'],
  maxAge: 86400,
}));

// SSR route - serve HTML with embedded data
app.get('/', async (c) => {
  try {
    const [history, lsrHistory] = await Promise.all([
      getHistory(c.env.DB),
      getLsrHistory(c.env.DB),
    ]);

    const html = renderPage({ history, lsrHistory });

    return c.html(html, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 min cache, matches cron
      },
    });
  } catch (error) {
    console.error('SSR error:', error);
    return c.text('Internal Server Error', 500);
  }
});

// API: History
app.get('/api/history', async (c) => {
  try {
    const history = await getHistory(c.env.DB);
    return c.json(history);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// API: LSR History
app.get('/api/lsr/history', async (c) => {
  try {
    const history = await getLsrHistory(c.env.DB);
    return c.json(history);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// API: LSR Snapshot (POST)
app.post('/api/lsr/snapshot', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!c.env.LSR_API_KEY || apiKey !== c.env.LSR_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json<{
      timestamp: number;
      counts: {
        strong: number;
        learning: number;
        weak: number;
        leech: number;
        unknown: number;
        total: number;
      };
    }>();

    await saveLsrSnapshot(c.env.DB, body);
    return c.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error saving LSR snapshot:', error);
    return c.json({ error: 'Failed to save snapshot', details: error.message }, 500);
  }
});

// API: Manual trigger (for testing)
app.get('/api/trigger', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!c.env.TRIGGER_API_KEY || apiKey !== c.env.TRIGGER_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    await collectData(c.env);
    return c.json({ status: 'success', message: 'Data collection completed' });
  } catch (error: any) {
    return c.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
    }, 500);
  }
});

// API: Comments (GET - read all)
app.get('/api/comments', async (c) => {
  try {
    const comments = await getComments(c.env.DB);
    return c.json(comments);
  } catch (error) {
    return c.json({ error: 'Database error' }, 500);
  }
});

// Escape HTML using Hono's built-in escapeToBuffer (preserves emojis/unicode)
const escapeHtml = (str: string): string => {
  const buffer = [''];
  escapeToBuffer(str, buffer);
  return buffer[0];
};

// API: Comments (POST - submit new)
app.post('/api/comments', async (c) => {
  try {
    const body = await c.req.json<{ name?: string; message: string }>();

    if (!body.message || typeof body.message !== 'string') {
      return c.json({ error: 'Message required' }, 400);
    }

    const message = escapeHtml(body.message.trim().slice(0, 500));
    const name = escapeHtml((body.name?.trim() || 'anon').slice(0, 50));

    if (!message) {
      return c.json({ error: 'Message required' }, 400);
    }

    await saveComment(c.env.DB, { name, message });
    return c.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error saving comment:', error);
    return c.json({ error: 'Failed to save comment' }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Favicon (return empty SVG for now)
app.get('/favicon.svg', (c) => {
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📊</text></svg>', {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(collectData(env));
  },
};
