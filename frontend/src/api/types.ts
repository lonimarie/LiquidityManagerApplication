export interface YieldPoint {
  label: string;
  ratePercent: number;
}

export interface YieldCurve {
  date: string;
  points: YieldPoint[];
}

export interface Order {
  id: number;
  termLabel: string;
  amount: number;
  ratePercent: number;
  createdAt: string;
}

export interface OrderPage {
  orders: Order[];
  page: number;
  size: number;
  totalPages: number;
  totalOrders: number;
}

export interface OrderRequest {
  termLabel: string;
  amount: number;
}

export interface ApiError {
  message: string;
  fieldErrors?: Record<string, string>;
}
