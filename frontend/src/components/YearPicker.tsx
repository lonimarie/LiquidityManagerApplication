/** Treasury's daily curve series begins in 1990; mirrors TreasuryYieldClient.EARLIEST_YEAR. */
const EARLIEST_YEAR = 1990;

export const CURRENT_YEAR = new Date().getFullYear();

const YEARS = Array.from(
  { length: CURRENT_YEAR - EARLIEST_YEAR + 1 },
  (_, index) => CURRENT_YEAR - index,
);

interface Props {
  year: number;
  onChange: (year: number) => void;
}

export default function YearPicker({ year, onChange }: Props) {
  return (
    <div className="flex flex-col items-start gap-1">
      <label htmlFor="year-picker" className="text-xs font-medium text-[var(--text-secondary)]">
        Curve year
      </label>
      <select
        id="year-picker"
        value={year}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border border-[var(--grid-line)] bg-[var(--surface-1)] px-3 py-1.5 text-sm tabular-nums text-[var(--text-primary)]"
      >
        {YEARS.map((option) => (
          <option key={option} value={option}>
            {option}
            {option === CURRENT_YEAR ? ' (latest)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
