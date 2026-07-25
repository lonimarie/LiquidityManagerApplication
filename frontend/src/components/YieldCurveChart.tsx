import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { YieldPoint } from '../api/types';
import { shortTenor } from '../lib/tenor';

/**
 * Pads the y-domain around the observed range
 */
function yDomain(points: YieldPoint[]): [number, number] {
  const rates = points.map((point) => point.ratePercent);
  const padding = 0.15;
  return [
    Math.floor((Math.min(...rates) - padding) * 10) / 10,
    Math.ceil((Math.max(...rates) + padding) * 10) / 10,
  ];
}

interface Props {
  points: YieldPoint[];
}

export default function YieldCurveChart({ points }: Props) {
  const data = points.map((point) => ({ ...point, tenor: shortTenor(point.label) }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--grid-line)" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="tenor"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            stroke="var(--grid-line)"
            interval="preserveStartEnd"
          />
          {/* Ticks carry the unit, so no rotated axis label is needed. */}
          <YAxis
            domain={yDomain(points)}
            tickFormatter={(value: number) => `${value.toFixed(1)}%`}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            stroke="var(--grid-line)"
            width={52}
          />
          <Tooltip
            cursor={{ stroke: 'var(--text-secondary)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--surface-1)',
              border: '1px solid var(--grid-line)',
              borderRadius: '0.5rem',
              color: 'var(--text-primary)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--text-secondary)' }}

            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Par yield']}
          />
          <Line
            type="monotone"
            dataKey="ratePercent"
            stroke="var(--series-1)"
            strokeWidth={2}

            isAnimationActive={false}
            dot={{ r: 4, fill: 'var(--series-1)', strokeWidth: 0 }}
            activeDot={{ r: 6, fill: 'var(--series-1)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
