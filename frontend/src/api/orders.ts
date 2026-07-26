import type { ApiError, Order, OrderPage, OrderRequest } from './types';

/**
 * Thrown for a rejected request, carrying the per-field messages the backend supplies so the
 * form can show them inline.
 */
export class OrderError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'OrderError';
    this.fieldErrors = fieldErrors;
  }
}

function headers(userId: string, withBody = false): HeadersInit {
  return withBody
    ? { 'Content-Type': 'application/json', 'X-User-Id': userId }
    : { 'X-User-Id': userId };
}

async function toOrderError(response: Response): Promise<OrderError> {
  try {
    const body: ApiError = await response.json();
    return new OrderError(body.message ?? `Request failed (${response.status}).`, body.fieldErrors);
  } catch {
    return new OrderError(`Request failed (${response.status}).`);
  }
}

export async function fetchOrders(userId: string, page = 0): Promise<OrderPage> {
  const response = await fetch(`/api/orders?page=${page}`, { headers: headers(userId) });

  if (!response.ok) {
    throw await toOrderError(response);
  }

  return response.json();
}

export async function placeOrder(userId: string, request: OrderRequest): Promise<Order> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: headers(userId, true),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await toOrderError(response);
  }

  return response.json();
}
