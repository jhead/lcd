import { renderToString } from 'react-dom/server';
import App from '../client/App';
import type { InitialData } from '../shared/types';
import { renderHtml } from './html';

export function renderPage(initialData: InitialData): string {
  const content = renderToString(<App initialData={initialData} />);
  return renderHtml(content, initialData);
}
