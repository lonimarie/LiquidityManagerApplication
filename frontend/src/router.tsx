import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import RootLayout from './components/RootLayout';
import YieldCurvePage from './pages/YieldCurvePage';
import OrdersPage from './pages/OrdersPage';
import { CURRENT_YEAR, EARLIEST_YEAR } from './components/YearPicker';

/**
 * View state lives in the URL so a reload keeps its place and the back button steps through
 * pages instead of leaving the app.
 */
const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>): { year?: number } => {
    if (search.year === undefined || search.year === '') {
      return {};
    }
    const parsed = Number(search.year);
    if (!Number.isFinite(parsed)) {
      return {};
    }
    const year = Math.trunc(parsed);
    return { year: Math.min(Math.max(year, EARLIEST_YEAR), CURRENT_YEAR) };
  },
  component: RootLayout,
});

const yieldCurveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: YieldCurvePage,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const parsed = Number(search.page);
    return Number.isFinite(parsed) && parsed > 0 ? { page: Math.trunc(parsed) } : {};
  },
  component: OrdersPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([yieldCurveRoute, ordersRoute]),
});

export { ordersRoute, yieldCurveRoute };

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
