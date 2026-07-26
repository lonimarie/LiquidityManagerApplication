import { useCallback, useEffect, useState } from 'react';
import { fetchYieldCurve } from './api/yieldCurve';
import { fetchOrders } from './api/orders';
import type { Order, OrderPage, YieldCurve } from './api/types';
import YieldCurveChart from './components/YieldCurveChart';
import YieldTable from './components/YieldTable';
import OrderModal from './components/OrderModal';
import OrderHistory from './components/OrderHistory';
import PlaceOrderButton from './components/PlaceOrderButton';
import UserPicker from './components/UserPicker';
import YearPicker, { CURRENT_YEAR } from './components/YearPicker';
import { formatCurrency, formatRate } from './lib/format';
import { shortTenor } from './lib/tenor';
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

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

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
    setConfirmation(null);
  }

  // The modal closes on success, so the confirmation lives out here to stay visible.
  function handlePlaced(order: Order) {
    setConfirmation(
      `Order placed: ${formatCurrency(order.amount)} at ${shortTenor(order.termLabel)} — ${formatRate(order.ratePercent)}`,
    );

    if (page === 0) {
      loadOrders();
    } else {
      setPage(0);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Liquidity Manager</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              US Treasury par yield curve
              {curve && ` — ${isHistorical ? 'closing curve' : 'as of'} ${formatDate(curve.date)}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-end gap-4">
            <YearPicker year={year} onChange={setYear} />
            <UserPicker userId={userId} onChange={handleUserChange} />
            <PlaceOrderButton
              disabled={isHistorical || !curve}
              disabledReason={
                isHistorical
                  ? `You're viewing the ${year} closing curve. Orders always book at the current published rate, so switch the curve year back to ${CURRENT_YEAR} to place one.`
                  : 'The yield curve is still loading.'
              }
              onClick={() => setModalOpen(true)}
            />
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
              className="mt-4 cursor-pointer rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--series-1-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {curve && !loading && !error && (
          <div className="space-y-10">
            <YieldCurveChart points={curve.points} />

            {confirmation && (
              <p
                className="rounded-md border border-[var(--grid-line)] px-4 py-3 text-sm text-[#0ca30c]"
                role="status"
              >
                {confirmation}
              </p>
            )}

            {orderPage && <OrderHistory page={orderPage} onPageChange={setPage} />}

            <div>
              {/* The year comes from the curve itself rather than the picker, so it stays
                  truthful if a request ever falls back to the previous year. */}
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                All published rates{' '}
                <span className="font-normal tabular-nums text-[var(--text-secondary)]">
                  ({curve.date.slice(0, 4)})
                </span>
              </h2>
              <YieldTable points={curve.points} />
            </div>
          </div>
        )}

        {curve && (
          <OrderModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            userId={userId}
            points={curve.points}
            onPlaced={handlePlaced}
          />
        )}
      </main>
    </div>
  );
}
