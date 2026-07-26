import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { fetchYieldCurve } from './api/yieldCurve';
import type { Order, YieldCurve } from './api/types';
import { CURRENT_YEAR } from './components/YearPicker';
import { formatCurrency, formatRate } from './lib/format';
import { shortTenor } from './lib/tenor';
import { loadUserId, saveUserId } from './lib/users';

/**
 * State shared by both routes. It lives above the router outlet so that switching pages keeps
 * the selected user, curve year and any confirmation intact
 */
interface AppState {
  curve: YieldCurve | null;
  curveLoading: boolean;
  curveError: string | null;
  reloadCurve: () => void;

  year: number;
  setYear: (year: number) => void;
  isHistorical: boolean;

  userId: string;
  setUserId: (userId: string) => void;

  page: number;
  setPage: (page: number) => void;
  /** Bumped when an order is placed, so the orders page refetches if it is mounted. */
  ordersVersion: number;

  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  confirmation: string | null;
  handlePlaced: (order: Order) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return state;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [curve, setCurve] = useState<YieldCurve | null>(null);
  const [curveError, setCurveError] = useState<string | null>(null);
  const [curveLoading, setCurveLoading] = useState(true);

  const [userId, setUserIdState] = useState(loadUserId);
  const [ordersVersion, setOrdersVersion] = useState(0);

  const navigate = useNavigate();
  const search = useLocation().search as { year?: number; page?: number };
  const year = search.year ?? CURRENT_YEAR;
  const page = search.page ?? 0;
  const isHistorical = year !== CURRENT_YEAR;

  const setYear = useCallback(
    (next: number) => {
      navigate({
        to: '.',
        search: (prev) => ({ ...prev, year: next === CURRENT_YEAR ? undefined : next }),
      });
    },
    [navigate],
  );

  const setPage = useCallback(
    (next: number) => {
      navigate({ to: '.', search: (prev) => ({ ...prev, page: next > 0 ? next : undefined }) });
    },
    [navigate],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const reloadCurve = useCallback(() => {
    setCurveLoading(true);
    setCurveError(null);
    fetchYieldCurve(year)
      .then(setCurve)
      .catch((e: Error) => setCurveError(e.message))
      .finally(() => setCurveLoading(false));
  }, [year]);

  useEffect(reloadCurve, [reloadCurve]);

  const setUserId = useCallback(
    (next: string) => {
      setUserIdState(next);
      saveUserId(next);
      setPage(0);
      setConfirmation(null);
    },
    [setPage],
  );

  const handlePlaced = useCallback(
    (order: Order) => {
      setConfirmation(
        `Order placed: ${formatCurrency(order.amount)} at ${shortTenor(order.termLabel)} — ${formatRate(order.ratePercent)}`,
      );

      setPage(0);
      setOrdersVersion((version) => version + 1);
    },
    [setPage],
  );

  const value = useMemo<AppState>(
    () => ({
      curve,
      curveLoading,
      curveError,
      reloadCurve,
      year,
      setYear,
      isHistorical,
      userId,
      setUserId,
      page,
      setPage,
      ordersVersion,
      modalOpen,
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
      confirmation,
      handlePlaced,
    }),
    [
      curve,
      curveLoading,
      curveError,
      reloadCurve,
      year,
      setYear,
      isHistorical,
      userId,
      setUserId,
      page,
      setPage,
      ordersVersion,
      modalOpen,
      confirmation,
      handlePlaced,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
