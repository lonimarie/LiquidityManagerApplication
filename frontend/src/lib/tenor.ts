/**
 * Treasury publishes one odd label ("1.5 Month") among otherwise abbreviated tenors
 * ("1 Mo", "10 Yr"). Normalise it so the chart axis and the table read consistently.
 */
export function shortTenor(label: string): string {
  return label.replace(/Months?$/, 'Mo').replace(/Years?$/, 'Yr');
}
