const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

export function formatDateTime(isoInstant: string): string {
  return dateTime.format(new Date(isoInstant));
}

export function formatRate(ratePercent: number): string {
  return `${ratePercent.toFixed(2)}%`;
}
