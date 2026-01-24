import type { InitialData } from '../shared/types';

// These will be injected at build time
declare const __CLIENT_JS__: string;
declare const __CLIENT_CSS__: string;

export function renderHtml(content: string, initialData: InitialData): string {
  const dataScript = `window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="LeetCode Dashboard" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>LeetCode Stats</title>
    <style>${typeof __CLIENT_CSS__ !== 'undefined' ? __CLIENT_CSS__ : ''}</style>
  </head>
  <body class="bg-black text-white">
    <div id="root">${content}</div>
    <script>${dataScript}</script>
    <script type="module">${typeof __CLIENT_JS__ !== 'undefined' ? __CLIENT_JS__ : ''}</script>
  </body>
</html>`;
}
