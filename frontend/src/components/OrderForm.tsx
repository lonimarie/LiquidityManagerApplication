import { useState } from 'react';
import type { Order, YieldPoint } from '../api/types';
import { OrderError, placeOrder } from '../api/orders';
import { formatCurrency, formatRate } from '../lib/format';
import { shortTenor } from '../lib/tenor';

interface Props {
  userId: string;
  points: YieldPoint[];
  onPlaced: (order: Order) => void;
}

export default function OrderForm({ userId, points, onPlaced }: Props) {
  const [termLabel, setTermLabel] = useState(points[0]?.label ?? '');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<OrderError | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const selected = points.find((point) => point.label === termLabel);
  const parsedAmount = Number(amount);
  const canSubmit = !submitting && termLabel !== '' && amount !== '' && parsedAmount > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setConfirmation(null);

    try {
      // The server resolves the rate, so the created order is the authoritative record.
      const order = await placeOrder(userId, { termLabel, amount: parsedAmount });
      onPlaced(order);
      setConfirmation(
        `Order placed: ${formatCurrency(order.amount)} at ${shortTenor(order.termLabel)} — ${formatRate(order.ratePercent)}`,
      );
      setAmount('');
    } catch (e) {
      setError(e instanceof OrderError ? e : new OrderError('Could not place the order.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Place an order</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="term" className="text-xs text-[var(--text-secondary)]">
            Term
          </label>
          {/* Options come from the curve, so an invalid term is unreachable through the UI. */}
          <select
            id="term"
            value={termLabel}
            onChange={(event) => setTermLabel(event.target.value)}
            className="rounded-md border border-[var(--grid-line)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {points.map((point) => (
              <option key={point.label} value={point.label}>
                {shortTenor(point.label)} — {formatRate(point.ratePercent)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="amount" className="text-xs text-[var(--text-secondary)]">
            Amount (USD)
          </label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="1,000,000.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={Boolean(error?.fieldErrors.amount)}
            className="w-full rounded-md border border-[var(--grid-line)] bg-[var(--surface-1)] px-3 py-2 text-sm tabular-nums text-[var(--text-primary)] sm:w-48"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {submitting ? 'Placing…' : 'Place order'}
        </button>
      </form>

      {selected && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          Booking at the current published rate for {shortTenor(selected.label)}:{' '}
          {formatRate(selected.ratePercent)}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-[#d03b3b]" role="alert">
          {error.fieldErrors.amount ?? error.message}
        </p>
      )}

      {confirmation && (
        <p className="mt-3 text-sm text-[#0ca30c]" role="status">
          {confirmation}
        </p>
      )}
    </section>
  );
}
