import type { YieldCurve } from './types';

export async function fetchYieldCurve(): Promise<YieldCurve> {
  const response = await fetch('/api/yield-curve');

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? 'Treasury data is currently unavailable.'
        : `Could not load the yield curve (${response.status}).`,
    );
  }

  return response.json();
}
