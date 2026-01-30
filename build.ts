import { build as viteBuild } from 'vite';
import { build as esbuildBuild } from 'esbuild';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const DIST = resolve(ROOT, 'dist');

async function buildClient() {
  console.log('Building client with Vite...');

  await viteBuild({
    configFile: resolve(ROOT, 'vite.config.ts'),
    build: {
      outDir: 'dist/client',
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(ROOT, 'src/client/main.tsx'),
        output: {
          entryFileNames: 'app.js',
          assetFileNames: 'app[extname]',
        },
      },
    },
  });

  console.log('Client built successfully');
}

async function buildServer() {
  console.log('Building server...');

  // Ensure directories exist
  if (!existsSync(resolve(DIST, 'server'))) {
    mkdirSync(resolve(DIST, 'server'), { recursive: true });
  }

  // Read client assets
  const clientJs = readFileSync(resolve(DIST, 'client/app.js'), 'utf-8');
  const clientCss = readFileSync(resolve(DIST, 'client/app.css'), 'utf-8');

  // Build server with inlined client assets
  await esbuildBuild({
    entryPoints: ['src/server/index.ts'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    outfile: 'dist/server/index.js',
    platform: 'browser', // Cloudflare Workers
    jsx: 'automatic',
    conditions: ['worker', 'browser'],
    define: {
      'process.env.NODE_ENV': '"production"',
      '__CLIENT_JS__': JSON.stringify(clientJs),
      '__CLIENT_CSS__': JSON.stringify(clientCss),
      '__BUILD_COMMIT__': JSON.stringify(process.env.BUILD_COMMIT || 'dev'),
      '__BUILD_DATE__': JSON.stringify(process.env.BUILD_DATE || new Date().toISOString()),
    },
    external: [], // Bundle everything
  });

  console.log('Server built successfully');
}

async function main() {
  // Create dist directories
  if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });

  await buildClient();
  await buildServer();

  console.log('Build complete!');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
