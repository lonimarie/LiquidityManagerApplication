import type { YieldPoint } from '../api/types';
import { shortTenor } from '../lib/tenor';

interface Props {
  points: YieldPoint[];
}

/**
 * Exact values alongside the chart
 */
export default function YieldTable({ points }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--grid-line)] text-left">
            <th className="py-2 pr-4 font-medium text-[var(--text-secondary)]">Term</th>
            <th className="py-2 text-right font-medium text-[var(--text-secondary)]">
              Par yield
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.label} className="border-b border-[var(--grid-line)] last:border-0">
              <td className="py-2 pr-4 text-[var(--text-primary)]">{shortTenor(point.label)}</td>
              <td className="py-2 text-right tabular-nums text-[var(--text-primary)]">
                {point.ratePercent.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
