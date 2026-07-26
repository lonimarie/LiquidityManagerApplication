import { useCallback, useEffect, useState } from 'react';
import { fetchYieldCurve } from './api/yieldCurve';
import { fetchOrders } from './api/orders';
import type { OrderPage, YieldCurve } from './api/types';
import YieldCurveChart from './components/YieldCurveChart';
import YieldTable from './components/YieldTable';
import OrderForm from './components/OrderForm';
import OrderHistory from './components/OrderHistory';
import UserPicker from './components/UserPicker';
import YearPicker, { CURRENT_YEAR } from './components/YearPicker';
import { loadUserId, saveUserId } from './lib/users';

function formatDate(isoDate: string): string {
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

  const [userId, setUserId] = useState(loadUserId);
  const [orderPage, setOrderPage] = useState<OrderPage | null>(null);
  const [page, setPage] = useState(0);

  const [year, setYear] = useState(CURRENT_YEAR);
  const isHistorical = year !== CURRENT_YEAR;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchYieldCurve(year)
      .then(setCurve)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(load, [load]);

  const loadOrders = useCallback(() => {
    fetchOrders(userId, page)
      .then(setOrderPage)
      .catch(() => setOrderPage(null));
  }, [userId, page]);

  useEffect(loadOrders, [loadOrders]);

  function handleUserChange(next: string) {
    setUserId(next);
    saveUserId(next);
    setPage(0);
  }

  function handlePlaced() {
    if (page === 0) {
      loadOrders();
    } else {
      setPage(0);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Liquidity Manager</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              US Treasury par yield curve
              {curve && ` — ${isHistorical ? 'closing curve' : 'as of'} ${formatDate(curve.date)}`}
            </p>
          </div>
          <div className="flex items-end gap-4">
            <YearPicker year={year} onChange={setYear} />
            <UserPicker userId={userId} onChange={handleUserChange} />
          </div>
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
          <div className="space-y-10">
            <YieldCurveChart points={curve.points} />
            <OrderForm
              key={userId}
              userId={userId}
              points={curve.points}
              onPlaced={handlePlaced}
              historicalYear={isHistorical ? year : undefined}
            />
            {orderPage && <OrderHistory page={orderPage} onPageChange={setPage} />}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                All published rates
              </h2>
              <YieldTable points={curve.points} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
