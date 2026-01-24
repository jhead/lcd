import Dashboard from '../components/Dashboard';
import type { InitialData } from '../shared/types';

interface AppProps {
  initialData?: InitialData;
}

export default function App({ initialData }: AppProps) {
  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl">
        <Dashboard
          initialHistory={initialData?.history}
          initialLsrHistory={initialData?.lsrHistory}
        />
      </div>
    </main>
  );
}
