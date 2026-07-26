import { useAppState } from '../AppState';
import YieldCurveChart from '../components/YieldCurveChart';
import YieldTable from '../components/YieldTable';

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function YieldCurvePage() {
  const { curve, curveLoading, curveError, reloadCurve, isHistorical } = useAppState();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Par yield curve</h2>
        {curve && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {isHistorical ? 'Closing curve' : 'As of'} {formatDate(curve.date)}
          </p>
        )}
      </div>

      {curveLoading && <div className="h-80 w-full animate-pulse rounded-lg bg-[var(--grid-line)]" />}

      {curveError && !curveLoading && (
        <div className="rounded-lg border border-[var(--grid-line)] p-6">
          <p className="text-sm text-[var(--text-primary)]">{curveError}</p>
          <button
            type="button"
            onClick={reloadCurve}
            className="mt-4 cursor-pointer rounded-md bg-[var(--action)] px-4 py-2 text-sm font-medium text-[var(--action-text)] transition-colors hover:bg-[var(--action-hover)]"
          >
            Retry
          </button>
        </div>
      )}

      {curve && !curveLoading && !curveError && (
        <div className="space-y-10">
          <YieldCurveChart points={curve.points} />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
              All published rates{' '}
              <span className="font-normal tabular-nums text-[var(--text-secondary)]">
                ({curve.date.slice(0, 4)})
              </span>
            </h3>
            <YieldTable points={curve.points} />
          </div>
        </div>
      )}
    </>
  );
}
