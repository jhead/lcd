import Dashboard from '../components/Dashboard';
import type { InitialData } from '../shared/types';

interface AppProps {
  initialData?: InitialData;
}

const formatBuildDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export default function App({ initialData }: AppProps) {
  const commit = (typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'dev').slice(0, 7);
  const date = formatBuildDate(typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '');

  return (
    <main className="min-h-dvh p-3 md:p-6 flex flex-col">
      <div className="max-w-6xl h-full flex-1">
        <Dashboard
          initialHistory={initialData?.history}
          initialLsrHistory={initialData?.lsrHistory}
        />
      </div>
      <footer className="text-[10px] text-neutral-700 text-center mt-4 font-mono">
        site {commit}{date && ` · ${date}`} · <a href="https://github.com/jhead/lcd" className="hover:text-neutral-500">github</a>
      </footer>
    </main>
  );
}
