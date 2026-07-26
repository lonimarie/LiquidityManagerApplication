import { Link, Outlet } from '@tanstack/react-router';
import { AppStateProvider, useAppState } from '../AppState';
import OrderModal from './OrderModal';
import UserPicker from './UserPicker';
import YearPicker, {CURRENT_YEAR} from './YearPicker';
import PlaceOrderButton from "./PlaceOrderButton.tsx";

const navLinkClasses =
  'rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[var(--grid-line)] text-[var(--text-secondary)]';

const activeNavLinkClasses = 'bg-[var(--grid-line)] font-medium text-[var(--text-primary)]';

function Chrome() {
  const {
    curve,
    year,
    setYear,
    userId,
    setUserId,
    modalOpen,
    closeModal,
    handlePlaced,
    confirmation,
    isHistorical,
    openModal
  } = useAppState();

  return (
    <div className="min-h-screen bg-[var(--surface-1)]">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Liquidity Manager</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              US Treasury yields and order management
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-end gap-4">
            <YearPicker year={year} onChange={setYear} />
            <UserPicker userId={userId} onChange={setUserId} />
          </div>
          <PlaceOrderButton
              disabled={isHistorical || !curve}
              disabledReason={
                isHistorical
                    ? `You're viewing the ${year} closing curve. Orders always book at the current published rate, so switch the curve year back to ${CURRENT_YEAR} to place one.`
                    : 'The yield curve is still loading.'
              }
              onClick={openModal}
          />
        </header>

        <nav className="mb-8 flex gap-1 border-b border-[var(--grid-line)] pb-3">
          <Link
            to="/"
            className={navLinkClasses}
            activeProps={{ className: `${navLinkClasses} ${activeNavLinkClasses}` }}
            activeOptions={{ exact: true }}
          >
            Yield curve
          </Link>
          <Link
            to="/orders"
            className={navLinkClasses}
            activeProps={{ className: `${navLinkClasses} ${activeNavLinkClasses}` }}
          >
            Order history
          </Link>
        </nav>

        {confirmation && (
          <p
            className="mb-6 rounded-md border border-[var(--grid-line)] px-4 py-3 text-sm text-[#0ca30c]"
            role="status"
          >
            {confirmation}
          </p>
        )}

        <Outlet />

        {curve && (
          <OrderModal
            open={modalOpen}
            onClose={closeModal}
            userId={userId}
            points={curve.points}
            onPlaced={handlePlaced}
          />
        )}
      </main>
    </div>
  );
}

export default function RootLayout() {
  return (
    <AppStateProvider>
      <Chrome />
    </AppStateProvider>
  );
}
