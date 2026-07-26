interface Props {
  disabled: boolean;
  disabledReason: string;
  onClick: () => void;
}

export default function PlaceOrderButton({ disabled, disabledReason, onClick }: Props) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-describedby={disabled ? 'place-order-disabled-reason' : undefined}
        className="rounded-md bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-colors enabled:cursor-pointer enabled:hover:bg-[var(--series-1-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--series-1)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Place order
      </button>

      {disabled && (
        <span
          id="place-order-disabled-reason"
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-10 mt-2 hidden w-64 rounded-md border border-[var(--grid-line)] bg-[var(--surface-1)] px-3 py-2 text-xs font-normal text-[var(--text-primary)] shadow-lg group-hover:block"
        >
          {disabledReason}
        </span>
      )}
    </span>
  );
}
