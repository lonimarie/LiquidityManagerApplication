import type { YieldCurve } from './types';

export async function fetchYieldCurve(year?: number): Promise<YieldCurve> {
  const url = year === undefined ? '/api/yield-curve' : `/api/yield-curve?year=${year}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? 'Treasury data is currently unavailable.'
        : `Could not load the yield curve (${response.status}).`,
    );
  }

  return response.json();
}
