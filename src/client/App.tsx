import Dashboard from '../components/Dashboard';
import type { InitialData } from '../shared/types';

interface AppProps {
  initialData?: InitialData;
}

export default function App({ initialData }: AppProps) {
  return (
    <main className="h-dvh p-3 md:p-6 overflow-hidden">
      <div className="max-w-6xl h-full">
        <Dashboard
          initialHistory={initialData?.history}
          initialLsrHistory={initialData?.lsrHistory}
        />
      </div>
    </main>
  );
}
