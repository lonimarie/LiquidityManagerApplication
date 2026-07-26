import type { OrderPage } from '../api/types';
import { formatCurrency, formatDateTime, formatRate } from '../lib/format';
import { shortTenor } from '../lib/tenor';

interface Props {
  page: OrderPage;
  onPageChange: (page: number) => void;
}

export default function OrderHistory({ page, onPageChange }: Props) {
  const { orders, totalPages, totalOrders } = page;
  const hasPrevious = page.page > 0;
  const hasNext = page.page < totalPages - 1;

  const firstRow = page.page * page.size + 1;
  const lastRow = page.page * page.size + orders.length;

  return (
    <section>
      {totalOrders > 0 && orders.length > 0 && (
        <p className="mb-3 text-right text-xs tabular-nums text-[var(--text-secondary)]">
          Showing {firstRow}–{lastRow} of {totalOrders}
        </p>
      )}

      {totalOrders === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">
          No orders yet for this user. Place one above.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--grid-line)] text-left">
                  <th className="py-2 pr-4 font-medium text-[var(--text-secondary)]">Term</th>
                  <th className="py-2 pr-4 text-right font-medium text-[var(--text-secondary)]">
                    Amount
                  </th>
                  <th className="py-2 pr-4 text-right font-medium text-[var(--text-secondary)]">
                    Rate booked
                  </th>
                  <th className="py-2 text-right font-medium text-[var(--text-secondary)]">
                    Placed
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--grid-line)] last:border-0"
                  >
                    <td className="py-2 pr-4 text-[var(--text-primary)]">
                      {shortTenor(order.termLabel)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[var(--text-primary)]">
                      {formatRate(order.ratePercent)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-[var(--text-secondary)]">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="mt-4 flex items-center justify-end gap-3" aria-label="Order history pages">
            <button
              type="button"
              onClick={() => onPageChange(page.page - 1)}
              disabled={!hasPrevious}
              aria-label="Previous page"
              className="rounded-md border border-[var(--grid-line)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-colors enabled:cursor-pointer enabled:hover:bg-[var(--grid-line)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ Previous
            </button>
            <span className="text-xs tabular-nums text-[var(--text-secondary)]">
              Page {page.page + 1} of {Math.max(totalPages, 1)}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page.page + 1)}
              disabled={!hasNext}
              aria-label="Next page"
              className="rounded-md border border-[var(--grid-line)] px-3 py-1.5 text-sm text-[var(--text-primary)] transition-colors enabled:cursor-pointer enabled:hover:bg-[var(--grid-line)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next ›
            </button>
          </nav>
        </>
      )}
    </section>
  );
}
