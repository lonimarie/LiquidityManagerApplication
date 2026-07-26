import { useEffect, useRef, useState } from 'react';
import type { Order, YieldPoint } from '../api/types';
import { OrderError, placeOrder } from '../api/orders';
import { formatRate } from '../lib/format';
import { shortTenor } from '../lib/tenor';

/**
 * Validates the amount before it reaches the network, returning the same wording the backend
 * uses so a client-caught and a server-caught rejection read identically.
 */
function validateAmount(raw: string): string | null {
  if (raw.trim() === '') {
    return 'An amount is required';
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 'Enter a valid amount';
  }
  if (value <= 0) {
    return 'Amount must be greater than zero';
  }

  const decimals = raw.split('.')[1];
  if (decimals && decimals.length > 2) {
    return 'Amount cannot have more than two decimal places';
  }

  return null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  points: YieldPoint[];
  onPlaced: (order: Order) => void;
}

export default function OrderModal({ open, onClose, userId, points, onPlaced }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [termLabel, setTermLabel] = useState(points[0]?.label ?? '');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Start from a clean form each time it opens, including after switching user.
  useEffect(() => {
    if (open) {
      setTermLabel(points[0]?.label ?? '');
      setAmount('');
      setAmountError(null);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, userId, points]);

  const selected = points.find((point) => point.label === termLabel);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const problem = validateAmount(amount);
    setAmountError(problem);
    setFormError(null);
    if (problem) {
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeOrder(userId, { termLabel, amount: Number(amount) });
      onPlaced(order);
      onClose();
    } catch (e) {
      const failure = e instanceof OrderError ? e : new OrderError('Could not place the order.');
      if (failure.fieldErrors.amount) {
        setAmountError(failure.fieldErrors.amount);
      } else {
        setFormError(failure.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="order-modal-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-[var(--grid-line)] bg-[var(--surface-1)] p-0 backdrop:bg-black/50"
    >
      <div className="p-6" onClick={(event) => event.stopPropagation()}>
        <h2
          id="order-modal-title"
          className="text-base font-semibold text-[var(--text-primary)]"
        >
          Place an order
        </h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Booked at the currently published par yield for the selected term.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="term" className="text-xs text-[var(--text-secondary)]">
              Term
            </label>
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
              placeholder="1,000,000.00"
              value={amount}
              autoFocus
              onChange={(event) => {
                setAmount(event.target.value);
                if (amountError) {
                  setAmountError(null);
                }
              }}
              aria-invalid={Boolean(amountError)}
              aria-describedby={amountError ? 'amount-error' : undefined}
              className="rounded-md border border-[var(--grid-line)] bg-[var(--surface-1)] px-3 py-2 text-sm tabular-nums text-[var(--text-primary)]"
            />
            {amountError && (
              <p id="amount-error" className="text-xs text-[#d03b3b]" role="alert">
                {amountError}
              </p>
            )}
          </div>

          {selected && (
            <p className="text-xs text-[var(--text-secondary)]">
              Rate to be booked: {formatRate(selected.ratePercent)} ({shortTenor(selected.label)})
            </p>
          )}

          {formError && (
            <p className="text-sm text-[#d03b3b]" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-[var(--grid-line)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--grid-line)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-colors enabled:cursor-pointer enabled:hover:bg-[var(--series-1-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Placing…' : 'Place order'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
