/** Mirrors com.project.liquidity.yields.YieldPoint */
export interface YieldPoint {
  label: string;
  months: number;
  ratePercent: number;
}

/** Mirrors com.project.liquidity.yields.YieldCurve */
export interface YieldCurve {
  date: string;
  points: YieldPoint[];
}
