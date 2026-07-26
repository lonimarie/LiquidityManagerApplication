import { useEffect, useState } from 'react';
import { useAppState } from '../AppState';
import { fetchOrders } from '../api/orders';
import type { OrderPage } from '../api/types';
import { DEMO_USERS } from '../lib/users';
import OrderHistory from '../components/OrderHistory';

export default function OrdersPage() {
  const { page, setPage, userId, ordersVersion } = useAppState();
  const [orderPage, setOrderPage] = useState<OrderPage | null>(null);

  const userLabel = DEMO_USERS.find((user) => user.id === userId)?.label ?? userId;

  useEffect(() => {
    let active = true;

    fetchOrders(userId, page)
      .then((result) => {
        if (!active) {
          return;
        }
        setOrderPage(result);
        const lastPage = Math.max(result.totalPages - 1, 0);
        if (page > lastPage) {
          setPage(lastPage);
        }
      })
      .catch(() => {
        if (active) {
          setOrderPage(null);
        }
      });

    return () => {
      active = false;
    };
  }, [userId, page, ordersVersion, setPage]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Order history</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Orders placed by {userLabel}</p>
      </div>

      {orderPage ? (
        <OrderHistory page={orderPage} onPageChange={setPage} />
      ) : (
        <div className="h-40 w-full animate-pulse rounded-lg bg-[var(--grid-line)]" />
      )}
    </>
  );
}
