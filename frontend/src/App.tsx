import { useCallback, useEffect, useState } from 'react';
import { fetchYieldCurve } from './api/yieldCurve';
import type { YieldCurve } from './api/types';
import YieldCurveChart from './components/YieldCurveChart';
import YieldTable from './components/YieldTable';

function formatDate(isoDate: string): string {
  // Parse as local time
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function App() {
  const [curve, setCurve] = useState<YieldCurve | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchYieldCurve()
      .then(setCurve)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Liquidity Manager</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            US Treasury par yield curve
            {curve && ` — as of ${formatDate(curve.date)}`}
          </p>
        </header>

        {loading && (
          <div className="h-80 w-full animate-pulse rounded-lg bg-[var(--grid-line)]" />
        )}

        {error && !loading && (
          <div className="rounded-lg border border-[var(--grid-line)] p-6">
            <p className="text-sm text-[var(--text-primary)]">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          </div>
        )}

        {curve && !loading && !error && (
          <div className="space-y-8">
            <YieldCurveChart points={curve.points} />
            <YieldTable points={curve.points} />
          </div>
        )}
      </main>
    </div>
  );
}
